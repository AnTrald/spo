from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pyzbar.pyzbar import decode
from PIL import Image
from pydantic import BaseModel
import psycopg2
import bcrypt
import re

app = FastAPI()

# Настройка CORS
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

class QRData(BaseModel):
    qr_string: str
    phone: str

class SMSCode(BaseModel):
    code: str
    session_id: str

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
    # Валидация номера телефона
    if not validate_phone(user.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    conn = get_db()
    cur = conn.cursor()

    try:
        # Проверка существования username или phone
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
        # Ищем пользователя по username или phone
        cur.execute("SELECT * FROM users WHERE username = %s OR phone = %s",
                   (user.login, user.login))
        db_user = cur.fetchone()

        if not db_user:
            raise HTTPException(status_code=400, detail="Invalid credentials")

        if not bcrypt.checkpw(user.password.encode('utf-8'), db_user[2].encode('utf-8')):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        return {"success": True, "username": db_user[1]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@app.post("/api/scan-qr")
async def scan_qr(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=422, detail="Файл должен быть изображением")

        decoded_objects = decode(Image.open(file.file))
        if not decoded_objects:
            raise HTTPException(status_code=400, detail="QR-код не найден на изображении")

        qr_data = str(decoded_objects[0][0])[2:-1:]
        #t=20250526T1641&s=8226.86&fn=7384440800112922&i=36325&fp=4269430933&n=1
        if not validate_fiscal_qr(qr_data):
            raise HTTPException(status_code=400, detail="QR-код не соответствует фискальному формату")

        return {
            "qr_data": qr_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки QR-кода: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)