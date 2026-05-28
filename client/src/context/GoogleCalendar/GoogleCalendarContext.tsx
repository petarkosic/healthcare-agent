import { useCallback, useState, useEffect, type ReactNode } from 'react';
import { API_BASE, apiFetch } from '../../lib/api';
import { GoogleCalendarContext } from './GoogleCalendarProvider';

export const GoogleCalendarProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		apiFetch(`${API_BASE}/api/auth/google/status`)
			.then((r) => r.json())
			.then(({ connected: isConnected }) => {
				if (isConnected) setConnected(true);
			})
			.catch(() => {});
	}, []);

	const ensureConnected = useCallback(async () => {
		const statusRes = await apiFetch(`${API_BASE}/api/auth/google/status`);
		const { connected: isConnected } = await statusRes.json();

		if (isConnected) {
			setConnected(true);
			return;
		}

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
					setConnected(true);
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
	}, []);

	return (
		<GoogleCalendarContext.Provider value={{ connected, ensureConnected }}>
			{children}
		</GoogleCalendarContext.Provider>
	);
};
