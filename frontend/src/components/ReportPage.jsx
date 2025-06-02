import {use, useState} from 'react';
import SaveToHistory from "../icons/SaveToHistory.jsx";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportModal from "./ExportModal.jsx";
import '../fonts/ArialMT-normal.js'

export default function ReportPage({ profiles, username, ticketId, groupedProcessedItems, totalSumAllItems, onBack }) {
    const [activeProfileId, setActiveProfileId] = useState(null);
    const defaultProfile = profiles.find(p => p.isDefault);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [reportData, setReportData] = useState(null);
    const nonDefaultProfiles = profiles.filter(p => !p.isDefault);
    const getItemShare = (itemId) => {
        const sharingProfiles = profiles.filter(p =>
            Object.values(p.selectedItems).flat().includes(itemId)
        );

        if (sharingProfiles.length === 0) return 0;

        const item = Object.values(groupedProcessedItems)
            .flat()
            .find(i => i.id === itemId);

        if (!item) return 0;

        const totalShares = sharingProfiles.length;
        const baseShare = Math.floor((item.sum * 100) / totalShares) / 100;
        const remainder = (item.sum * 100) % totalShares / 100;

        return baseShare + (sharingProfiles[0].id === activeProfileId ? remainder : 0);
    };

    const toggleProfile = (profileId) => {
        setActiveProfileId(activeProfileId === profileId ? null : profileId);
    };

    const checkDuplicateReport = async (ticketId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/reports/by-ticket/${ticketId}`);
            if (!response.ok) {
                throw new Error('Ошибка при проверке дубликата');
            }
            return await response.json(); // Вернет true/false
        } catch (error) {
            console.error('Ошибка проверки:', error);
            return false;
        }
    };

    const handleSaveToDatabase = async () => {
        try {
            const data = {
                recipient_username: defaultProfile.name,
                owner_username: username,
                ticketId: ticketId,
                total_sum: totalSumAllItems / 100,
                participants_count: profiles.length,
                items: profiles.flatMap(profile =>
                    Object.entries(profile.selectedItems).flatMap(([groupKey, itemIds]) =>
                        itemIds.map(itemId => {
                            const item = Object.values(groupedProcessedItems)
                                .flat()
                                .find(i => i.id === itemId);
                            return {
                                profile: profile.name,
                                product: item?.name || 'Unknown',
                                price: getItemShare(itemId) / 100,
                                total: profile.currentSum / 100
                            };
                        })
                    )
                )
            };
            console.log(data)
            setReportData(data);

            // Проверяем дубликат
            const isDuplicate = await checkDuplicateReport(ticketId);

            if (isDuplicate) {
                setShowOverwriteModal(true); // Показываем модальное окно подтверждения
            } else {
                await saveReport(data); // Сохраняем если нет дубликата
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось сохранить отчёт');
        }
    };

    const saveReport = async (data) => {
        try {
            const response = await fetch('http://localhost:8000/api/save-report', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Ошибка сохранения');
            const result = await response.json();
            if (result.action === "updated") {
                alert("Отчет успешно обновлен!");
            } else {
                alert("Отчет успешно сохранен!");
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось сохранить отчёт');
        }
    };

    const handleOverwriteConfirm = async () => {
        setShowOverwriteModal(false);
        if (reportData) {
            await saveReport(reportData);
        }
    };

    const handleOverwriteCancel = () => {
        setShowOverwriteModal(false);
        setReportData(null);
    };


    const handleExportCSV = () => {
        let csvContent = "\uFEFF"; // BOM для UTF-8

        // Используем точку с запятой как разделитель
        csvContent += "Профиль;Товар;Количество;Сумма;Должен\n";

        profiles.forEach(profile => {
            Object.entries(profile.selectedItems).forEach(([groupKey, itemIds]) => {
                itemIds.forEach(itemId => {
                    const item = Object.values(groupedProcessedItems)
                        .flat()
                        .find(i => i.id === itemId);

                    if (item) {
                        const share = getItemShare(itemId);
                        // Заменяем точки на запятые в дробных числах
                        csvContent += `"${profile.name}";"${item.name}";1;${(share/100).toFixed(2).replace('.', ',')};${(profile.currentSum/100).toFixed(2).replace('.', ',')}\n`;
                    }
                });
            });
        });

        // Создаем файл с правильным MIME-типом
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'отчет_по_чеку.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleExportPDF = () => {
        const doc = new jsPDF();
        const defaultProfile = profiles.find(p => p.isDefault);

        // Устанавливаем шрифт с кириллицей
        doc.setFont('ArialMT')

        // Заголовок
        doc.setFontSize(18);
        doc.text("Финансовый отчет по чеку", 14, 20);

        // Общая информация
        doc.setFontSize(12);
        doc.text(`Общая сумма: ${(totalSumAllItems/100).toFixed(2).replace('.', ',')} ₽`, 14, 30);
        doc.text(`Количество участников: ${profiles.length}`, 14, 36);
        doc.text(`Получатель платежей: ${defaultProfile.name}`, 14, 42);

        // Подготовка данных таблицы
        const tableData = profiles.flatMap(profile =>
            Object.entries(profile.selectedItems).flatMap(([groupKey, itemIds]) =>
                itemIds.map(itemId => {
                    const item = Object.values(groupedProcessedItems)
                        .flat()
                        .find(i => i.id === itemId);
                    if (!item) return null;

                    const share = getItemShare(itemId);
                    return [
                        profile.name,
                        item.name,
                        '1',
                        `${(share/100).toFixed(2).replace('.', ',')} ₽`,
                        `${(profile.currentSum/100).toFixed(2).replace('.', ',')} ₽`
                    ];
                }).filter(Boolean)
            )
        );
        console.log(doc.getFontList());
        // Добавление таблицы
        autoTable(doc, {
            head: [['Профиль', 'Товар', 'Кол-во', 'Сумма', 'Итого к оплате']],
            body: tableData,
            startY: 50,
            styles: {
                font: 'ArialMT',
                fontStyle: 'normal',
                fontSize: 10,
                cellPadding: 2,
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'normal',
                font: 'ArialMT'
            },
            bodyStyles: {
                font: 'ArialMT'
            }
        });

        doc.save('отчет_по_чеку.pdf');
    };


    const handleExport = (format) => {
        setShowExportModal(false);
        if (format === 'pdf') {
            handleExportPDF();
        } else {
            handleExportCSV();
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-10 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] pt-4 pb-2 px-4">
                <h2 className="text-2xl font-bold text-center text-[var(--text-light)] dark:text-white">
                    Финансовый отчет
                </h2>
            </div>

            {/* Основной контент с прокруткой */}
            <div className="flex-1 overflow-auto px-4 pb-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Общая информация */}
                    <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                        <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-white">Общая информация</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-[var(--surface-secondary-light)] dark:bg-[var(--surface-secondary-dark)] p-4 rounded-lg">
                                <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300 mb-1">Общая сумма чека:</p>
                                <p className="text-2xl font-bold text-[var(--text-light)] dark:text-white">{(totalSumAllItems / 100).toFixed(2)} ₽</p>
                            </div>
                            <div className="bg-[var(--surface-secondary-light)] dark:bg-[var(--surface-secondary-dark)] p-4 rounded-lg">
                                <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300 mb-1">Количество участников:</p>
                                <p className="text-2xl font-bold text-[var(--text-light)] dark:text-white">{profiles.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Распределение платежей */}
                    <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                        <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-white">
                            Распределение платежей
                        </h3>

                        <div className="space-y-4">
                            {nonDefaultProfiles.map(profile => (
                                <div
                                    key={profile.id}
                                    onClick={() => toggleProfile(profile.id)}
                                    className={`flex justify-between items-center p-4 rounded-lg cursor-pointer transition-colors border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] ${
                                        activeProfileId === profile.id
                                            ? 'bg-[var(--primary)] dark:bg-[var(--secondary)] hover:bg-[var(--primary-dark)] dark:hover:bg-[var(--secondary-dark)]'
                                            : 'bg-[var(--surface-primary-dark)] dark:bg-[var(--surface-secondary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div>
                                        <p className="font-medium text-[var(--text-light)] dark:text-white">
                                            {profile.name}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300">
                                            Сумма: {(profile.currentSum / 100).toFixed(2)} ₽
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <div
                                onClick={() => toggleProfile(defaultProfile.id)}
                                className={`p-4 rounded-lg cursor-pointer transition-colors border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] ${
                                    activeProfileId === defaultProfile.id
                                        ? 'bg-[var(--primary)] dark:bg-[var(--secondary)] hover:bg-[var(--primary-dark)] dark:hover:bg-[var(--secondary-dark)]'
                                        : 'bg-[var(--surface-primary-dark)] dark:bg-[var(--surface-secondary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <div className="flex justify-between items-center text-[var(--text-light)] dark:text-white">
                                    <div>
                                        <p className="font-medium">{defaultProfile.name}</p>
                                        <p className="text-sm text-white/80">
                                            Сумма: {(defaultProfile.currentSum / 100).toFixed(2)} ₽
                                        </p>
                                    </div>
                                    <div className="px-3 py-2 rounded-lg bg-white/20">
                                        <p className="font-bold">Получает платежи</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Детализация по пользователям */}
                    <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                        <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-white">
                            {activeProfileId ? `Детализация: ${profiles.find(p => p.id === activeProfileId)?.name}` : 'Выберите профиль для детализации'}
                        </h3>

                        {activeProfileId && (
                            <div className="border border-[var(--primary-dark)] dark:border-[var(--secondary-dark)] rounded-lg overflow-hidden">
                                {(() => {
                                    const profile = profiles.find(p => p.id === activeProfileId);
                                    return (
                                        <>
                                            <div className={`p-4 ${
                                                profile.isDefault
                                                    ? 'bg-[var(--primary)] dark:bg-[var(--secondary-dark)] text-white'
                                                    : 'bg-[var(--surface-primary-dark)] dark:bg-[var(--surface-secondary-dark)]'
                                            }`}>
                                                <div className="flex justify-between items-center text-[var(--text-light)] dark:text-white">
                                                    <h4 className="font-bold">
                                                        {profile.name} {profile.isDefault && "(Организатор)"}
                                                    </h4>
                                                    <span className="font-bold">{(profile.currentSum / 100).toFixed(2)} ₽</span>
                                                </div>
                                            </div>

                                            <div className="divide-y divide-[var(--primary-light)] dark:divide-[var(--secondary-dark)]">
                                                {Object.entries(profile.selectedItems).map(([groupKey, itemIds]) => {
                                                    if (itemIds.length === 0) return null;

                                                    const groupItems = groupedProcessedItems[groupKey]?.filter(item =>
                                                        itemIds.includes(item.id)
                                                    ) || [];

                                                    const groupSum = groupItems.reduce((sum, item) => {
                                                        return sum + getItemShare(item.id);
                                                    }, 0);

                                                    return (
                                                        <div key={groupKey} className="p-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h5 className="font-medium text-[var(--text-light)] dark:text-white">{groupKey}</h5>
                                                                <span className="font-medium text-[var(--primary)] dark:text-[var(--secondary)]">
                                                                    {(groupSum / 100).toFixed(2)} ₽
                                                                </span>
                                                            </div>
                                                            <ul className="space-y-2">
                                                                {groupItems.map(item => {
                                                                    const itemShare = getItemShare(item.id);
                                                                    return (
                                                                        <li key={item.id} className="flex justify-between text-sm pl-2">
                                                                            <span className="text-[var(--text-secondary-light)] dark:text-gray-300">
                                                                                {item.name}
                                                                            </span>
                                                                            <span className="text-[var(--text-light)] dark:text-white">
                                                                                {(itemShare / 100).toFixed(2)} ₽
                                                                            </span>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4 border-t border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                             fill="currentColor">
                            <path fillRule="evenodd"
                                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                  clipRule="evenodd"/>
                        </svg>
                        Назад к распределению
                    </button>
                    <button
                        onClick={handleSaveToDatabase}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white transition-colors shadow-md"
                    >
                        <SaveToHistory/>
                        Сохранить отчет в историю
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white transition-colors shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                             fill="currentColor">
                            <path fillRule="evenodd"
                                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                  clipRule="evenodd"/>
                        </svg>
                        Экспортировать отчет
                    </button>
                </div>
            </div>
            {showExportModal && (
                <ExportModal
                    onClose={() => setShowExportModal(false)}
                    onExport={handleExport}
                />
            )}
            {showOverwriteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full text-[var(--text-light)] dark:text-white">
                        <h3 className="text-lg  font-bold mb-4">Отчет уже существует</h3>
                        <p className="mb-4">Отчет с этим QR-кодом уже сохранен. Хотите перезаписать его?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleOverwriteCancel}
                                className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleOverwriteConfirm}
                                className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white transition-colors"
                            >
                                Перезаписать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}