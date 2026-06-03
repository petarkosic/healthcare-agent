import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { API_BASE, apiFetch } from '../../lib/api';

const baseQuery: BaseQueryFn<
	{ url: string; method?: string; body?: unknown },
	unknown,
	{ status: number; data: unknown }
> = async ({ url, method = 'GET', body }) => {
	try {
		const response = await apiFetch(`${API_BASE}${url}`, {
			method,
			body: body !== undefined ? JSON.stringify(body) : undefined,
		});

		const data = await response.json();

		if (!response.ok) return { error: { status: response.status, data } };

		return { data };
	} catch (err) {
		return { error: { status: 0, data: String(err) } };
	}
};

export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery,
	tagTypes: ['Patient', 'PatientList'],
	endpoints: () => ({}),
});
