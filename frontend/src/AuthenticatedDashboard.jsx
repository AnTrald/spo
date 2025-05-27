import { useState } from 'react';

export default function AuthenticatedDashboard({ userData, onLogout }) {
    const [file, setFile] = useState(null);
    const [qrResult, setQrResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Пожалуйста, выберите файл');
            return;
        }

        setIsLoading(true);
        setError('');
        setQrResult('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8000/api/scan-qr', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка сервера');
            }

            const data = await response.json();
            setQrResult(data.qr_data);

        } catch (err) {
            setError(err.message);
            console.error('QR processing error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">ДелиЧек</h1>
                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-8 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <h2 className="text-xl font-semibold text-center text-[var(--primary)] dark:text-[var(--secondary)] mb-6">
                        Добро пожаловать, <span className="text-[var(--text-light)] dark:text-[var(--text-dark)]">{userData.username || userData.phone}</span>!
                    </h2>

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
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white py-3 px-4 rounded-lg transition duration-200 shadow-md disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">↻</span>
                                        Обработка...
                                    </span>
                                ) : 'Сканировать QR-код'}
                            </button>
                        </form>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                                <p className="text-red-600 dark:text-red-200 text-center">{error}</p>
                            </div>
                        )}

                        {qrResult && (
                            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-800">
                                <h4 className="font-medium text-[var(--text-light)] dark:text-[var(--text-dark)] mb-2">Результат сканирования:</h4>
                                <p className="text-green-700 dark:text-green-200 break-all">{qrResult}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md mt-4"
                    >
                        Выйти из аккаунта
                    </button>
                </div>
            </div>
        </div>
    );
}