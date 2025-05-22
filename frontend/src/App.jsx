import { useState } from "react";

export default function App() {
    const [isLogin, setIsLogin] = useState(false);

    return (
        <div className="max-w-md mx-auto mt-16">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">ДоговорниЧек</h1>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-4">
                    {isLogin ? 'Вход' : 'Регистрация'}
                </h2>
                <form id={isLogin ? "loginForm" : "registerForm"} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            id={isLogin ? "loginUsername" : "registerUsername"}
                            placeholder="Логин"
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            id={isLogin ? "loginPassword" : "registerPassword"}
                            placeholder="Пароль"
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[var(--primary)] hover:bg-primary-dark dark:bg-secondary dark:hover:bg-secondary-dark text-white py-2 px-4 rounded-lg transition duration-200"
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
                <p id="message" className="mt-3 text-center text-sm text-red-500 dark:text-red-400"></p>
            </div>
        </div>
    );
}