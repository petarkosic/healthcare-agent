import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './AuthProvider';
import { API_BASE } from '../../lib/api';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [doctorSerialNumber, setDoctorSerialNumber] = useState<string | null>(
		null,
	);
	const [doctorName, setDoctorName] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data) {
					setDoctorSerialNumber(data.doctor_serial_number);
					setDoctorName(data.doctor_name);
				}
			})
			.catch(() => {})
			.finally(() => setIsLoading(false));
	}, []);

	const login = useCallback((serial: string, name: string) => {
		setDoctorSerialNumber(serial);
		setDoctorName(name);
	}, []);

	const logout = useCallback(async () => {
		await fetch(`${API_BASE}/api/auth/logout`, {
			method: 'POST',
			credentials: 'include',
		});
		setDoctorSerialNumber(null);
		setDoctorName(null);
	}, []);

	const openModal = useCallback(() => setIsModalOpen(true), []);
	const closeModal = useCallback(() => setIsModalOpen(false), []);

	return (
		<AuthContext.Provider
			value={{
				doctorSerialNumber,
				doctorName,
				isLoading,
				isModalOpen,
				openModal,
				closeModal,
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
