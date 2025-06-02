import { useState } from 'react';
import CheckIcon from "../icons/CheckIcon.jsx";
import ChevronUp from "../icons/ChevronUp.jsx";
import ChevronDown from "../icons/ChevronDown.jsx";

export default function CollapsibleContainer({
                                                 title,
                                                 children,
                                                 onSelectAll,
                                                 allSelected,
                                                 totalSum,
                                                 noScroll = false
                                             }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div
            className="border border-[var(--primary-dark)] dark:border-[var(--secondary-dark)] rounded-lg overflow-hidden">
            <div
                className="flex items-center justify-between p-4 bg-[var(--surface-secondary-light)] dark:bg-[var(--surface-secondary-dark)]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white px-3 py-1 rounded text-sm md:text-base transition-colors"
                    >
                        {isCollapsed ? (
                            <>
                                <ChevronDown className="w-4 h-4"/>
                                Развернуть все
                            </>
                        ) : (
                            <>
                                <ChevronUp className="w-4 h-4"/>
                                Свернуть все
                            </>
                        )}
                    </button>
                    <h2 className="font-bold text-lg text-[var(--text-light)] dark:text-[var(--text-dark)]">
                        {title}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[var(--text-light)] dark:text-[var(--text-dark)] font-medium">
                        {(totalSum / 100).toFixed(2)} ₽
                    </span>
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={onSelectAll}
                    >
                        <span
                            className="text-sm text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                            Выбрать все
                        </span>
                        <div className={`w-6 h-6 flex items-center justify-center rounded ${
                            allSelected ? 'bg-[var(--primary-dark)] dark:bg-[var(--secondary-dark)]' : 'border border-[var(--text-secondary-light)] dark:border-[var(--text-secondary-dark)]'
                        }`}>
                            {allSelected && <CheckIcon className="w-4 h-4 text-white"/>}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`transition-all duration-200 ${isCollapsed ? 'max-h-0 overflow-hidden' : noScroll ? 'max-h-none' : 'max-h-[2000px] overflow-y-auto'}`}>
                <div className="space-y-4 p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}