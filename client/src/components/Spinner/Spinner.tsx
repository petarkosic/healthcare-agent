import './Spinner.css';

type SpinnerProps = {
	size?: 'sm' | 'md' | 'lg';
	tone?: 'default' | 'on-ink';
};

export const Spinner = ({ size = 'md', tone = 'default' }: SpinnerProps) => (
	<span
		className={`spinner spinner--${size}${
			tone === 'on-ink' ? ' spinner--on-ink' : ''
		}`}
		role="status"
		aria-live="polite"
	>
		<span className="sr-only">Loading</span>
	</span>
);
