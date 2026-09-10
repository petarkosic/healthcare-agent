import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/uiSlice';

type ThemeToggleProps = {
	/** Class on the button so each host can style it (sidebar cog, landing nav, …). */
	className?: string;
};

/** Light/dark switch. Reads/writes `state.ui.theme` via `toggleTheme`. */
export const ThemeToggle = ({ className }: ThemeToggleProps) => {
	const dispatch = useAppDispatch();
	const theme = useAppSelector((state) => state.ui.theme);
	const isDark = theme === 'dark';

	return (
		<button
			type='button'
			className={className}
			onClick={() => dispatch(toggleTheme())}
			aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
			title={isDark ? 'Light mode' : 'Dark mode'}
		>
			{isDark ? (
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
	);
};
