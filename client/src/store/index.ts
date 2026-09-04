import { configureStore } from '@reduxjs/toolkit';
import authReducer, { fetchCurrentUser } from './authSlice';
import sessionReducer from './sessionSlice';
import googleCalendarReducer, {
	checkGoogleCalendarStatus,
} from './googleCalendarSlice';
import aiReducer from './aiSlice';
import uiReducer from './uiSlice';
import { baseApi } from './api/baseApi';

const STORAGE_KEY = 'healthcare_active_session';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		session: sessionReducer,
		googleCalendar: googleCalendarReducer,
		ai: aiReducer,
		ui: uiReducer,
		[baseApi.reducerPath]: baseApi.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(baseApi.middleware),
});

let prevSession:
	| ReturnType<typeof store.getState>['session']['session']
	| null = null;

store.subscribe(() => {
	const { session } = store.getState().session;

	if (session === prevSession) return;
	prevSession = session;

	if (session) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	} else {
		localStorage.removeItem(STORAGE_KEY);
	}
});

store.dispatch(fetchCurrentUser());
store.dispatch(checkGoogleCalendarStatus());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
