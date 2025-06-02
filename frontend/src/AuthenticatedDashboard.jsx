import { useState } from 'react';
import ReceiptItems from './components/ReceiptItems.jsx';
import ReportsList from "./components/ReportsList.jsx";

export default function AuthenticatedDashboard({ userData, onLogout }) {
    const [showScanner, setShowScanner] = useState(false);
    const [file, setFile] = useState(null);
    const [smsCode, setSmsCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSmsRequested, setIsSmsRequested] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [showReceiptItems, setShowReceiptItems] = useState(false);
    const [showReportsList, setShowReportsList] = useState(false);


    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSmsCodeChange = (e) => {
        setSmsCode(e.target.value);
    };
    //userdata хранит в себе только username и phone
    const handleStartScanning = async () => {
        try {
            setIsLoading(true);
            setError('');

            const checkResponse = await fetch('http://localhost:8000/api/check-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userData.username })
            });

            const { has_session, refresh_token } = await checkResponse.json();

            if (has_session) {
                try {
                    const refreshResponse = await fetch('http://localhost:8000/api/refresh-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: userData.username,
                            refresh_token
                        })
                    });

                    if (refreshResponse.ok) {
                        const { session_id } = await refreshResponse.json();
                        setShowScanner(true);
                        return;
                    }
                } catch (refreshError) {
                    console.log('Не удалось обновить сессию:', refreshError);
                }
            }

            const smsResponse = await fetch('http://localhost:8000/api/request-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: userData.phone })
            });

            if (!smsResponse.ok) throw new Error('Ошибка при запросе SMS');
            setIsSmsRequested(true);
            setShowScanner(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
        console.log(isSmsRequested)
        console.log(!smsCode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Пожалуйста, выберите файл');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let sessionId;
            if (smsCode) {
                const verifyResponse = await fetch('http://localhost:8000/api/save-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: userData.username,
                        phone: userData.phone,
                        code: smsCode
                    })
                });

                if (!verifyResponse.ok) {
                    const errorData = await verifyResponse.json();
                    throw new Error(errorData.detail || 'Ошибка верификации SMS');
                }

                const { session_id } = await verifyResponse.json();
                sessionId = session_id;
            } else {
                // Используем существующую сессию
                const checkResponse = await fetch('http://localhost:8000/api/check-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: userData.username })
                });

                const { refresh_token } = await checkResponse.json();

                const refreshResponse = await fetch('http://localhost:8000/api/refresh-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: userData.username,
                        refresh_token
                    })
                });

                if (!refreshResponse.ok) {
                    throw new Error('Сессия истекла. Пожалуйста, введите SMS-код');
                }

                const { session_id } = await refreshResponse.json();
                sessionId = session_id;
            }

            // Сканируем QR
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', sessionId);
            const scanResponse = await fetch('http://localhost:8000/api/scan-qr', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionId}`
                },
                body: formData
            });

            if (!scanResponse.ok) {
                throw new Error('Ошибка сканирования QR');
            }

            const result = await scanResponse.json();
            console.log('Результат сканирования:', result);
            setScanResult(result);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (showReceiptItems) {
        return (
            <ReceiptItems
                username={userData.username}
                ticket={scanResult?.ticket}
                ticketId = {scanResult?.id}
                onBack={() => {
                    setShowReceiptItems(false);
                    setScanResult(null);
                    setFile(null);
                }}
            />
        );
    }

    if (showReportsList) {
        return (
            <ReportsList
                username={userData.username}
                onBack={() => setShowReportsList(false)}
            />
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">ДелиЧек</h1>
                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-8 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <h2 className="text-xl font-semibold text-center text-[var(--primary)] dark:text-[var(--secondary)] mb-6">
                        Добро пожаловать, <span className="text-[var(--text-light)] dark:text-[var(--text-dark)]">{userData.username}</span>!
                    </h2>

                    {!showScanner ? (
                        <div className="space-y-6">
                            <button
                                onClick={handleStartScanning}
                                disabled={isLoading}
                                className={`w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white py-3 px-4 rounded-lg transition duration-200 shadow-md ${
                                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {isLoading
                                    ? (isSmsRequested ? 'Отправка SMS...' : 'Получение refresh-токена')
                                    : 'Начать сканирование'
                                }
                            </button>
                            <button
                                onClick={() => setShowReportsList(true)}
                                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white py-3 px-4 rounded-lg transition duration-200 shadow-md"
                            >
                                Посмотреть прошлые отчеты
                            </button>
                            <button
                                onClick={onLogout}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md"
                            >
                                Выйти из аккаунта
                            </button>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <h3 className="text-lg font-medium mb-4 text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                Загрузите QR-код из чека
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-lg file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-[var(--primary)] file:text-white
                                            hover:file:bg-[var(--primary-dark)]
                                            dark:file:bg-[var(--secondary)] dark:hover:file:bg-[var(--secondary-dark)]"
                                    />
                                    <p className="text-xs text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                        Поддерживаемые форматы: JPG, PNG
                                    </p>
                                </div>

                                {isSmsRequested && (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Введите SMS-код"
                                            value={smsCode}
                                            onChange={handleSmsCodeChange}
                                            required
                                            className="w-full px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]"
                                        />
                                        <p className="text-xs mt-1 text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                            Код отправлен на номер {userData.phone}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || !file || (isSmsRequested && !smsCode)}
                                    className={`w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white py-3 px-4 rounded-lg transition duration-200 shadow-md ${
                                        (!file || (isSmsRequested && !smsCode)) ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin">↻</span>
                                            Обработка...
                                        </span>
                                    ) : 'Сканировать QR-код'}
                                </button>
                            </form>
                            {scanResult != null && (
                                <button
                                    onClick={() => setShowReceiptItems(true)}
                                    className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition duration-200 shadow-md"
                                >
                                    Перейти к распределению
                                </button>
                            )}
                            {error != '' && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                                    <p className="text-red-600 dark:text-red-200 text-center">{error}</p>
                                </div>
                            )}


                            <button
                                onClick={() => {
                                    setShowScanner(false);
                                    setSmsCode('');
                                    setFile(null);
                                    setIsSmsRequested(false);
                                    setScanResult(null);
                                }}
                                className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md"
                            >
                                Назад
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}