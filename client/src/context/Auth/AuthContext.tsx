import { useCallback, useState } from 'react';
import { AuthContext, STORAGE_KEY, type AuthState } from './AuthProvider';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [auth, setAuth] = useState<AuthState>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored
				? JSON.parse(stored)
				: { token: null, doctorSerialNumber: null, doctorName: null };
		} catch {
			localStorage.removeItem(STORAGE_KEY);
			return { token: null, doctorSerialNumber: null, doctorName: null };
		}
	});

	const [isModalOpen, setIsModalOpen] = useState(false);

	const login = useCallback(
		(token: string, doctorSerialNumber: string, doctorName: string) => {
			const next = { token, doctorSerialNumber, doctorName };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			setAuth(next);
		},
		[],
	);

	const logout = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setAuth({ token: null, doctorSerialNumber: null, doctorName: null });
	}, []);

	const openModal = useCallback(() => setIsModalOpen(true), []);
	const closeModal = useCallback(() => setIsModalOpen(false), []);

	return (
		<AuthContext.Provider
			value={{ ...auth, isModalOpen, openModal, closeModal, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};
