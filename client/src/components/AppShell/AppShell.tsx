import { useState } from 'react';
import { Outlet } from 'react-router';
import { NavSidebar } from '../NavSidebar/NavSidebar';
import { AppHeader } from './AppHeader';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import './AppShell.css';

const AppShell = () => {
	const isMobile = useMediaQuery('(max-width: 640px)');
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [wasMobile, setWasMobile] = useState(isMobile);

	if (isMobile !== wasMobile) {
		setWasMobile(isMobile);

		if (!isMobile) setDrawerOpen(false);
	}

	return (
		<div className='app-shell'>
			<NavSidebar />

			{drawerOpen && (
				<div
					className='nav-drawer'
					role='dialog'
					aria-modal='true'
					aria-label='Navigation'
				>
					<div
						className='nav-drawer__scrim'
						onClick={() => setDrawerOpen(false)}
					/>
					<div className='nav-drawer__panel'>
						<NavSidebar asDrawer onNavigate={() => setDrawerOpen(false)} />
					</div>
				</div>
			)}

			<main className='app-shell__main'>
				<AppHeader
					isMobile={isMobile}
					onOpenDrawer={() => setDrawerOpen(true)}
				/>
				<Outlet />
			</main>
		</div>
	);
};

export default AppShell;
