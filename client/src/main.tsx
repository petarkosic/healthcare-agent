import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/primitives.css';
import { RouterProvider } from 'react-router';
import router from './router/index';
import { Provider } from 'react-redux';
import { store } from './store';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	</StrictMode>,
);
