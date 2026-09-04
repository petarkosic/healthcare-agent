import type { ReactNode } from 'react';

export type NavLink = {
	to: string;
	label: string;
	icon: ReactNode;
	comingSoon?: boolean;
};

export const NAV_LINKS: NavLink[] = [
	{
		to: '/dashboard',
		label: 'Dashboard',
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<rect
					x='3.5'
					y='3.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
				<rect
					x='13.5'
					y='3.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
				<rect
					x='13.5'
					y='13.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
				<rect
					x='3.5'
					y='13.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
			</svg>
		),
	},
	{
		to: '/patients',
		label: 'Patients',
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<circle cx='9' cy='8' r='3.2' stroke='currentColor' strokeWidth='1.6' />
				<path
					d='M3.8 19c0-3 2.3-5.2 5.2-5.2s5.2 2.2 5.2 5.2'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinecap='round'
				/>
				<path
					d='M16.5 6.4a3 3 0 0 1 0 5.6'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinecap='round'
				/>
				<path
					d='M20.5 19c0-2.5-1.7-4.6-4-5.1'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinecap='round'
				/>
			</svg>
		),
	},
];
