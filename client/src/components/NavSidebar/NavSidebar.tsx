import { useEffect, useRef, useState } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/uiSlice';
import { logoutUser } from '../../store/authSlice';
import { getInitials } from '../../utils/utils';
import { NAV_LINKS } from './navLinks';
import './NavSidebar.css';

type NavSidebarProps = {
	/** When true the sidebar renders as an overlay drawer (mobile). */
	asDrawer?: boolean;
	onNavigate?: () => void;
};

const BrandMark = () => (
	<svg
		className='nav-sidebar__mark'
		viewBox='0 0 24 24'
		fill='none'
		aria-hidden='true'
	>
		<rect
			x='2'
			y='2'
			width='20'
			height='20'
			rx='6'
			stroke='currentColor'
			strokeWidth='1.6'
		/>
		<path
			d='M6 13h3l2-5 2.6 8L18 11'
			stroke='currentColor'
			strokeWidth='1.6'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
);

export const NavSidebar = ({
	asDrawer = false,
	onNavigate,
}: NavSidebarProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed) && !asDrawer;
	const theme = useAppSelector((s) => s.ui.theme);
	const doctorName = useAppSelector((s) => s.auth.doctorName);
	const doctorSerial = useAppSelector((s) => s.auth.doctorSerialNumber);

	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const onDown = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', onDown);
		return () => document.removeEventListener('mousedown', onDown);
	}, [menuOpen]);

	const openSettings = () => {
		setMenuOpen(false);
		onNavigate?.();
		document.dispatchEvent(new CustomEvent('mediflow:open-settings'));
	};

	const signOut = async () => {
		setMenuOpen(false);
		onNavigate?.();
		await dispatch(logoutUser());
		navigate('/');
	};

	return (
		<aside
			className={`nav-sidebar${asDrawer ? ' nav-sidebar--in-drawer' : ''}`}
			data-collapsed={collapsed || undefined}
			aria-label='Main navigation'
		>
			<div className='nav-sidebar__top'>
				<RouterNavLink
					to='/dashboard'
					className='nav-sidebar__brand'
					onClick={onNavigate}
				>
					<BrandMark />
					{!collapsed && (
						<span className='nav-sidebar__wordmark'>MediFlow</span>
					)}
				</RouterNavLink>
				{asDrawer && (
					<button
						type='button'
						className='nav-sidebar__close'
						onClick={onNavigate}
						aria-label='Close navigation'
					>
						<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
							<path
								d='M6 6l12 12M18 6L6 18'
								stroke='currentColor'
								strokeWidth='1.8'
								strokeLinecap='round'
							/>
						</svg>
					</button>
				)}
			</div>

			{!collapsed && <p className='nav-sidebar__section'>Workspace</p>}

			<nav className='nav-sidebar__nav'>
				{NAV_LINKS.map((link) => (
					<RouterNavLink
						key={link.to}
						to={link.to}
						className={({ isActive }) =>
							`nav-sidebar__item${isActive ? ' is-active' : ''}`
						}
						title={collapsed ? link.label : undefined}
						onClick={onNavigate}
					>
						{link.icon}
						{!collapsed && (
							<span className='nav-sidebar__label'>{link.label}</span>
						)}
					</RouterNavLink>
				))}
			</nav>

			<div className='nav-sidebar__foot' ref={menuRef}>
				<div className='nav-sidebar__profile'>
					<button
						type='button'
						className='nav-sidebar__account'
						onClick={() => setMenuOpen((o) => !o)}
						aria-haspopup='menu'
						aria-expanded={menuOpen}
						aria-label='Account menu'
					>
						<span className='nav-sidebar__avatar'>
							{getInitials(doctorName ?? '')}
						</span>
						{!collapsed && (
							<span className='nav-sidebar__who'>
								<b>Dr. {doctorName}</b>
								<span className='u-mono'>#{doctorSerial}</span>
							</span>
						)}
					</button>
					{!collapsed && (
						<button
							type='button'
							className='nav-sidebar__cog'
							onClick={() => dispatch(toggleTheme())}
							aria-label={
								theme === 'dark'
									? 'Switch to light mode'
									: 'Switch to dark mode'
							}
							title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
						>
							{theme === 'dark' ? (
								<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
									<circle
										cx='12'
										cy='12'
										r='4.2'
										stroke='currentColor'
										strokeWidth='1.6'
									/>
									<path
										d='M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7'
										stroke='currentColor'
										strokeWidth='1.6'
										strokeLinecap='round'
									/>
								</svg>
							) : (
								<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
									<path
										d='M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z'
										stroke='currentColor'
										strokeWidth='1.6'
										strokeLinejoin='round'
									/>
								</svg>
							)}
						</button>
					)}
				</div>

				{menuOpen && (
					<div className='nav-sidebar__menu' role='menu'>
						<button type='button' role='menuitem' onClick={openSettings}>
							Settings
						</button>
						<button
							type='button'
							role='menuitem'
							className='is-danger'
							onClick={signOut}
						>
							Log out
						</button>
					</div>
				)}
			</div>
		</aside>
	);
};
