import { createContext, useContext } from 'react';

export interface AuthState {
	token: string | null;
	doctorSerialNumber: string | null;
	doctorName: string | null;
}

export interface AuthContextType extends AuthState {
	isModalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
	login: (
		token: string,
		doctorSerialNumber: string,
		doctorName: string,
	) => void;
	logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const STORAGE_KEY = 'ha_auth';

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
	return ctx;
};
