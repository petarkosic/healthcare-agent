import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router';
import router from './router/index';
import { SessionProvider } from './context/SessionContext';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<SessionProvider>
			<RouterProvider router={router} />
		</SessionProvider>
	</StrictMode>,
);
