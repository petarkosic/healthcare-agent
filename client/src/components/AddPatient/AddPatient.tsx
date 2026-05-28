import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/Auth/AuthProvider';
import { useSession } from '../../context/SessionContext';
import { API_BASE, apiFetch } from '../../lib/api';
import './AddPatient.css';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const AddPatient = () => {
	const [form, setForm] = useState({
		first_name: '',
		last_name: '',
		date_of_birth: '',
		gender: '',
		blood_type: '',
		known_allergies: '',
		email: '',
		phone: '',
		street_number: '',
		street: '',
		city: '',
		country: '',
		emergency_contact_name: '',
		emergency_contact_phone: '',
	});
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { doctorSerialNumber } = useAuth();
	const { startSession } = useSession();
	const navigate = useNavigate();

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

		if (error) setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);

		const allergies = form.known_allergies
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		try {
			const response = await apiFetch(`${API_BASE}/api/patients`, {
				method: 'POST',
				body: JSON.stringify({
					doctor_serial_number: doctorSerialNumber,
					first_name: form.first_name,
					last_name: form.last_name,
					date_of_birth: form.date_of_birth,
					gender: form.gender,
					blood_type: form.blood_type,
					email: form.email,
					phone: form.phone,
					address: `${form.street_number} ${form.street}, ${form.city}, ${form.country}`,
					emergency_contact_name: form.emergency_contact_name,
					emergency_contact_phone: form.emergency_contact_phone,
					allergies,
					chronic_conditions: [],
				}),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.detail ?? `Request failed: ${response.status}`);
			}

			const data = await response.json();

			startSession('checkup', 'Clinic', data.visit_id, String(data.patient_serial_number));
			navigate(`/patients/${data.patient_serial_number}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to add patient');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className='add-patient-page'>
			<div className='add-patient-header'>
				<Link to='/patients' className='back-link'>
					← Back to Patients
				</Link>
				<h2>Add New Patient</h2>
			</div>

			<form className='add-patient-form' onSubmit={handleSubmit}>
				<fieldset className='form-section'>
					<legend>Personal Information</legend>
					<div className='form-row'>
						<div className='form-field'>
							<label htmlFor='first_name'>First Name</label>
							<input
								id='first_name'
								name='first_name'
								type='text'
								value={form.first_name}
								onChange={handleChange}
								required
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='last_name'>Last Name</label>
							<input
								id='last_name'
								name='last_name'
								type='text'
								value={form.last_name}
								onChange={handleChange}
								required
							/>
						</div>
					</div>
					<div className='form-row'>
						<div className='form-field'>
							<label htmlFor='date_of_birth'>Date of Birth</label>
							<input
								id='date_of_birth'
								name='date_of_birth'
								type='date'
								value={form.date_of_birth}
								onChange={handleChange}
								required
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='gender'>Gender</label>
							<select
								id='gender'
								name='gender'
								value={form.gender}
								onChange={handleChange}
								required
							>
								<option value=''>Select gender</option>
								<option value='Male'>Male</option>
								<option value='Female'>Female</option>
							</select>
						</div>
					</div>
					<div className='form-row'>
						<div className='form-field'>
							<label htmlFor='blood_type'>Blood Type</label>
							<select
								id='blood_type'
								name='blood_type'
								value={form.blood_type}
								onChange={handleChange}
								required
							>
								<option value=''>Select blood type</option>
								{BLOOD_TYPES.map((bt) => (
									<option key={bt} value={bt}>
										{bt}
									</option>
								))}
							</select>
						</div>
						<div className='form-field'>
							<label htmlFor='known_allergies'>Known Allergies</label>
							<input
								id='known_allergies'
								name='known_allergies'
								type='text'
								value={form.known_allergies}
								onChange={handleChange}
							/>
						</div>
					</div>
				</fieldset>

				<fieldset className='form-section'>
					<legend>Address</legend>
					<div className='form-row'>
						<div className='form-field'>
							<label htmlFor='street_number'>Street Number</label>
							<input
								id='street_number'
								name='street_number'
								type='text'
								value={form.street_number}
								onChange={handleChange}
								required
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='street'>Street</label>
							<input
								id='street'
								name='street'
								type='text'
								value={form.street}
								onChange={handleChange}
								required
							/>
						</div>
					</div>
					<div className='form-row'>
						<div className='form-field'>
							<label htmlFor='city'>City</label>
							<input
								id='city'
								name='city'
								type='text'
								value={form.city}
								onChange={handleChange}
								required
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='country'>Country</label>
							<input
								id='country'
								name='country'
								type='text'
								value={form.country}
								onChange={handleChange}
								required
							/>
						</div>
					</div>
				</fieldset>

				<fieldset className='form-section'>
					<legend>Contact Information</legend>
					<div className='form-row'>
						<div className='form-field'>
							<label htmlFor='email'>Email</label>
							<input
								id='email'
								name='email'
								type='email'
								value={form.email}
								onChange={handleChange}
								required
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='phone'>Phone</label>
							<input
								id='phone'
								name='phone'
								type='tel'
								value={form.phone}
								onChange={handleChange}
								required
							/>
						</div>
					</div>
				</fieldset>

				<fieldset className='form-section'>
					<legend>Emergency Contact</legend>
					<div className='form-row'>
						<div className='form-field'>
							<label htmlFor='emergency_contact_name'>Name</label>
							<input
								id='emergency_contact_name'
								name='emergency_contact_name'
								type='text'
								value={form.emergency_contact_name}
								onChange={handleChange}
							/>
						</div>
						<div className='form-field'>
							<label htmlFor='emergency_contact_phone'>Phone</label>
							<input
								id='emergency_contact_phone'
								name='emergency_contact_phone'
								type='tel'
								value={form.emergency_contact_phone}
								onChange={handleChange}
							/>
						</div>
					</div>
				</fieldset>

				{error && <div className='form-error'>{error}</div>}

				<div className='form-actions'>
					<Link to='/patients' className='ap-btn-secondary'>
						Cancel
					</Link>
					<button
						type='submit'
						className='ap-btn-primary'
						disabled={submitting}
					>
						{submitting ? 'Adding...' : 'Add Patient'}
					</button>
				</div>
			</form>
		</div>
	);
};
