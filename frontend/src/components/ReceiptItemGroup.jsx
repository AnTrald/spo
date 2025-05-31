import { useState, useEffect } from 'react';
import ReceiptItem from './ReceiptItem';
import ChevronDown from "../icons/ChevronDown.jsx";
import ChevronUp from "../icons/ChevronUp.jsx";
import CheckIcon from "../icons/CheckIcon.jsx";

const mergeSameNameItems = (items) => {
    const merged = {};
    items.forEach(item => {
        // Добавляем уникальный id для каждого товара
        const uniqueId = item.id || Math.random().toString(36).substring(2, 9);

        if (item.quantity % 1 !== 0) {
            const uniqueKey = `${item.name}_${uniqueId}`;
            merged[uniqueKey] = {
                ...item,
                id: uniqueId, // Сохраняем id
                displayName: item.name,
                isExpanded: false
            };
        } else {
            if (!merged[item.name]) {
                merged[item.name] = {
                    ...item,
                    id: uniqueId, // Сохраняем id
                    displayName: item.name
                };
            } else {
                merged[item.name] = {
                    ...merged[item.name],
                    quantity: merged[item.name].quantity + item.quantity,
                    sum: merged[item.name].sum + item.sum,
                    originalItems: [...(merged[item.name].originalItems || [merged[item.name]]), item],
                    displayName: item.name
                };
            }
        }
    });
    return Object.values(merged);
};

const splitMergedItems = (mergedItems) => {
    return mergedItems.flatMap(item => {
        if (item.quantity > 1 && item.quantity % 1 == 0) {
            return Array.from({ length: item.quantity }, (_, i) => ({
                ...item,
                id: `${item.id}_${i}`, // Уникальный id для каждого развернутого элемента
                quantity: 1,
                sum: item.sum / item.quantity,
                isExpanded: true,
                unitNumber: i + 1,
                totalUnits: item.quantity
            }));
        }
        return { ...item, isExpanded: false };
    });
};

export default function ReceiptItemGroup({ name, items }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [processedItems, setProcessedItems] = useState([]);
    const [canExpand, setCanExpand] = useState(false);

    useEffect(() => {
        const mergedItems = mergeSameNameItems(items);
        const splitItems = splitMergedItems(mergedItems);
        setProcessedItems(splitItems);
        setCanExpand(mergedItems.some(item => item.quantity > 1 && item.quantity % 1 === 0));
    }, [items]);

    const allSelected = selectedItems.length === processedItems.length && processedItems.length > 0;

    const toggleSelectAll = (e) => {
        e.stopPropagation();
        setSelectedItems(allSelected ? [] : [...processedItems]);
    };

    const toggleItemSelect = (item, isSelected) => {
        setSelectedItems(prev =>
            isSelected
                ? [...prev, item]
                : prev.filter(i => i.id === item.id) // Сравниваем по id
        );
    };

    return (
        <div className="border border-[var(--primary-dark)] dark:border-[var(--secondary-dark)] rounded-lg">
            <div className="flex">
                <div
                    className={`flex-1 p-4 ${canExpand ? 'cursor-pointer' : ''}`}
                    onClick={() => canExpand && setIsExpanded(!isExpanded)}
                >
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col justify-between items-left">
                            <h3 className="font-semibold text-[var(--text-light)] dark:text-[var(--text-dark)]">
                                {name} {canExpand && ` (x${processedItems.reduce((sum, item) => sum + item.quantity, 0)})`}
                            </h3>
                            {!isExpanded && (
                                <div className="mt-2 text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                    Общая сумма: {(processedItems.reduce((sum, item) => sum + item.sum, 0) / 100).toFixed(2)} ₽
                                </div>
                            )}
                        </div>
                        {canExpand && (
                            <span className="text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                {isExpanded ? <ChevronUp/> : <ChevronDown/>}
              </span>
                        )}
                    </div>
                </div>

                <div
                    className="flex items-center justify-center px-4 border-l border-[var(--primary-dark)] dark:border-[var(--secondary-dark)]"
                    onClick={toggleSelectAll}
                >
                    <div className={`w-6 h-6 flex items-center justify-center rounded ${
                        allSelected ? 'bg-[var(--primary-dark)] dark:bg-[var(--secondary-dark)]'  : 'border border-[var(--text-secondary-light)] dark:border-[var(--text-secondary-dark)]'
                    }`}>
                        {allSelected && <CheckIcon className="w-4 h-4 text-white" />}
                    </div>
                </div>
            </div>

            {isExpanded && canExpand && (
                <div className="border-t border-[var(--primary-dark)] dark:border-[var(--secondary-dark)]">
                    {processedItems.map((item) => (
                        <ReceiptItem
                            key={item.id} // Используем id как ключ
                            item={{
                                ...item,
                                name: item.displayName || item.name
                            }}
                            isSelected={selectedItems.some(i => i.id === item.id)} // Проверяем по id
                            onSelect={toggleItemSelect}
                        />
                    ))}
                    <div className="p-4 text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                        Общая сумма: {(processedItems.reduce((sum, item) => sum + item.sum, 0) / 100).toFixed(2)} ₽
                    </div>
                </div>
            )}
        </div>
    );
}