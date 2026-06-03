import { baseApi } from './baseApi';
import type { PatientFullResponse, TPatients } from '../../types/types';

export const patientsApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getPatients: builder.query<TPatients[], void>({
			query: () => ({ url: '/api/patients' }),
			providesTags: ['PatientList'],
		}),

		searchPatients: builder.query<TPatients[], string>({
			query: (q) => ({
				url: `/api/patients/search?patient_serial_number=${encodeURIComponent(q)}`,
			}),
		}),

		getPatient: builder.query<PatientFullResponse, string>({
			query: (id) => ({ url: `/api/patients/${id}` }),
			providesTags: (_result, _err, id) => [{ type: 'Patient' as const, id }],
		}),

		addMedication: builder.mutation<void, { patientId: string; body: unknown }>(
			{
				query: ({ patientId, body }) => ({
					url: `/api/patients/${patientId}/medications`,
					method: 'POST',
					body,
				}),
				invalidatesTags: (_r, _e, { patientId }) => [
					{ type: 'Patient' as const, id: patientId },
				],
			},
		),

		updateMedication: builder.mutation<
			void,
			{ patientId: string; medicationId: string; body: unknown }
		>({
			query: ({ patientId, medicationId, body }) => ({
				url: `/api/patients/${patientId}/medications/${medicationId}`,
				method: 'PUT',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
		}),

		deleteMedication: builder.mutation<
			void,
			{ patientId: string; medicationId: string }
		>({
			query: ({ patientId, medicationId }) => ({
				url: `/api/patients/${patientId}/medications/${medicationId}`,
				method: 'DELETE',
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
		}),

		addDiagnosis: builder.mutation<void, { patientId: string; body: unknown }>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/diagnoses`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
		}),

		updateAllergies: builder.mutation<
			void,
			{ patientId: string; allergies: string[] }
		>({
			query: ({ patientId, allergies }) => ({
				url: `/api/patients/${patientId}/allergies`,
				method: 'PUT',
				body: { allergies },
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
		}),

		addVital: builder.mutation<void, { patientId: string; body: unknown }>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/vitals`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
		}),

		addLab: builder.mutation<void, { patientId: string; body: unknown }>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/labs`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
		}),

		addNote: builder.mutation<void, { patientId: string; body: unknown }>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/notes`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
		}),

		updateVisit: builder.mutation<
			unknown,
			{ patientId: string; body: unknown }
		>({
			query: ({ body }) => ({
				url: '/api/patients/visits',
				method: 'PUT',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
				'PatientList',
			],
		}),

		createVisit: builder.mutation<
			{ visit_id: string },
			{ patientId: string; body: unknown }
		>({
			query: ({ body }) => ({
				url: '/api/patients/visits',
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
				'PatientList',
			],
		}),

		createPatient: builder.mutation<
			{ patient_serial_number: number; visit_id: string },
			unknown
		>({
			query: (body) => ({ url: '/api/patients', method: 'POST', body }),
			invalidatesTags: ['PatientList'],
		}),
	}),
});

export const {
	useGetPatientsQuery,
	useSearchPatientsQuery,
	useGetPatientQuery,
	useAddMedicationMutation,
	useUpdateMedicationMutation,
	useDeleteMedicationMutation,
	useAddDiagnosisMutation,
	useUpdateAllergiesMutation,
	useAddVitalMutation,
	useAddLabMutation,
	useAddNoteMutation,
	useUpdateVisitMutation,
	useCreateVisitMutation,
	useCreatePatientMutation,
} = patientsApi;
