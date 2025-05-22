import { useState } from "react";

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [message, setMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/login' : '/api/register';

        try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Unknown error');
            }

            setIsAuthenticated(true);
            setMessage(`Добро пожаловать, ${formData.username}!`);
        } catch (err) {
            setMessage(err.message);
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
            <div className="max-w-md mx-auto mt-16">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">ДоговорниЧек</h1>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-4">
                        Добро пожаловать!
                    </h2>
                    <p className="text-center mb-4">Вы вошли как: {formData.username}</p>
                    <button
                        onClick={() => setIsAuthenticated(false)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200"
                    >
                        Выйти
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-16">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">ДоговорниЧек</h1>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-4">
                    {isLogin ? 'Вход' : 'Регистрация'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            name="username"
                            placeholder="Логин"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            name="password"
                            placeholder="Пароль"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className={`w-full text-white py-2 px-4 rounded-lg transition duration-200 ${
                            isLogin
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-[var(--primary)] hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark'
                        }`}
                    >
                        {isLogin ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                </form>
                <p className="mt-3 text-center text-sm">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-500 dark:text-blue-400 hover:underline focus:outline-none"
                    >
                        {isLogin ? 'Зарегистрироваться' : 'Я уже зарегистрирован'}
                    </button>
                </p>
                {message && (
                    <p className={`mt-3 text-center text-sm ${
                        message.includes('Добро пожаловать') ? 'text-green-500' : 'text-red-500'
                    } dark:text-red-400`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}