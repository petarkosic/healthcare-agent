import { useEffect, useLayoutEffect, useRef } from 'react';

type ShortcutHandler = (e: KeyboardEvent) => void;

export function useKeyboardShortcuts(
	shortcuts: Record<string, ShortcutHandler>,
) {
	const shortcutsRef = useRef(shortcuts);

	useLayoutEffect(() => {
		shortcutsRef.current = shortcuts;
	}, [shortcuts]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			const target = e.target as HTMLElement;
			const tag = target.tagName;

			if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
			if (target.isContentEditable) return;

			shortcutsRef.current[e.key]?.(e);
		};

		document.addEventListener('keydown', handler);

		return () => document.removeEventListener('keydown', handler);
	}, []);
}
