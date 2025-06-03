import { useState } from "react";
import ProfileManager from "./ProfileManager.jsx";
import CollapsibleContainer from "./CollapsibleContainer.jsx";
import ReceiptItemGroup from "./ReceiptItemGroup.jsx";
import ReportPage from "./ReportPage.jsx";

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

export default function ReceiptItems({ ticket, ticketId, username, onBack }) {
    const items = ticket?.document?.receipt?.items || [];
    const processedItems = splitMergedItems(mergeSameNameItems(items));
    const [showReport, setShowReport] = useState(false);


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

    const toggleSelectAllItems = (select) => {
        setProfiles(prevProfiles => {
            const updatedProfiles = prevProfiles.map(profile => {
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

    const activeProfileData = profiles.find(p => p.id === activeProfile) || profiles[0];

    const allItemsSelected = Object.entries(groupedProcessedItems).every(([groupKey, items]) => {
        const selected = activeProfileData.selectedItems[groupKey] || [];
        return selected.length === items.length;
    });


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

    const allItemsAreSelected = () => {
        const allItemIds = Object.values(groupedProcessedItems).flatMap(items =>
            items.map(item => item.id)
        );

        return allItemIds.every(itemId =>
            profiles.some(profile =>
                Object.values(profile.selectedItems).flat().includes(itemId)
            )
        );
    };

    const handleGoToReport = () => {
        setShowReport(true);
    };

    const totalSumAllItems = Object.values(groupedProcessedItems)
        .flat()
        .reduce((sum, item) => sum + item.sum, 0);

    return (
        <div className="flex flex-col min-h-screen bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            {!showReport &&
                <div className="sticky top-0 z-10 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] pt-4 pb-2 mb-2 px-4">
                    <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">
                        Товары из чека
                    </h1>
                </div>
            }
            <div className="flex-1 overflow-auto px-4 pb-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {showReport ? (
                        <ReportPage
                            profiles={profiles}
                            username={username}
                            ticketId = {ticketId}
                            groupedProcessedItems={groupedProcessedItems}
                            totalSumAllItems={totalSumAllItems}
                            onBack={() => setShowReport(false)}
                        />
                    ) : (
                        <>
                            <div
                                className="mb-4 bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-4 rounded-lg shadow border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                                <ProfileManager
                                    profiles={profiles}
                                    activeProfile={activeProfile}
                                    onProfileSelect={handleProfileSelect}
                                    onProfileAdd={handleProfileAdd}
                                    onProfileRemove={handleProfileRemove}
                                />
                            </div>
                            <div
                                className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                                <CollapsibleContainer
                                    title="Все товары"
                                    onSelectAll={() => toggleSelectAllItems(!allItemsSelected)}
                                    allSelected={allItemsSelected}
                                    totalSum={activeProfileData.currentSum}
                                    noScroll
                                >
                                    {Object.entries(groupedProcessedItems).map(([groupKey, items]) => (
                                        <ReceiptItemGroup
                                            key={groupKey}
                                            name={items[0].displayName || items[0].name}
                                            items={items}
                                            selectedItems={activeProfileData.selectedItems[groupKey] || []}
                                            onSelectedItemsUpdate={(newSelected) =>
                                                handleSelectedItemsUpdate(groupKey, newSelected)
                                            }
                                            getUsersForItem={getUsersForItem}
                                            getUsersForGroup={getUsersForGroup}
                                            groupKey={groupKey}
                                        />
                                    ))}
                                </CollapsibleContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {!showReport &&
                <div
                    className="sticky bottom-0 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4 border-t border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <button
                            onClick={onBack}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md"
                        >
                            Назад к сканеру
                        </button>
                        <button
                            onClick={handleGoToReport}
                            disabled={!allItemsAreSelected()}
                            className={`flex-1 py-2 px-4 rounded-lg transition duration-200 shadow-md ${
                                allItemsAreSelected()
                                    ? 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white'
                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Перейти к отчету
                        </button>
                    </div>
                </div>
            }
        </div>
    );
}