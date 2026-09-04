import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
	useGetDashboardStatsQuery,
	useGetDashboardScheduleQuery,
	useGetDashboardBreakdownQuery,
	useGetDashboardLabAlertsQuery,
	useGetDashboardTopDiagnosesQuery,
	dayBounds,
} from '../../store/api/dashboardApi';
import { KpiCards } from '../../components/dashboard/KpiCards';
import { ScheduleCalendar } from '../../components/dashboard/ScheduleCalendar';
import { VisitTypeBar } from '../../components/dashboard/VisitTypeBar';
import { LabAlertsPanel } from '../../components/dashboard/LabAlertsPanel';
import { TopDiagnosesChart } from '../../components/dashboard/TopDiagnosesChart';
import './Dashboard.css';

function greeting(): string {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
}

const Dashboard = () => {
	useDocumentTitle('Dashboard');

	const doctorName = useAppSelector((s) => s.auth.doctorName);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());

	const selectedBounds = dayBounds(selectedDate);
	const { data: stats, isLoading: statsLoading } =
		useGetDashboardStatsQuery(selectedBounds);
	const { data: visits = [], isLoading: scheduleLoading } =
		useGetDashboardScheduleQuery(selectedBounds);
	const { data: breakdown = [], isLoading: breakdownLoading } =
		useGetDashboardBreakdownQuery();
	const { data: labAlerts = [], isLoading: alertsLoading } =
		useGetDashboardLabAlertsQuery();
	const { data: topDiagnoses = [], isLoading: diagnosesLoading } =
		useGetDashboardTopDiagnosesQuery();

	return (
		<div className="dashboard">
			<h1 className="dashboard-greeting">
				{greeting()}, Dr. {doctorName}
			</h1>
			<KpiCards stats={stats} isLoading={statsLoading} />
			<VisitTypeBar data={breakdown} isLoading={breakdownLoading} />
			<div className="bottom-row">
				<LabAlertsPanel alerts={labAlerts} isLoading={alertsLoading} />
				<TopDiagnosesChart data={topDiagnoses} isLoading={diagnosesLoading} />
			</div>
			<ScheduleCalendar
				selectedDate={selectedDate}
				onDateChange={setSelectedDate}
				visits={visits}
				isLoading={scheduleLoading}
			/>
		</div>
	);
};

export default Dashboard;
