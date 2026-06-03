import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE, apiFetch } from '../lib/api';

export const checkGoogleCalendarStatus = createAsyncThunk(
	'googleCalendar/checkStatus',
	async () => {
		const res = await apiFetch(`${API_BASE}/api/auth/google/status`);
		const { connected } = await res.json();

		return connected as boolean;
	},
);

export const ensureGoogleConnected = createAsyncThunk(
	'googleCalendar/ensureConnected',
	async () => {
		const statusRes = await apiFetch(`${API_BASE}/api/auth/google/status`);
		const { connected } = await statusRes.json();
		if (connected) return;

		const authRes = await apiFetch(`${API_BASE}/api/auth/google/authorize`);
		const { auth_url } = await authRes.json();

		await new Promise<void>((resolve, reject) => {
			const popup = window.open(
				auth_url,
				'google_oauth',
				'width=500,height=600',
			);

			const handler = (e: MessageEvent) => {
				if (e.data === 'google_connected') {
					window.removeEventListener('message', handler);

					popup?.close();

					resolve();
				} else if (e.data === 'google_auth_failed') {
					window.removeEventListener('message', handler);

					popup?.close();

					reject(new Error('Google authorization failed or was denied'));
				}
			};

			window.addEventListener('message', handler);

			setTimeout(() => {
				window.removeEventListener('message', handler);

				reject(new Error('OAuth timeout'));
			}, 300000);
		});
	},
);

interface GoogleCalendarState {
	connected: boolean;
}

const googleCalendarSlice = createSlice({
	name: 'googleCalendar',
	initialState: { connected: false } as GoogleCalendarState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(checkGoogleCalendarStatus.fulfilled, (state, action) => {
				state.connected = action.payload;
			})
			.addCase(ensureGoogleConnected.fulfilled, (state) => {
				state.connected = true;
			});
	},
});

export default googleCalendarSlice.reducer;
