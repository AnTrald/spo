```
git clone https://github.com/AnTrald/spo
```

Для запуска фронта:
```
cd frontend
npm install
npm run dev
```

Для запуска бэка:
```
cd backend
py -3.12 -m venv venv
pip install -r requirements.txt
uvicorn main:app --reload
```
