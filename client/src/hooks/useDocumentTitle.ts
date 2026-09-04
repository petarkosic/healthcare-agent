import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
	useEffect(() => {
		const prev = document.title;

		document.title = `MediFlow — ${title}`;

		return () => {
			document.title = prev;
		};
	}, [title]);
}
