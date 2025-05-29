export default function ReceiptItems({ ticket, onBack }) {
    const items = ticket?.document?.receipt?.items || [];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">
                    Товары из чека
                </h1>

                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-8 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item, index) => (
                            <div key={index} className="border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] p-4 rounded-lg">
                                <h3 className="font-semibold text-[var(--text-light)] dark:text-[var(--text-dark)]">
                                    {item.name}
                                </h3>
                                <p className="text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                    Цена: {(item.price / 100).toFixed(2)} ₽
                                </p>
                                <p className="text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                    Количество: {item.quantity}
                                </p>
                                <p className="text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                    Сумма: {(item.sum / 100).toFixed(2)} ₽
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onBack}
                        className="w-full mt-6 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md"
                    >
                        Назад к сканеру
                    </button>
                </div>
            </div>
        </div>
    );
}