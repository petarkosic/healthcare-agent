import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type {
	Overview,
	RecommendationsResponse,
	MedicationsResponse,
} from '../types/types';
import { API_BASE, apiFetch } from '../lib/api';

type FetchStatus = 'idle' | 'loading' | 'done' | 'error';

interface PatientAiCache {
	overview: Overview | null;
	overviewStatus: FetchStatus;
	recommendations: RecommendationsResponse | null;
	recommendationsStatus: FetchStatus;
	medications: MedicationsResponse | null;
	medicationsStatus: FetchStatus;
}

interface AiState {
	byPatient: Record<string, PatientAiCache>;
}

const emptyCache = (): PatientAiCache => ({
	overview: null,
	overviewStatus: 'idle',
	recommendations: null,
	recommendationsStatus: 'idle',
	medications: null,
	medicationsStatus: 'idle',
});

const initialState: AiState = { byPatient: {} };

export const fetchAiOverview = createAsyncThunk(
	'ai/fetchOverview',
	async (patientSerial: string) => {
		const res = await apiFetch(
			`${API_BASE}/api/agents/overview/${patientSerial}`,
		);

		if (!res.ok) throw new Error('Failed to get AI overview');

		return (await res.json()) as Overview;
	},
	{
		condition: (patientSerial, { getState }) => {
			const state = getState() as RootState;
			const status = state.ai.byPatient[patientSerial]?.overviewStatus;

			return status !== 'done' && status !== 'loading';
		},
	},
);

export const fetchAiRecommendations = createAsyncThunk(
	'ai/fetchRecommendations',
	async ({ overviewText }: { patientSerial: string; overviewText: string }) => {
		const res = await apiFetch(`${API_BASE}/api/agents/recommendations`, {
			method: 'POST',
			body: JSON.stringify({ overview: overviewText }),
		});

		if (!res.ok) throw new Error('Failed to get recommendations');

		return (await res.json()) as RecommendationsResponse;
	},
	{
		condition: ({ patientSerial }, { getState }) => {
			const state = getState() as RootState;
			const status = state.ai.byPatient[patientSerial]?.recommendationsStatus;

			return status !== 'done' && status !== 'loading';
		},
	},
);

export const fetchAiMedications = createAsyncThunk(
	'ai/fetchMedications',
	async ({
		overviewText,
		currentMedications,
	}: {
		patientSerial: string;
		overviewText: string;
		currentMedications: {
			name: string;
			dosage: string;
			frequency: string;
			reason: string;
		}[];
	}) => {
		const res = await apiFetch(`${API_BASE}/api/agents/medications`, {
			method: 'POST',
			body: JSON.stringify({
				overview: overviewText,
				current_medications: currentMedications,
			}),
		});

		if (!res.ok) throw new Error('Failed to get medications');

		return (await res.json()) as MedicationsResponse;
	},
	{
		condition: ({ patientSerial }, { getState }) => {
			const state = getState() as RootState;
			const status = state.ai.byPatient[patientSerial]?.medicationsStatus;

			return status !== 'done' && status !== 'loading';
		},
	},
);

const ensure = (state: AiState, patientSerial: string) => {
	if (!state.byPatient[patientSerial])
		state.byPatient[patientSerial] = emptyCache();
};

const aiSlice = createSlice({
	name: 'ai',
	initialState,
	reducers: {
		clearPatientAiCache(state, action: { payload: string }) {
			delete state.byPatient[action.payload];
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAiOverview.pending, (state, { meta }) => {
				ensure(state, meta.arg);
				state.byPatient[meta.arg].overviewStatus = 'loading';
			})
			.addCase(fetchAiOverview.fulfilled, (state, { meta, payload }) => {
				state.byPatient[meta.arg].overview = payload;
				state.byPatient[meta.arg].overviewStatus = 'done';
			})
			.addCase(fetchAiOverview.rejected, (state, { meta }) => {
				ensure(state, meta.arg);
				state.byPatient[meta.arg].overviewStatus = 'error';
			})

			.addCase(fetchAiRecommendations.pending, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].recommendationsStatus =
					'loading';
			})
			.addCase(fetchAiRecommendations.fulfilled, (state, { meta, payload }) => {
				state.byPatient[meta.arg.patientSerial].recommendations = payload;
				state.byPatient[meta.arg.patientSerial].recommendationsStatus = 'done';
			})
			.addCase(fetchAiRecommendations.rejected, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].recommendationsStatus = 'error';
			})

			.addCase(fetchAiMedications.pending, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].medicationsStatus = 'loading';
			})
			.addCase(fetchAiMedications.fulfilled, (state, { meta, payload }) => {
				state.byPatient[meta.arg.patientSerial].medications = payload;
				state.byPatient[meta.arg.patientSerial].medicationsStatus = 'done';
			})
			.addCase(fetchAiMedications.rejected, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].medicationsStatus = 'error';
			});
	},
});

export const { clearPatientAiCache } = aiSlice.actions;
export default aiSlice.reducer;
