import { useEffect, useRef } from 'react';

type Options = {
	/** When true, Escape and focus-trap still work but close is suppressed (e.g. mid-submit). */
	disabled?: boolean;
	/** Set false when the dialog is mounted but not shown, so effects no-op. Defaults to true. */
	active?: boolean;
};

const FOCUSABLE =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessibility plumbing shared by modal dialogs:
 * - Escape closes (unless `disabled`)
 * - body scroll locked while mounted
 * - focus moved into the dialog on mount, restored to the trigger on unmount
 * - Tab / Shift+Tab trapped within the dialog
 *
 * Attach the returned ref to the dialog container element.
 */
export const useModalA11y = <T extends HTMLElement = HTMLDivElement>(
	onClose: () => void,
	{ disabled = false, active = true }: Options = {},
) => {
	const ref = useRef<T>(null);

	useEffect(() => {
		if (!active) return;

		const previouslyFocused = document.activeElement as HTMLElement | null;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const node = ref.current;
		const focusables = node?.querySelectorAll<HTMLElement>(FOCUSABLE);
		(focusables?.[0] ?? node)?.focus();

		return () => {
			document.body.style.overflow = originalOverflow;
			previouslyFocused?.focus?.();
		};
	}, [active]);

	useEffect(() => {
		if (!active) return;

		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (!disabled) onClose();
				return;
			}

			if (e.key !== 'Tab') return;

			const node = ref.current;
			if (!node) return;

			const focusables = Array.from(
				node.querySelectorAll<HTMLElement>(FOCUSABLE),
			);
			if (focusables.length === 0) {
				e.preventDefault();
				return;
			}

			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement;

			if (e.shiftKey && (active === first || !node.contains(active))) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		};

		document.addEventListener('keydown', handler);

		return () => document.removeEventListener('keydown', handler);
	}, [onClose, disabled, active]);

	return ref;
};
