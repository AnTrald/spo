import { useState } from 'react';
import CheckIcon from "../icons/CheckIcon.jsx";

export default function SelectionIndicator({ selectedBy }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    if (selectedBy.length === 0) return null;

    return (
        <div className="relative">
            <div
                className="hidden md:flex items-center gap-1 cursor-help"
                onClick={() => setIsPopupOpen(!isPopupOpen)}
            >
                <CheckIcon className="w-5 h-5 text-green-500"/>
                <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
          {selectedBy.length}
        </span>
            </div>

            <div
                className="md:hidden flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-xs"
                onClick={() => setIsPopupOpen(!isPopupOpen)}
            >
                {selectedBy.length}
            </div>

            {isPopupOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/20 z-40 md:hidden"
                        onClick={() => setIsPopupOpen(false)}
                    />
                    <div className="fixed md:absolute bottom-0 md:bottom-auto left-0 right-0 md:w-64 z-50 bg-white p-4 shadow-lg md:rounded-lg">
                        <div className="font-medium mb-2">Выбрали ({selectedBy.length}):</div>
                        <div className="max-h-[40vh] overflow-y-auto">
                            {selectedBy.map(user => (
                                <div key={user.id} className="py-1 truncate">{user.name}</div>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsPopupOpen(false)}
                            className="mt-3 w-full py-2 bg-gray-100 rounded-lg md:hidden"
                        >
                            Закрыть
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}