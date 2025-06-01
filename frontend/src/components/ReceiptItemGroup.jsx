import { useState, useEffect } from 'react';
import ReceiptItem from './ReceiptItem';
import ChevronDown from "../icons/ChevronDown.jsx";
import ChevronUp from "../icons/ChevronUp.jsx";
import CheckIcon from "../icons/CheckIcon.jsx";

const mergeSameNameItems = (items) => {
    const merged = {};
    const prev = ''
    let counter = 0
        items.forEach(item => {
            if (item.quantity % 1 !== 0) {
                if (prev === item.name) counter++;
                else counter = 0
                const uniqueKey = `${item.name}_${counter}`;
                merged[uniqueKey] = {
                    ...item,
                    id: uniqueKey,
                    displayName: item.name,
                    isExpanded: false
            };
            } else {
                if (!merged[item.name]) {
                    merged[item.name] = {
                        ...item,
                        id: `${item.name}_${0}`,
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
        }
        );
    return Object.values(merged);
};

const splitMergedItems = (mergedItems) => {
    return mergedItems.flatMap(item => {
        if (item.quantity > 1 && item.quantity % 1 == 0) {
            return Array.from({ length: item.quantity }, (_, i) => ({
                ...item,
                id: `${item.id}_${i}`,
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

export default function ReceiptItemGroup({ name, items, selectedItems = [], onSelectedItemsUpdate }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [processedItems, setProcessedItems] = useState([]);
    const [canExpand, setCanExpand] = useState(false);

    useEffect(() => {
        const mergedItems = mergeSameNameItems(items);
        const splitItems = splitMergedItems(mergedItems);
        setProcessedItems(splitItems);
        setCanExpand(mergedItems.some(item => item.quantity > 1 && item.quantity % 1 === 0));
    }, [items]);

    const toggleItemSelect = (item, isSelected) => {
        const newSelected = isSelected
            ? [...selectedItems, item.id]
            : selectedItems.filter(id => id !== item.id);
        onSelectedItemsUpdate(newSelected);
    };

    const toggleSelectAll = (e) => {
        e.stopPropagation();
        const allIds = processedItems.map(item => item.id);
        const newSelected = selectedItems.length === allIds.length ? [] : allIds;
        onSelectedItemsUpdate(newSelected);
    };

    const allSelected = selectedItems.length === processedItems.length && processedItems.length > 0;

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
                            key={item.id}
                            item={{
                                ...item,
                                name: item.displayName || item.name
                            }}
                            isSelected={selectedItems.includes(item.id)}
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