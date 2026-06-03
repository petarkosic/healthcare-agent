import { baseApi } from './baseApi';

interface SignupBody {
	first_name: string;
	last_name: string;
	email: string;
	specialty: string;
	license_number: string;
	password: string;
}

interface SignupResponse {
	doctor_serial_number: string;
}

interface LoginBody {
	serial_number: string;
	password: string;
}

interface LoginResponse {
	doctor_serial_number: string;
	doctor_name: string;
}

export const authApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		signup: builder.mutation<SignupResponse, SignupBody>({
			query: (body) => ({ url: '/api/auth/signup', method: 'POST', body }),
		}),

		loginDoctor: builder.mutation<LoginResponse, LoginBody>({
			query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
		}),
	}),
});

export const { useSignupMutation, useLoginDoctorMutation } = authApi;
