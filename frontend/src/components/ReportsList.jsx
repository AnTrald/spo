import { useState, useEffect } from 'react';
import SavedReportViewer from './SavedReportViewer';

export default function ReportsList({ username, onBack }) {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReportId, setSelectedReportId] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/reports/by-user/${username}`);
                if (!response.ok) throw new Error('Ошибка загрузки отчетов');
                const data = await response.json();
                setReports(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [username]);

    if (selectedReportId) {
        return (
            <div className="min-h-screen flex flex-col bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
                <SavedReportViewer
                    reportId={selectedReportId}
                    onBack={() => setSelectedReportId(null)}
                />
            </div>

        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] p-4">
            <div className="max-w-4xl w-full mx-auto">
                <h1 className="text-3xl font-bold text-center text-[var(--text-light)] dark:text-[var(--text-dark)] mb-8">Мои отчеты</h1>

                <div className="bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] p-6 rounded-lg shadow-md border border-[var(--primary-light)] dark:border-[var(--secondary-dark)]">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-spin">↻</span>
                        </div>
                    ) : error ? (
                        <div className="p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                            <p className="text-red-600 dark:text-red-200 text-center">{error}</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <p className="text-center text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)] py-4">
                            У вас пока нет сохраненных отчетов
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {reports.map(report => (
                                <div
                                    key={report.id}
                                    className="bg-[var(--surface-secondary-light)] dark:bg-[var(--surface-secondary-dark)] p-4 rounded-lg border border-[var(--primary-light)] dark:border-[var(--secondary-dark)] hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedReportId(report.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-[var(--text-light)] dark:text-white">
                                                Отчет от {report.date}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300">
                                                Организатор: {report.owner}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[var(--primary)] dark:text-[var(--secondary)]">
                                                {report.total_sum.toFixed(2)} ₽
                                            </p>
                                            <p className="text-sm text-[var(--text-secondary-light)] dark:text-gray-300">
                                                {report.participants_count} участника
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={onBack}
                        className="w-full mt-6 bg-[var(--primary)] hover:bg-[var(--primary-dark)] dark:bg-[var(--secondary)] dark:hover:bg-[var(--secondary-dark)] text-white py-3 px-4 rounded-lg transition duration-200 shadow-md"
                    >
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
}