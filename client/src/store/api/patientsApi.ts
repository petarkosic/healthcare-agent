import { baseApi } from './baseApi';
import { clearPatientAiCache } from '../aiSlice';
import type { AppDispatch } from '../index';
import type { PatientFullResponse, TPatients } from '../../types/types';
import type { components } from '../../types/api';

type Schemas = components['schemas'];

const invalidateAiCacheOnSuccess =
	<Arg extends { patientId: string }>() =>
	async (
		arg: Arg,
		{
			dispatch,
			queryFulfilled,
		}: { dispatch: AppDispatch; queryFulfilled: Promise<unknown> },
	) => {
		try {
			await queryFulfilled;
			dispatch(clearPatientAiCache(arg.patientId));
		} catch (err) {
			console.error('Mutation failed, AI cache left untouched:', err);
		}
	};

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

		addMedication: builder.mutation<
			void,
			{ patientId: string; body: Schemas['AddMedication'] }
		>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/medications`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		updateMedication: builder.mutation<
			void,
			{
				patientId: string;
				medicationId: string;
				body: Schemas['UpdateMedication'];
			}
		>({
			query: ({ patientId, medicationId, body }) => ({
				url: `/api/patients/${patientId}/medications/${medicationId}`,
				method: 'PUT',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
			onQueryStarted: invalidateAiCacheOnSuccess(),
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
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		addDiagnosis: builder.mutation<
			void,
			{ patientId: string; body: Schemas['AddDiagnosis'] }
		>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/diagnoses`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
			onQueryStarted: invalidateAiCacheOnSuccess(),
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
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		addVital: builder.mutation<
			void,
			{ patientId: string; body: Schemas['AddVitalSigns'] }
		>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/vitals`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		addLab: builder.mutation<
			void,
			{ patientId: string; body: Schemas['AddLabResult'] }
		>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/labs`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		addNote: builder.mutation<
			void,
			{ patientId: string; body: Schemas['Note'] }
		>({
			query: ({ patientId, body }) => ({
				url: `/api/patients/${patientId}/notes`,
				method: 'POST',
				body,
			}),
			invalidatesTags: (_r, _e, { patientId }) => [
				{ type: 'Patient' as const, id: patientId },
			],
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		updateVisit: builder.mutation<
			unknown,
			{ patientId: string; body: Schemas['UpdateVisit'] }
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
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		createVisit: builder.mutation<
			{ visit_id: string },
			{ patientId: string; body: Schemas['SetVisit'] }
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
			onQueryStarted: invalidateAiCacheOnSuccess(),
		}),

		createPatient: builder.mutation<
			{ patient_serial_number: string; visit_id: string },
			Schemas['CreatePatient']
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
