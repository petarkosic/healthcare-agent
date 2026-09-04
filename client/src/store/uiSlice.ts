import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const SIDEBAR_KEY = 'mediflow.sidebar';
const THEME_KEY = 'mediflow.theme';

type Theme = 'light' | 'dark';

function readCollapsed(): boolean {
	try {
		return localStorage.getItem(SIDEBAR_KEY) === '1';
	} catch {
		return false;
	}
}

function writeCollapsed(collapsed: boolean): void {
	// localStorage can throw (private mode, storage disabled, quota, sandboxed
	// iframe). Persisting a UI preference is best-effort — if it fails the app
	// still works this session, it just won't remember the choice next load.
	try {
		localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
	} catch {
		/* persistence unavailable — keep going */
	}
}

function readTheme(): Theme {
	try {
		return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

function applyTheme(theme: Theme): void {
	try {
		if (theme === 'dark') {
			document.documentElement.dataset.theme = 'dark';
		} else {
			delete document.documentElement.dataset.theme;
		}

		localStorage.setItem(THEME_KEY, theme);
	} catch {
		/* persistence unavailable — keep going */
	}
}

// apply the stored theme before the first paint
applyTheme(readTheme());

interface UiState {
	sidebarCollapsed: boolean;
	theme: Theme;
}

const initialState: UiState = {
	sidebarCollapsed: readCollapsed(),
	theme: readTheme(),
};

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		toggleSidebar(state) {
			state.sidebarCollapsed = !state.sidebarCollapsed;
			writeCollapsed(state.sidebarCollapsed);
		},
		setSidebarCollapsed(state, action: PayloadAction<boolean>) {
			state.sidebarCollapsed = action.payload;
			writeCollapsed(state.sidebarCollapsed);
		},
		toggleTheme(state) {
			state.theme = state.theme === 'dark' ? 'light' : 'dark';
			applyTheme(state.theme);
		},
		setTheme(state, action: PayloadAction<Theme>) {
			state.theme = action.payload;
			applyTheme(state.theme);
		},
	},
});

export const { toggleSidebar, setSidebarCollapsed, toggleTheme, setTheme } =
	uiSlice.actions;
export default uiSlice.reducer;
