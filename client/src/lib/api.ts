export const API_BASE = import.meta.env.VITE_API_URL ?? '';

function getCsrfToken(): string | null {
	const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);

	return match ? decodeURIComponent(match[1]) : null;
}

export function apiFetch(
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set(
		'Content-Type',
		headers.get('Content-Type') ?? 'application/json',
	);

	const token = getCsrfToken();
	if (token) headers.set('X-CSRF-Token', token);

	return fetch(url, { ...init, credentials: 'include', headers });
}
