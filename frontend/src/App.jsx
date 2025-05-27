import { useState } from "react";

export default function App() {
    const [isLogin, setIsLogin] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">ДелиЧек</h1>
                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-8 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <h2 className="text-xl font-semibold text-center text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)] mb-6">
                        {isLogin ? 'Вход' : 'Регистрация'}
                    </h2>
                    <form className="space-y-6">
                        <div>
                            <input
                                type="text"
                                placeholder="Логин"
                                required
                                className="w-full px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)] placeholder-[var(--text-secondary-light)] dark:placeholder-[var(--text-secondary-dark)]"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Пароль"
                                required
                                className="w-full px-4 py-3 border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--bg-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white py-3 px-4 rounded-lg transition duration-200 shadow-md"
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
                </div>
            </div>
        </div>
    );
}