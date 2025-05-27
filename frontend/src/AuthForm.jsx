import { useState } from "react";
import AuthenticatedDashboard from "./AuthenticatedDashboard.jsx";

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        password: ''
    });
    const [message, setMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loginMethod, setLoginMethod] = useState('phone');

    const formatPhoneNumber = (value) => {
        const numbers = value.replace(/\D/g, '');
        let formattedValue = '';

        if (numbers.length > 0) {
            formattedValue = numbers.substring(0, 3);
            if (numbers.length > 3) {
                formattedValue += ' ' + numbers.substring(3, 6);
            }
            if (numbers.length > 6) {
                formattedValue += '-' + numbers.substring(6, 8);
            }
            if (numbers.length > 8) {
                formattedValue += '-' + numbers.substring(8, 10);
            }
        }

        return formattedValue;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/login' : '/api/register';

        let requestData;
        if (isLogin) {
            requestData = {
                login: loginMethod === 'phone' ? `+7${formData.phone.replace(/\D/g, '')}` : formData.username,
                password: formData.password
            };
        } else {
            requestData = {
                username: formData.username,
                phone: `+7${formData.phone.replace(/\D/g, '')}`,
                password: formData.password
            };
        }

        try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка сервера');
            }

            const data = await response.json();
            setIsAuthenticated(true);
            setUserData({
                username: data.username || formData.username,
                phone: formData.phone ? `+7${formData.phone.replace(/\D/g, '')}` : null
            });
        } catch (err) {
            setMessage(err.message);
            console.error('Ошибка авторизации:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (isAuthenticated) {
        return (
            <AuthenticatedDashboard
                userData={userData}
                onLogout={() => {
                    setIsAuthenticated(false);
                    setUserData(null);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">Деличек</h1>
                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-8 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <h2 className="text-xl font-semibold text-center text-[var(--primary)] dark:text-[var(--secondary)] mb-6">
                        {isLogin ? 'Вход' : 'Регистрация'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin ? (
                            <>
                                <div>
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Логин"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)] placeholder-[var(--text-secondary-light)] dark:placeholder-[var(--text-secondary-dark)]"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">+7</span>
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="000 000-00-00"
                                        value={formatPhoneNumber(formData.phone)}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setFormData({...formData, phone: value});
                                        }}
                                        required
                                        className="w-full pl-10 px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex space-x-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('phone')}
                                        className={`flex-1 py-2 px-4 rounded-lg transition ${loginMethod === 'phone' ? 'bg-[var(--primary)] dark:bg-[var(--secondary)] text-white' : 'bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]'}`}
                                    >
                                        По телефону
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('username')}
                                        className={`flex-1 py-2 px-4 rounded-lg transition ${loginMethod === 'username' ? 'bg-[var(--primary)] dark:bg-[var(--secondary)] text-white' : 'bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]'}`}
                                    >
                                        По логину
                                    </button>
                                </div>
                                {loginMethod === 'phone' ? (
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <span className="text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">+7</span>
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="000 000-00-00"
                                            value={formatPhoneNumber(formData.phone)}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setFormData({...formData, phone: value});
                                            }}
                                            required
                                            className="w-full pl-10 px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Логин"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                        <div>
                            <input
                                type="password"
                                name="password"
                                placeholder="Пароль"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]"
                            />
                        </div>
                        <button
                            type="submit"
                            className={`w-full text-white py-3 px-4 rounded-lg transition duration-200 shadow-md ${
                                isLogin
                                    ? 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)]'
                                    : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)]'
                            }`}
                        >
                            {isLogin ? 'Войти' : 'Зарегистрироваться'}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[var(--secondary)] dark:text-[var(--secondary-light)] hover:text-[var(--secondary-dark)] dark:hover:text-[var(--secondary)] font-medium transition duration-200"
                        >
                            {isLogin ? 'Создать новый аккаунт' : 'Уже есть аккаунт? Войти'}
                        </button>
                    </div>
                    {message && (
                        <div className={`mt-4 p-3 rounded-lg ${
                            message.includes('Добро пожаловать')
                                ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200'
                                : 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200'
                        }`}>
                            <p className="text-center">{message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}