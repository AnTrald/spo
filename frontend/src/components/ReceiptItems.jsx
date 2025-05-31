import ReceiptItemGroup from './ReceiptItemGroup';

export default function ReceiptItems({ ticket, onBack }) {
    const items = ticket?.document?.receipt?.items || [];

    const groupedItems = items.reduce((groups, item) => {
        // Для весовых товаров создаем уникальный ключ: название + вес
        const groupKey = item.quantity % 1 !== 0
            ? `${item.name}_${item.quantity}`
            : item.name;

        const group = groups[groupKey] || [];
        group.push(item);
        groups[groupKey] = group;
        return groups;
    }, {});

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">
                    Товары из чека
                </h1>

                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-8 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(groupedItems).map(([groupKey, items]) => {
                            const displayName = items[0].quantity % 1 !== 0
                                ? `${items[0].name} (${items[0].quantity} кг)`
                                : items[0].name;

                            return (
                                <ReceiptItemGroup
                                    key={groupKey}
                                    name={displayName}
                                    items={items}
                                />
                            );
                        })}
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