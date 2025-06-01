import CheckIcon from "../icons/CheckIcon.jsx";

export default function ReceiptItem({ item, isSelected, onSelect, selectionIndicator }) {
    return (
        <div className="flex border-b border-[var(--primary-dark)] dark:border-[var(--secondary-dark)] last:border-b-0">
            <div className="flex-1 p-4 flex items-center">
                <h3 className="font-semibold text-[var(--text-light)] dark:text-[var(--text-dark)]">
                    {item.name}
                    {item.isExpanded && (
                        <span className="ml-2 text-xs text-gray-500">{(item.sum / 100).toFixed(2)}₽</span>
                    )}
                </h3>
                {selectionIndicator && (
                    <div className="ml-2">
                        {selectionIndicator}
                    </div>
                )}
            </div>

            <div
                className="flex items-center justify-center px-4 border-l border-[var(--primary-dark)] dark:border-[var(--secondary-dark)]"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item, !isSelected);
                }}
            >
                <div className={`
                    w-6 h-6 flex items-center justify-center rounded
                    ${isSelected
                    ? 'bg-[var(--primary-dark)] dark:bg-[var(--secondary-dark)]'
                    : 'border border-[var(--text-secondary-light)] dark:border-[var(--text-secondary-dark)]'
                }`}
                >
                    {isSelected && <CheckIcon className="w-4 h-4 text-white dark:text-white"/>}
                </div>
            </div>
        </div>
    );
}