import requests
from fastapi import HTTPException
from typing import Optional, Dict


class NalogRuPython:
    _instance = None

    HOST = 'irkkt-mobile.nalog.ru:8888'
    DEVICE_OS = 'iOS'
    CLIENT_VERSION = '2.9.0'
    DEVICE_ID = '7C82010F-16CC-446B-8F66-FC4080C66521'
    ACCEPT = '*/*'
    USER_AGENT = 'billchecker/2.9.0 (iPhone; iOS 13.6; Scale/2.00)'
    ACCEPT_LANGUAGE = 'ru-RU;q=1, en-US;q=0.9'
    CLIENT_SECRET = 'IyvrAbKt9h/8p6a7QPh8gpkXYQ4='
    OS = 'Android'

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NalogRuPython, cls).__new__(cls)
        return cls._instance

    async def request_sms(self, phone: str) -> bool:
        url = f'https://{self.HOST}/v2/auth/phone/request'
        payload = {
            'phone': phone,
            'client_secret': self.CLIENT_SECRET,
            'os': self.OS
        }

        try:
            resp = requests.post(url, json=payload, headers=self._get_headers())
            return resp.status_code == 204
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def verify_sms(self, phone: str, code: str) -> Dict[str, str]:
        url = f'https://{self.HOST}/v2/auth/phone/verify'
        payload = {
            'phone': phone,
            'client_secret': self.CLIENT_SECRET,
            'code': code,
            "os": self.OS
        }

        try:
            resp = requests.post(url, json=payload, headers=self._get_headers())
            data = resp.json()
            return {
                'session_id': data['sessionId'],
                'refresh_token': data['refresh_token']
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail="Неверный код подтверждения")

    async def refresh_session(self, refresh_token: str) -> dict:
        url = f'https://{self.HOST}/v2/mobile/users/refresh'
        payload = {
            'refresh_token': refresh_token,
            'client_secret': self.CLIENT_SECRET
        }

        resp = requests.post(url, json=payload, headers=self._get_headers())
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid refresh token")

        data = resp.json()
        return {
            'session_id': data['sessionId'],
            'refresh_token': data['refresh_token']
        }

    async def get_ticket(self, qr: str, session_id: str) -> dict:
        if not session_id:
            raise HTTPException(status_code=401, detail="Требуется авторизация")

        ticket_id = await self._get_ticket_id(qr, session_id)
        url = f'https://{self.HOST}/v2/tickets/{ticket_id}'
        headers = self._get_headers()
        headers['sessionId'] = session_id

        try:
            resp = requests.get(url, headers=headers)
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def _get_ticket_id(self, qr: str, session_id: str) -> str:
        url = f'https://{self.HOST}/v2/ticket'
        payload = {'qr': qr}
        headers = self._get_headers()
        headers['sessionId'] = session_id

        try:
            resp = requests.post(url, json=payload, headers=headers)
            return resp.json()["id"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def _get_headers(self) -> dict:
        return {
            'Host': self.HOST,
            'Accept': self.ACCEPT,
            'Device-OS': self.DEVICE_OS,
            'Device-Id': self.DEVICE_ID,
            'clientVersion': self.CLIENT_VERSION,
            'Accept-Language': self.ACCEPT_LANGUAGE,
            'User-Agent': self.USER_AGENT,
        }