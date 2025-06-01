import { useState } from 'react';
import ReceiptItem from './ReceiptItem';
import ChevronDown from "../icons/ChevronDown.jsx";
import ChevronUp from "../icons/ChevronUp.jsx";
import CheckIcon from "../icons/CheckIcon.jsx";
import SelectionIndicator from "./SelectionIndicator.jsx";

export default function ReceiptItemGroup({
                                             name,
                                             items,
                                             selectedItems = [],
                                             onSelectedItemsUpdate,
                                             getUsersForItem,
                                             getUsersForGroup,
                                             groupKey
                                         }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const canExpand = items.some(item => item.totalUnits > 1);

    const toggleItemSelect = (item, isSelected) => {
        const newSelected = isSelected
            ? [...selectedItems, item.id]
            : selectedItems.filter(id => id !== item.id);
        onSelectedItemsUpdate(newSelected);
    };

    const toggleSelectAll = (e) => {
        e.stopPropagation();
        const allIds = items.map(item => item.id);
        const newSelected = selectedItems.length === allIds.length ? [] : allIds;
        onSelectedItemsUpdate(newSelected);
    };

    const allSelected = selectedItems.length === items.length && items.length > 0;

    return (
        <div className="border border-[var(--primary-dark)] dark:border-[var(--secondary-dark)] rounded-lg">
            <div className="flex">
                <div
                    className={`flex-1 p-4 ${canExpand ? 'cursor-pointer' : ''}`}
                    onClick={() => canExpand && setIsExpanded(!isExpanded)}
                >
                    <div className="flex flex-row justify-between">
                        <div className="flex flex-col justify-between items-left">
                            <div className="flex items-center">
                                <h3 className="font-semibold text-[var(--text-light)] dark:text-[var(--text-dark)]">
                                    {name}
                                </h3>
                                <div className="ml-2">
                                    <SelectionIndicator selectedBy={getUsersForGroup(groupKey)}/>
                                </div>
                            </div>
                            {!isExpanded && (
                                <div className="mt-2 text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                                    Общая сумма: {(items.reduce((sum, item) => sum + item.sum, 0) / 100).toFixed(2)} ₽
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
                        allSelected ? 'bg-[var(--primary-dark)] dark:bg-[var(--secondary-dark)]' : 'border border-[var(--text-secondary-light)] dark:border-[var(--text-secondary-dark)]'
                    }`}>
                        {allSelected && <CheckIcon className="w-4 h-4 text-white" />}
                    </div>
                </div>
            </div>

            {isExpanded && canExpand && (
                <div className="border-t border-[var(--primary-dark)] dark:border-[var(--secondary-dark)]">
                    {items.map((item) => (
                        <ReceiptItem
                            key={item.id}
                            item={{
                                ...item,
                                name: item.displayName || item.name
                            }}
                            isSelected={selectedItems.includes(item.id)}
                            onSelect={toggleItemSelect}
                            selectionIndicator={
                                <SelectionIndicator
                                    selectedBy={getUsersForItem(item.id)}
                                />
                            }
                        />
                    ))}
                    <div className="p-4 text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                        Общая сумма: {(items.reduce((sum, item) => sum + item.sum, 0) / 100).toFixed(2)} ₽
                    </div>
                </div>
            )}
        </div>
    );
}