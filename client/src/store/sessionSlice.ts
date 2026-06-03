import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'healthcare_active_session';

interface Session {
	startTime: number;
	type: string;
	location: string;
	visitId: string | null;
	patientSerialNumber: string | null;
}

interface SessionState {
	session: Session | null;
}

function loadFromStorage(): Session | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);

		return raw ? (JSON.parse(raw) as Session) : null;
	} catch {
		return null;
	}
}

const initialState: SessionState = {
	session: loadFromStorage(),
};

const sessionSlice = createSlice({
	name: 'session',
	initialState,
	reducers: {
		startSession(
			state,
			action: PayloadAction<{
				type: string;
				location: string;
				visitId?: string;
				patientSerialNumber?: string;
			}>,
		) {
			state.session = {
				startTime: Date.now(),
				type: action.payload.type,
				location: action.payload.location,
				visitId: action.payload.visitId ?? null,
				patientSerialNumber: action.payload.patientSerialNumber ?? null,
			};
		},
		endSession(state) {
			state.session = null;
		},
	},
});

export const { startSession, endSession } = sessionSlice.actions;
export default sessionSlice.reducer;
