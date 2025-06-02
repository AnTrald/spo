import { useState } from 'react';

export default function ExportModal({ onClose, onExport }) {
    const [selectedFormat, setSelectedFormat] = useState('pdf');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-white">
                    Выберите формат экспорта
                </h3>

                <div className="space-y-3 mb-6">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name="exportFormat"
                            value="pdf"
                            checked={selectedFormat === 'pdf'}
                            onChange={() => setSelectedFormat('pdf')}
                            className="h-5 w-5 text-[var(--primary)] dark:text-[var(--secondary)]"
                        />
                        <span className="text-[var(--text-light)] dark:text-white">PDF документ</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name="exportFormat"
                            value="csv"
                            checked={selectedFormat === 'csv'}
                            onChange={() => setSelectedFormat('csv')}
                            className="h-5 w-5 text-[var(--primary)] dark:text-[var(--secondary)]"
                        />
                        <span className="text-[var(--text-light)] dark:text-white">CSV таблица</span>
                    </label>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => onExport(selectedFormat)}
                        className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white transition-colors"
                    >
                        Экспортировать
                    </button>
                </div>
            </div>
        </div>
    );
}