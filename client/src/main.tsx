import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router';
import router from './router/index';
import { SessionProvider } from './context/SessionContext';
import { AuthProvider } from './context/Auth/AuthContext';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AuthProvider>
			<SessionProvider>
				<RouterProvider router={router} />
			</SessionProvider>
		</AuthProvider>
	</StrictMode>,
);
