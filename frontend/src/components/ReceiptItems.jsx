import ReceiptItemGroup from './ReceiptItemGroup';
import { useState } from "react";
import ProfileManager from "./ProfileManager.jsx";

const mergeSameNameItems = (items) => {
    const merged = {};
    let prev = '';
    let counter = 0;

    items.forEach(item => {
        if (item.quantity % 1 !== 0) {
            if (prev === item.name) counter++;
            else counter = 0;
            prev = item.name;

            const uniqueKey = `${item.name}_${counter}`;
            merged[uniqueKey] = {
                ...item,
                id: uniqueKey,
                displayName: item.name,
                originalName: item.name,
                isExpanded: false
            };
        } else {
            if (!merged[item.name]) {
                merged[item.name] = {
                    ...item,
                    id: `${item.name}_0`,
                    displayName: item.name,
                    originalName: item.name
                };
            } else {
                merged[item.name] = {
                    ...merged[item.name],
                    quantity: merged[item.name].quantity + item.quantity,
                    sum: merged[item.name].sum + item.sum,
                    originalItems: [...(merged[item.name].originalItems || [merged[item.name]]), item],
                    displayName: item.name,
                    originalName: item.name
                };
            }
        }
    });

    return Object.values(merged);
};

const splitMergedItems = (mergedItems) => {
    return mergedItems.flatMap(item => {
        if (item.quantity > 1 && item.quantity % 1 === 0) {
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

export default function ReceiptItems({ ticket, username, onBack }) {
    const items = ticket?.document?.receipt?.items || [];
    const processedItems = splitMergedItems(mergeSameNameItems(items));
    const [allCollapsed, setAllCollapsed] = useState(false);

    const groupedProcessedItems = processedItems.reduce((groups, item) => {
        const groupKey = item.originalName || item.name;
        const group = groups[groupKey] || [];
        group.push(item);
        groups[groupKey] = group;
        return groups;
    }, {});

    const [profiles, setProfiles] = useState([
        {
            id: 1,
            name: `Мой профиль (${username})`,
            isDefault: true,
            selectedItems: {},
            currentSum: 0
        }
    ]);

    const [activeProfile, setActiveProfile] = useState(1);

    const toggleAllCollapsed = () => {
        setAllCollapsed(!allCollapsed);
    };

    const selectAllItems = (select) => {
        setProfiles(prevProfiles =>
            prevProfiles.map(profile => {
                if (profile.id !== activeProfile) return profile;

                const newSelectedItems = select
                    ? Object.fromEntries(
                        Object.entries(groupedProcessedItems).map(([groupKey, items]) => [
                            groupKey,
                            items.map(item => item.id)
                        ])
                    )
                    : {};

                return {
                    ...profile,
                    selectedItems: newSelectedItems
                };
            })
        );
    };


    const handleProfileAdd = (name) => {
        const newProfile = {
            id: Date.now(),
            name,
            isDefault: false,
            selectedItems: {},
            currentSum: 0,
        };
        setProfiles([...profiles, newProfile]);
    };

    const handleProfileRemove = (id) => {
        if (profiles.find(p => p.id === id)?.isDefault) return;

        setProfiles(prevProfiles => {
            const updatedProfiles = prevProfiles.filter(p => p.id !== id);

            return updatedProfiles.map(profile => {
                const itemIds = Object.values(profile.selectedItems).flat();
                const newSum = itemIds.reduce((sum, itemId) => {
                    const item = processedItems.find(i => i.id === itemId);
                    if (!item) return sum;

                    const sharingProfiles = updatedProfiles.filter(p =>
                        Object.values(p.selectedItems).flat().includes(itemId)
                    );

                    if (sharingProfiles.length === 0) return sum;

                    const totalShares = sharingProfiles.length;
                    const baseShare = Math.floor((item.sum * 100) / totalShares) / 100;
                    const remainder = (item.sum * 100) % totalShares / 100;

                    const isFirstProfile = sharingProfiles[0].id === profile.id;
                    return sum + baseShare + (isFirstProfile ? remainder : 0);
                }, 0);

                return {
                    ...profile,
                    currentSum: parseFloat(newSum.toFixed(2))
                };
            });
        });

        if (id === activeProfile) {
            setActiveProfile(1);
        }
    };

    const handleProfileSelect = (id) => {
        setActiveProfile(id);
    };

    const handleSelectedItemsUpdate = (groupKey, newSelectedItems) => {
        setProfiles(prevProfiles => {

            const updatedProfiles = prevProfiles.map(profile => {
                if (profile.id !== activeProfile) return profile;

                const updatedSelectedItems = {
                    ...profile.selectedItems,
                    [groupKey]: newSelectedItems
                };

                return {
                    ...profile,
                    selectedItems: updatedSelectedItems
                };
            });

            return updatedProfiles.map(profile => {
                const itemIds = Object.values(profile.selectedItems).flat();
                const newSum = itemIds.reduce((sum, itemId) => {
                    const item = processedItems.find(i => i.id === itemId);
                    if (!item) return sum;

                    const sharingProfiles = updatedProfiles.filter(p =>
                        Object.values(p.selectedItems).flat().includes(itemId)
                    );

                    if (sharingProfiles.length === 0) return sum;

                    const totalShares = sharingProfiles.length;
                    const baseShare = Math.floor((item.sum * 100) / totalShares) / 100;
                    const remainder = (item.sum * 100) % totalShares / 100;

                    const isFirstProfile = sharingProfiles[0].id === profile.id;
                    return sum + baseShare + (isFirstProfile ? remainder : 0);
                }, 0);

                return {
                    ...profile,
                    currentSum: parseFloat(newSum.toFixed(2))
                };
            });
        });
    };

    const getUsersForGroup = (groupKey) => {
        return profiles
            .filter(profile => profile.selectedItems[groupKey]?.length > 0)
            .map(profile => ({
                id: profile.id,
                name: profile.name
            }));
    };

    const getUsersForItem = (itemId) => {
        return profiles
            .filter(profile =>
                Object.values(profile.selectedItems).some(items => items.includes(itemId))
            )
            .map(profile => ({
                id: profile.id,
                name: profile.name
            }));
    };

    const activeProfileData = profiles.find(p => p.id === activeProfile) || profiles[0];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">
                    Товары из чека
                </h1>
                <div className="mb-4 bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-4 rounded-lg shadow border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <ProfileManager
                        profiles={profiles}
                        activeProfile={activeProfile}
                        onProfileSelect={handleProfileSelect}
                        onProfileAdd={handleProfileAdd}
                        onProfileRemove={handleProfileRemove}
                    />
                </div>
                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-8 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(groupedProcessedItems).map(([groupKey, items]) => {
                            const displayName = items[0].displayName || items[0].name;
                            return (
                                <ReceiptItemGroup
                                    key={groupKey}
                                    name={displayName}
                                    items={items}
                                    selectedItems={activeProfileData.selectedItems[groupKey] || []}
                                    onSelectedItemsUpdate={(newSelected) =>
                                        handleSelectedItemsUpdate(groupKey, newSelected)
                                    }
                                    getUsersForItem={getUsersForItem}
                                    getUsersForGroup={getUsersForGroup}
                                    groupKey={groupKey}
                                />
                            );
                        })}
                    </div>
                    <div className="mt-4 text-right font-bold text-lg text-[var(--text-light)] dark:text-[var(--text-dark)]">
                        Сумма: {(activeProfileData.currentSum / 100).toFixed(2)} ₽
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