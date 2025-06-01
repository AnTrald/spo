import CloseIcon from "../icons/CloseIcon.jsx";
import { useState } from 'react';
import Modal from "./Modal.jsx";

export default function ProfileManager({ profiles, activeProfile, onProfileSelect, onProfileRemove, onProfileAdd }) {
    const [newName, setNewName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState(null);

    const handleAddProfile = () => {
        if (!newName.trim()) return;
        onProfileAdd(newName);
        setNewName('');
    };

    const handleRemoveClick = (profileId) => {
        const profile = profiles.find(p => p.id === profileId);
        const hasSelectedItems = Object.values(profile.selectedItems).some(items => items.length > 0);

        if (hasSelectedItems) {
            setProfileToDelete(profileId);
            setShowDeleteConfirm(true);
        } else {
            onProfileRemove(profileId);
        }
    };

    const confirmRemove = () => {
        onProfileRemove(profileToDelete);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="profile-manager bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-3 md:p-4 rounded-lg shadow border border-[var(--primary)] dark:border-[var(--secondary-dark)]">
            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(false)}>
                    <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-xl border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                        <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-[var(--text-dark)]">
                            Подтверждение удаления
                        </h3>
                        <p className="mb-6 text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
                            У этого пользователя есть выбранные товары. Вы уверены, что хотите его удалить?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-lg border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={confirmRemove}
                                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 shadow-md"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            <h3 className="text-lg md:text-xl font-medium mb-3 text-[var(--text-light)] dark:text-[var(--text-dark)]">Участники</h3>

            <div className="profiles-list space-y-2 h-[200px] md:h-auto overflow-y-auto mb-3">
                {profiles.map(profile => (
                    <div
                        key={profile.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200
                            ${
                            profile.id === activeProfile
                                ? 'border border-[var(--primary)] dark:border-[var(--secondary-dark)] bg-[var(--primary)] dark:bg-[var(--secondary-dark)] shadow-inner'
                                : 'border border-[var(--primary)] dark:border-[var(--secondary-dark)]'
                        }
                            ${profile.isDefault ? 'border-opacity-70 dark:border-opacity-70' : ''}`
                        }
                        style={{
                            minHeight: '44px',
                            boxSizing: 'border-box'
                        }}
                        onClick={() => onProfileSelect(profile.id)}
                    >
                        <span className="truncate text-sm md:text-base dark:text-[var(--text-dark)]">
                            {profile.name}
                            {profile.isDefault && <span className="ml-2 text-xs opacity-70">(по умолчанию)</span>}
                        </span>
                        <span className="truncate text-sm md:text-base dark:text-[var(--text-dark)]">
                            {(profile.currentSum/ 100).toFixed(2)}₽
                        </span>
                        {!profile.isDefault && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveClick(profile.id);
                                }}
                                className={`text-lg px-2 rounded-full transition-colors ${
                                    profile.id === activeProfile
                                        ? 'text-white hover:bg-white/20'
                                        : 'text-red-500 hover:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-400/20'
                                }`}
                                style={{
                                    minWidth: '28px',
                                    height: '28px'
                                }}
                            >
                                <CloseIcon className="w-4 h-4"/>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="add-profile flex gap-2 mt-3">
                <input
                    className="flex-1 p-2 border rounded text-sm md:text-base bg-transparent border-[var(--primary)] dark:border-[var(--secondary-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)] placeholder-[var(--text-secondary-light)] dark:placeholder-[var(--text-secondary-dark)] focus:border-[var(--primary-dark)] dark:focus:border-[var(--secondary-light)] focus:outline-none"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Имя участника"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddProfile()}
                />
                <button
                    onClick={handleAddProfile}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white px-3 py-1 rounded text-sm md:text-base transition-colors"
                >
                    Добавить
                </button>
            </div>
        </div>
    );
}