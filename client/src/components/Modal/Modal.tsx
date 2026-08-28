import { useId } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';

type ModalProps = {
	title: string;
	onClose: () => void;
	/** Mid-submit: blocks overlay-click, Escape, and the close button. */
	disabled?: boolean;
	size?: 'default' | 'wide';
	className?: string;
	children: React.ReactNode;
};

export const Modal = ({
	title,
	onClose,
	disabled = false,
	size = 'default',
	className,
	children,
}: ModalProps) => {
	const titleId = useId();
	const dialogRef = useModalA11y<HTMLDivElement>(onClose, { disabled });

	const contentClass = [
		'modal-content',
		size === 'wide' ? 'modal-content--wide' : '',
		className ?? '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			className='modal-overlay'
			onClick={disabled ? undefined : onClose}
		>
			<div
				className={contentClass}
				onClick={(e) => e.stopPropagation()}
				ref={dialogRef}
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				tabIndex={-1}
			>
				<div className='modal-header'>
					<h2 id={titleId}>{title}</h2>
					<button
						className='modal-close'
						onClick={disabled ? undefined : onClose}
						disabled={disabled}
						aria-label='Close'
					>
						&times;
					</button>
				</div>
				{children}
			</div>
		</div>
	);
};
