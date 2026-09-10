import { useEffect, useRef, useState } from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/authSlice';
import { getInitials } from '../../utils/utils';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
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
					{!collapsed && <ThemeToggle className='nav-sidebar__cog' />}
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
