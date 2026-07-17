import { baseApi } from './baseApi';

interface ScheduleFollowupBody {
	patient_serial_number: string;
	visit_date: string;
	visit_type: string;
	summary: string;
	start_time: string;
	end_time: string;
	description: string;
}

interface ScheduleFollowupResponse {
	success: boolean;
	error?: string;
}

export const agentsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		scheduleFollowup: builder.mutation<ScheduleFollowupResponse, ScheduleFollowupBody>({
			query: (body) => ({
				url: '/api/agents/schedule-followup',
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patient_serial_number }) => [
				{ type: 'Patient' as const, id: patient_serial_number },
				'PatientList',
			],
		}),
	}),
});

export const { useScheduleFollowupMutation } = agentsApi;
