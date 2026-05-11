import { createContext, useState, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/* eslint-disable react-refresh/only-export-components */

const SESSION_STORAGE_KEY = 'healthcare_active_session';

interface Session {
	startTime: number;
	type: string;
	location: string;
	visitId: string | null;
	patientSerialNumber: string | null;
}

interface SessionContextType {
	session: Session | null;
	elapsedTime: number;
	formatTime: (seconds: number) => string;
	startSession: (
		type: string,
		location: string,
		visitId?: string,
		patientSerialNumber?: string,
	) => void;
	endSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [session, setSession] = useLocalStorage<Session | null>(
		SESSION_STORAGE_KEY,
		null,
	);
	const [elapsedTime, setElapsedTime] = useState<number>(() =>
		session ? Math.floor((Date.now() - session.startTime) / 1000) : 0,
	);

	useEffect(() => {
		let intervalId: number | undefined;

		if (session) {
			intervalId = window.setInterval(() => {
				setElapsedTime(Math.floor((Date.now() - session.startTime) / 1000));
			}, 1000);
		}

		return () => {
			setElapsedTime(0);

			if (intervalId !== undefined) {
				clearInterval(intervalId);
			}
		};
	}, [session]);

	const startSession = (
		type: string,
		location: string,
		visitId?: string,
		patientSerialNumber?: string,
	) => {
		setSession({
			startTime: Date.now(),
			type,
			location,
			visitId: visitId ?? null,
			patientSerialNumber: patientSerialNumber ?? null,
		});
	};

	const endSession = () => {
		setSession(null);
	};

	const formatTime = (seconds: number): string => {
		const h = Math.floor(seconds / 3600)
			.toString()
			.padStart(2, '0');
		const m = Math.floor((seconds % 3600) / 60)
			.toString()
			.padStart(2, '0');
		const s = (seconds % 60).toString().padStart(2, '0');
		return `${h}:${m}:${s}`;
	};

	const value = {
		session,
		elapsedTime,
		formatTime,
		startSession,
		endSession,
	};

	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	);
};

export const useSession = (): SessionContextType => {
	const context = useContext(SessionContext);

	if (context === undefined) {
		throw new Error('useSession must be used within a SessionProvider');
	}

	return context;
};
