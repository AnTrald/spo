import { useEffect } from 'react';

export default function Modal({ onClose, children }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                className="fixed inset-0"
                onClick={onClose}
            ></div>
            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>
        </div>
    );
}