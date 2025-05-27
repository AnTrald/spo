import requests
from fastapi import HTTPException
from datetime import datetime, timedelta


class NalogRuPython:
    HOST = 'irkkt-mobile.nalog.ru:8888'
    DEVICE_OS = 'iOS'
    CLIENT_VERSION = '2.9.0'
    DEVICE_ID = '7C82010F-16CC-446B-8F66-FC4080C66521'
    ACCEPT = '*/*'
    USER_AGENT = 'billchecker/2.9.0 (iPhone; iOS 13.6; Scale/2.00)'
    ACCEPT_LANGUAGE = 'ru-RU;q=1, en-US;q=0.9'
    CLIENT_SECRET = 'IyvrAbKt9h/8p6a7QPh8gpkXYQ4='
    OS = 'Android'

    def __init__(self):
        self.__session_id = None
        self.__refresh_token = None
        self.__phone = None

    async def request_sms(self, phone: str) -> bool:
        """Запрос SMS-кода"""
        self.__phone = phone
        url = f'https://{self.HOST}/v2/auth/phone/request'
        payload = {
            'phone': self.__phone,
            'client_secret': self.CLIENT_SECRET,
            'os': self.OS
        }

        try:
            resp = requests.post(url, json=payload, headers=self._get_headers())
            return resp.status_code == 204
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def verify_sms(self, code: str) -> str:
        """Подтверждение SMS-кода"""
        url = f'https://{self.HOST}/v2/auth/phone/verify'
        payload = {
            'phone': self.__phone,
            'client_secret': self.CLIENT_SECRET,
            'code': code,
            "os": self.OS
        }

        try:
            resp = requests.post(url, json=payload, headers=self._get_headers())
            data = resp.json()
            self.__session_id = data['sessionId']
            self.__refresh_token = data['refresh_token']
            return self.__session_id
        except Exception as e:
            raise HTTPException(status_code=400, detail="Неверный код подтверждения")

    async def get_ticket(self, qr: str) -> dict:
        """Получение данных чека"""
        if not self.__session_id:
            raise HTTPException(status_code=401, detail="Требуется авторизация")

        ticket_id = await self._get_ticket_id(qr)
        url = f'https://{self.HOST}/v2/tickets/{ticket_id}'
        headers = self._get_headers()
        headers['sessionId'] = self.__session_id

        try:
            resp = requests.get(url, headers=headers)
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def _get_ticket_id(self, qr: str) -> str:
        """Получение ID чека"""
        url = f'https://{self.HOST}/v2/ticket'
        payload = {'qr': qr}
        headers = self._get_headers()
        headers['sessionId'] = self.__session_id

        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()["id"]

    def _get_headers(self) -> dict:
        """Базовые заголовки запросов"""
        return {
            'Host': self.HOST,
            'Accept': self.ACCEPT,
            'Device-OS': self.DEVICE_OS,
            'Device-Id': self.DEVICE_ID,
            'clientVersion': self.CLIENT_VERSION,
            'Accept-Language': self.ACCEPT_LANGUAGE,
            'User-Agent': self.USER_AGENT,
        }