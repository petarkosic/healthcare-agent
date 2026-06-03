import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from '@reduxjs/toolkit';
import { API_BASE, apiFetch } from '../lib/api';

interface AuthState {
	doctorSerialNumber: string | null;
	doctorName: string | null;
	isLoading: boolean;
	isModalOpen: boolean;
}

const initialState: AuthState = {
	doctorSerialNumber: null,
	doctorName: null,
	isLoading: true,
	isModalOpen: false,
};

export const fetchCurrentUser = createAsyncThunk(
	'auth/fetchCurrentUser',
	async () => {
		const res = await fetch(`${API_BASE}/api/auth/me`, {
			credentials: 'include',
		});

		if (!res.ok) return null;

		return res.json();
	},
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
	await apiFetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
});

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		login(state, action: PayloadAction<{ serial: string; name: string }>) {
			state.doctorSerialNumber = action.payload.serial;
			state.doctorName = action.payload.name;
		},
		openModal(state) {
			state.isModalOpen = true;
		},
		closeModal(state) {
			state.isModalOpen = false;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCurrentUser.fulfilled, (state, action) => {
				state.isLoading = false;
				if (action.payload) {
					state.doctorSerialNumber = action.payload.doctor_serial_number;
					state.doctorName = action.payload.doctor_name;
				}
			})
			.addCase(fetchCurrentUser.rejected, (state) => {
				state.isLoading = false;
			})
			.addCase(logoutUser.fulfilled, (state) => {
				state.doctorSerialNumber = null;
				state.doctorName = null;
			});
	},
});

export const { login, openModal, closeModal } = authSlice.actions;
export default authSlice.reducer;
