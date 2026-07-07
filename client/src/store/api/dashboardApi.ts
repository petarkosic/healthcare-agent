import { baseApi } from './baseApi';

export interface DashboardStats {
	today_scheduled: number;
	today_completed: number;
	today_cancelled: number;
	today_no_show: number;
	active_medications_total: number;
	active_patients: number;
	critical_labs_recent: number;
	upcoming_7_days: number;
}

export interface ScheduleVisit {
	visit_id: string;
	visit_date: string;
	visit_type: string;
	status: string;
	duration_minutes: number;
	location: string;
	chief_complaint: string | null;
}

export interface BreakdownPoint {
	name: string;
	value: number;
}

export interface LabAlert {
	lab_id: string;
	test_name: string;
	result_value: string;
	unit: string | null;
	reference_range: string | null;
	result_status: 'critical' | 'abnormal';
	tested_date: string;
	patient_name: string;
	patient_serial_number: string;
}

export const dashboardApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getDashboardStats: builder.query<
			DashboardStats,
			{ start: string; end: string }
		>({
			query: ({ start, end }) => ({
				url: `/api/dashboard/stats?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
			}),
		}),
		getDashboardSchedule: builder.query<
			ScheduleVisit[],
			{ start: string; end: string }
		>({
			query: ({ start, end }) => ({
				url: `/api/dashboard/schedule?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
			}),
		}),
		getDashboardBreakdown: builder.query<BreakdownPoint[], void>({
			query: () => ({ url: '/api/dashboard/breakdown' }),
		}),
		getDashboardLabAlerts: builder.query<LabAlert[], void>({
			query: () => ({ url: '/api/dashboard/lab-alerts' }),
		}),
	}),
});

export const {
	useGetDashboardStatsQuery,
	useGetDashboardScheduleQuery,
	useGetDashboardBreakdownQuery,
	useGetDashboardLabAlertsQuery,
} = dashboardApi;

export function dayBounds(d: Date): { start: string; end: string } {
	const start = new Date(d);
	start.setHours(0, 0, 0, 0);
	const end = new Date(d);
	end.setHours(24, 0, 0, 0);
	return { start: start.toISOString(), end: end.toISOString() };
}
