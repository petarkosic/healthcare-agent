import { createContext, useContext } from 'react';

export interface GoogleCalendarContextType {
	connected: boolean;
	ensureConnected: () => Promise<void>;
}

export const GoogleCalendarContext =
	createContext<GoogleCalendarContextType | null>(null);

export const useGoogleCalendar = (): GoogleCalendarContextType => {
	const ctx = useContext(GoogleCalendarContext);

	if (!ctx)
		throw new Error(
			'useGoogleCalendar must be used inside GoogleCalendarProvider',
		);

	return ctx;
};
