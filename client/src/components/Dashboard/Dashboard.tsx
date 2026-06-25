import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import {
	useGetDashboardStatsQuery,
	useGetDashboardScheduleQuery,
	dayBounds,
} from '../../store/api/dashboardApi';
import { KpiCards } from './KpiCards';
import { ScheduleCalendar } from './ScheduleCalendar';
import './Dashboard.css';


function greeting(): string {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
}

const Dashboard = () => {
	const doctorName = useAppSelector((s) => s.auth.doctorName);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());

	const selectedBounds = dayBounds(selectedDate);
	const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery(selectedBounds);
	const { data: visits = [], isLoading: scheduleLoading } =
		useGetDashboardScheduleQuery(selectedBounds);

	return (
		<div className='dashboard'>
			<h1 className='dashboard-greeting'>
				{greeting()}, Dr. {doctorName}
			</h1>
			<KpiCards stats={stats} isLoading={statsLoading} />
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
