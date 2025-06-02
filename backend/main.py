from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form
from nalog_python import NalogRuPython
from fastapi.middleware.cors import CORSMiddleware
from pyzbar.pyzbar import decode
from PIL import Image
from pydantic import BaseModel
from typing import List
import json
import psycopg2
import bcrypt
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = psycopg2.connect(
        dbname="auth_system",
        user="postgres",
        password="avt223450",
        host="localhost"
    )
    return conn

class UserRegister(BaseModel):
    username: str
    phone: str
    password: str

class UserLogin(BaseModel):
    login: str  # Может быть username или phone
    password: str


class SmsRequest(BaseModel):
    phone: str

class SmsVerify(BaseModel):
    phone: str
    code: str

class RefreshTokenRequest(BaseModel):
    username: str
    refresh_token: str

class VerifySmsRequest(BaseModel):
    username: str
    phone: str
    code: str

class CheckSessionRequest(BaseModel):
    username: str

class ReportCreate(BaseModel):
    owner_username: str
    recipient_username: str
    ticketId: str
    total_sum: float
    participants_count: int
    items: List[dict]

def get_nalog_client():
    return NalogRuPython()


def validate_phone(phone: str) -> bool:
    pattern = r'^\+?\d{10,15}$'
    return re.match(pattern, phone) is not None


def validate_fiscal_qr(qr_string: str) -> bool:
    qr_string = qr_string.strip()


    required_fields = ['t=', 's=', 'fn=', 'i=', 'fp=']
    if not all(field in qr_string for field in required_fields):
        return False

    qr_string = qr_string.split('&')
    for field in qr_string:
        field = field.split('=')[1]
        if 'T' in field:
            for elem in field.split('T'):
                if not elem.isdigit():
                    return False
        elif '.' in field:
            for elem in field.split('.'):
                if not elem.isdigit():
                    return False
        else:
            if not field.isdigit():
                return False
    return True

@app.post("/api/register")
async def register(user: UserRegister):
    if not validate_phone(user.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM users WHERE username = %s OR phone = %s",
                   (user.username, f'+7{user.phone}'))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="User with this username or phone already exists")

        hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

        cur.execute(
            "INSERT INTO users (username, phone, password) VALUES (%s, %s, %s)",
            (user.username, user.phone, hashed_password.decode('utf-8'))
        )
        conn.commit()
        return {"success": True}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/api/login")
async def login(user: UserLogin):
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM users WHERE username = %s OR phone = %s",
                   (user.login, user.login))
        db_user = cur.fetchone()

        if not db_user:
            raise HTTPException(status_code=400, detail="Invalid credentials")

        if not bcrypt.checkpw(user.password.encode('utf-8'), db_user[2].encode('utf-8')):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        return {
            "success": True,
            "username": db_user[1],
            "phone": db_user[4]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.post("/api/request-sms")
async def request_sms(
        sms_request: SmsRequest,
        client: NalogRuPython = Depends(get_nalog_client)
):
    try:
        if not validate_phone(sms_request.phone):
            raise HTTPException(status_code=400, detail="Неверный формат номера телефона")

        success = await client.request_sms(sms_request.phone)
        if not success:
            raise HTTPException(status_code=400, detail="Не удалось отправить SMS")

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/verify-sms")
async def verify_sms(
        sms_verify: SmsVerify,
        client: NalogRuPython = Depends(get_nalog_client)
):
    try:
        tokens = await client.verify_sms(sms_verify.phone, sms_verify.code)
        return {
            "success": True,
            "session_id": tokens['session_id'],
            "refresh_token": tokens['refresh_token']
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/check-session")
async def check_session(request: CheckSessionRequest):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT refresh_token FROM user_sessions WHERE username = %s", (request.username,))
        result = cur.fetchone()
        return {"has_session": bool(result), "refresh_token": result[0] if result else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.post("/api/refresh-session")
async def refresh_session(
        request: RefreshTokenRequest,
        client: NalogRuPython = Depends(get_nalog_client)):
    try:
        tokens = await client.refresh_session(request.refresh_token)

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE user_sessions SET refresh_token = %s WHERE username = %s",
            (tokens['refresh_token'], request.username)
        )
        conn.commit()

        return tokens
    except HTTPException as e:
        if e.status_code == 400:
            conn = get_db()
            cur = conn.cursor()
            cur.execute("DELETE FROM user_sessions WHERE username = %s", (request.username,))
            conn.commit()
        raise e


@app.post("/api/save-session")
async def save_session(
        request: VerifySmsRequest,
        client: NalogRuPython = Depends(get_nalog_client)):
    try:
        tokens = await client.verify_sms(request.phone, request.code)

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO user_sessions (username, refresh_token) VALUES (%s, %s) "
            "ON CONFLICT (username) DO UPDATE SET refresh_token = EXCLUDED.refresh_token",
            (request.username, tokens['refresh_token'])
        )
        conn.commit()

        return tokens
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scan-qr")
async def scan_qr(
        file: UploadFile = File(...),
        session_id: str = Form(...),
        client: NalogRuPython = Depends(get_nalog_client)
):
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=422, detail="Файл должен быть изображением")

        decoded_objects = decode(Image.open(file.file))
        if not decoded_objects:
            raise HTTPException(status_code=400, detail="QR-код не найден на изображении")

        qr_data = str(decoded_objects[0][0])[2:-1:]

        if not validate_fiscal_qr(qr_data):
            raise HTTPException(status_code=400, detail="QR-код не соответствует фискальному формату")

        ticket_data = await client.get_ticket(qr_data, session_id)
        return ticket_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки QR-кода: {str(e)}")


@app.post("/api/save-report")
async def save_report(report: ReportCreate):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM users WHERE username = %s",
                   (report.owner_username,))
        if not cur.fetchone():
            raise HTTPException(status_code=400, detail="User not found")

        cur.execute("SELECT id FROM reports WHERE ticketId = %s",
                   (report.ticketId,))
        existing_report = cur.fetchone()

        if existing_report:
            cur.execute(
                """UPDATE reports SET
                   owner_username = %s,
                   recipient_username = %s,
                   total_sum = %s,
                   participants_count = %s,
                   items = %s,
                   created_at = CURRENT_TIMESTAMP
                   WHERE ticketId = %s
                   RETURNING id""",
                (
                    report.owner_username,
                    report.recipient_username,
                    report.total_sum,
                    report.participants_count,
                    json.dumps(report.items),
                    report.ticketId
                )
            )
            action = "updated"
        else:
            cur.execute(
                """INSERT INTO reports 
                (owner_username, recipient_username, ticketId, total_sum, participants_count, items) 
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id""",
                (
                    report.owner_username,
                    report.recipient_username,
                    report.ticketId,
                    report.total_sum,
                    report.participants_count,
                    json.dumps(report.items)
                )
            )
            action = "created"

        report_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "report_id": report_id, "action": action}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.get("/api/reports/by-ticket/{ticketId}")
async def check_exist_user_report_by_id(ticketId: str):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT * FROM reports WHERE ticketId = %s ORDER BY created_at DESC",
            (ticketId,)
        )
        report = cur.fetchone()
        if report:
            return True
        return False
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/api/reports/by-user/{username}")
async def get_user_reports(username: str):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT * FROM reports WHERE owner_username = %s ORDER BY created_at DESC",
            (username,)
        )
        reports = cur.fetchall()
        return [
            {
                "id": r[0],
                "owner": r[1],
                "recipient": r[2],
                "ticketId": r[3],
                "total_sum": float(r[4]),
                "date": r[7].strftime("%Y-%m-%d %H:%M"),
                "participants_count": r[5]
            }
            for r in reports
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/api/reports/by-id/{id}")
async def get_user_report(id: int):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT * FROM reports WHERE id = %s ORDER BY created_at DESC",
            (id,)
        )
        report = cur.fetchone()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return {
            "data": report[6],
            "participants_count": report[5]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)