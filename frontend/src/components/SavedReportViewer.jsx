import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportModal from "./ExportModal.jsx";
import '../fonts/ArialMT-normal.js';

export default function SavedReportViewer({ reportId, onBack }) {
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [activeProfile, setActiveProfile] = useState(null);
    const [participants_count, setParticipants_count] = useState(0);
    const [totalSum, setTotalSum] = useState(0);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/reports/by-id/${reportId}`);
                if (!response.ok) throw new Error('Ошибка загрузки отчета');
                const data = await response.json();

                // Проверяем структуру данных
                if (!data || !data.data) {
                    throw new Error('Неверный формат данных отчета');
                }

                setReportData(data.data);
                setParticipants_count(data.participants_count)
                setTotalSum(data.data[0].total)
            } catch (err) {
                setError(err.message);
                setReportData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);

    const handleExportPDF = () => {
        if (!reportData || !reportData) return;

        const doc = new jsPDF();
        doc.setFont('ArialMT');

        // Заголовок
        doc.setFontSize(18);
        doc.text("Финансовый отчет по чеку", 14, 20);

        // Общая информация
        doc.setFontSize(12);
        doc.text(`Общая сумма: ${(totalSum || 0).toFixed(2).replace('.', ',')} ₽`, 14, 30);
        doc.text(`Количество участников: ${participants_count || 0}`, 14, 36);
        doc.text(`Получатель платежей: ${reportData.recipient_username || ''}`, 14, 42);

        // Подготовка данных таблицы
        const tableData = (reportData || []).map(item => [
            item.profile || '',
            item.product || '',
            '1',
            `${(item.price || 0).toFixed(2).replace('.', ',')} ₽`,
            `${(item.total || 0).toFixed(2).replace('.', ',')} ₽`
        ]);

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

        doc.save(`отчет_по_чеку_${reportId}.pdf`);
    };

    const handleExportCSV = () => {
        if (!reportData) return;

        let csvContent = "\uFEFF"; // BOM для UTF-8
        csvContent += "Профиль;Товар;Количество;Сумма;Должен\n";

        (reportData || []).forEach(item => {
            csvContent += `"${item.profile || ''}";"${item.product || ''}";1;${(item.price || 0).toFixed(2).replace('.', ',')};${(item.total || 0).toFixed(2).replace('.', ',')}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `отчет_по_чеку_${reportId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = (format) => {
        setShowExportModal(false);
        if (format === 'pdf') {
            handleExportPDF();
        } else {
            handleExportCSV();
        }
    };

    // Группировка товаров по профилям
    const getProfilesData = () => {
        if (!reportData || !reportData) return [];
        const profilesData = {};
        reportData.forEach(item => {
            if (!item.profile) return;

            if (!profilesData[item.profile]) {
                profilesData[item.profile] = {
                    items: [],
                    total: 0,
                    isDefault: item.profile === reportData.recipient_username
                };
            }
            profilesData[item.profile].items.push(item);
            profilesData[item.profile].total += item.price || 0;
        });

        return Object.keys(profilesData).map(profileName => ({
            name: profileName,
            items: profilesData[profileName].items,
            total: profilesData[profileName].total,
            isDefault: profilesData[profileName].isDefault
        }));
    };

    const profiles = getProfilesData();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="animate-spin">↻</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg max-w-md">
                    <p className="text-red-600 dark:text-red-200">{error}</p>
                </div>
                <button
                    onClick={onBack}
                    className="mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                    Назад
                </button>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="mb-4">Отчет не найден</p>
                <button
                    onClick={onBack}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                    Назад
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="sticky top-0 z-10 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] pt-4 pb-2 px-4">
                <h2 className="text-2xl font-bold text-center text-[var(--text-light)] dark:text-white">
                    Финансовый отчет
                </h2>
            </div>

            <div className="flex-1 overflow-auto px-4 pb-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Общая информация */}
                    <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                        <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-white">Общая информация</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-[var(--surface-secondary-light)] dark:bg-[var(--surface-secondary-dark)] p-4 rounded-lg">
                                <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300 mb-1">Общая сумма чека:</p>
                                <p className="text-2xl font-bold text-[var(--text-light)] dark:text-white">{(totalSum || 0).toFixed(2)} ₽</p>
                            </div>
                            <div className="bg-[var(--surface-secondary-light)] dark:bg-[var(--surface-secondary-dark)] p-4 rounded-lg">
                                <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300 mb-1">Количество участников:</p>
                                <p className="text-2xl font-bold text-[var(--text-light)] dark:text-white">{participants_count || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Распределение платежей */}
                    <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                        <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-white">
                            Распределение платежей
                        </h3>

                        <div className="space-y-4">
                            {profiles.map(profile => (
                                <div
                                    key={profile.name}
                                    onClick={() => setActiveProfile(activeProfile === profile.name ? null : profile.name)}
                                    className={`flex justify-between items-center p-4 rounded-lg cursor-pointer transition-colors border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] ${
                                        activeProfile === profile.name
                                            ? 'bg-[var(--primary)] dark:bg-[var(--secondary)] hover:bg-[var(--primary-dark)] dark:hover:bg-[var(--secondary-dark)]'
                                            : 'bg-[var(--surface-primary-dark)] dark:bg-[var(--surface-secondary-dark)] hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div>
                                        <p className="font-medium text-[var(--text-light)] dark:text-white">
                                            {profile.name}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300">
                                            Сумма: {(profile.total || 0).toFixed(2)} ₽
                                        </p>
                                    </div>
                                    {profile.isDefault && (
                                        <div className="px-3 py-2 rounded-lg bg-white/20">
                                            <p className="font-bold">Получает платежи</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Детализация по пользователям */}
                    {activeProfile && (
                        <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                            <h3 className="text-xl font-semibold mb-4 text-[var(--text-light)] dark:text-white">
                                Детализация: {activeProfile}
                            </h3>

                            <div className="border border-[var(--primary-dark)] dark:border-[var(--secondary-dark)] rounded-lg overflow-hidden">
                                <div className={`p-4 ${
                                    profiles.find(p => p.name === activeProfile)?.isDefault
                                        ? 'bg-[var(--primary)] dark:bg-[var(--secondary-dark)] text-white'
                                        : 'bg-[var(--surface-primary-dark)] dark:bg-[var(--surface-secondary-dark)]'
                                }`}>
                                    <div className="flex justify-between items-center text-[var(--text-light)] dark:text-white">
                                        <h4 className="font-bold">
                                            {activeProfile} {profiles.find(p => p.name === activeProfile)?.isDefault && "(Организатор)"}
                                        </h4>
                                        <span className="font-bold">
                                            {(profiles.find(p => p.name === activeProfile)?.total || 0).toFixed(2)} ₽
                                        </span>
                                    </div>
                                </div>

                                <div className="divide-y divide-[var(--primary-light)] dark:divide-[var(--secondary-dark)]">
                                    {profiles.find(p => p.name === activeProfile)?.items.map((item, index) => (
                                        <div key={index} className="p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[var(--text-secondary-light)] dark:text-gray-300">
                                                    {item.product || ''}
                                                </span>
                                                <span className="text-[var(--text-light)] dark:text-white">
                                                    {(item.price || 0).toFixed(2)} ₽
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="sticky bottom-0 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4 border-t border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                        </svg>
                        Назад
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white transition-colors shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
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
        </div>
    );
}