import { createContext, useContext } from 'react';

export interface AuthState {
	doctorSerialNumber: string | null;
	doctorName: string | null;
	isLoading: boolean;
}

export interface AuthContextType extends AuthState {
	isModalOpen: boolean;
	openModal: () => void;
	closeModal: () => void;
	login: (doctorSerialNumber: string, doctorName: string) => void;
	logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
	return ctx;
};
