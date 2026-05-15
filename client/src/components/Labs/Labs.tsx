import { useState } from 'react';
import { useParams } from 'react-router';
import type { PatientFullResponse } from '../../types/types';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/Auth/AuthProvider';
import { API_BASE } from '../../lib/api';
import './Labs.css';

type LabsProps = {
	data: PatientFullResponse;
	setError: React.Dispatch<React.SetStateAction<string | null>>;
	refetch: () => Promise<void>;
};

export const Labs = ({ data, setError, refetch }: LabsProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [form, setForm] = useState({
		test_name: '',
		result_value: '',
		unit: '',
		reference_range: '',
		result_status: 'pending',
		tested_date: '',
		received_date: '',
	});

	const { id: patient_serial } = useParams();
	const { session } = useSession();
	const { doctorSerialNumber } = useAuth();

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const resetForm = () => {
		setForm({
			test_name: '',
			result_value: '',
			unit: '',
			reference_range: '',
			result_status: 'pending',
			tested_date: '',
			received_date: '',
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch(
				`${API_BASE}/api/patients/${patient_serial}/labs`,
				{
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...form,
						visit_id: session!.visitId,
						ordering_doctors_serial_number: doctorSerialNumber,
						unit: form.unit || null,
					}),
				},
			);

			if (!response.ok) {
				throw new Error('Failed to add lab result');
			}

			await refetch();
			resetForm();
			setIsModalOpen(false);
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className='card card-labs'>
				<div className='card-header-row'>
					<h3>Lab Results</h3>
					{doctorSerialNumber && (
						<span
							className={!session ? 'btn-tooltip-wrap' : undefined}
							data-tooltip={!session ? 'Start a session to add lab results' : undefined}
						>
							<button
								className='btn-primary'
								onClick={() => setIsModalOpen(true)}
								disabled={!session}
							>
								Add Lab Result
							</button>
						</span>
					)}
				</div>
				<table className='mini-table'>
					<thead>
						<tr>
							<th>Test</th>
							<th>Result</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{data?.lab_results?.slice(0, 4).map((lab) => (
							<tr key={lab.lab_id}>
								<td>{lab.test_name}</td>
								<td>
									{lab.result_value} {lab.unit}
								</td>
								<td>
									<span className={`status-badge status-${lab.result_status}`}>
										{lab.result_status}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{isModalOpen && (
				<div
					className='modal-overlay'
					onClick={isSubmitting ? undefined : () => setIsModalOpen(false)}
				>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>Add Lab Result</h2>
							<button
								className='modal-close'
								onClick={isSubmitting ? undefined : () => setIsModalOpen(false)}
								disabled={isSubmitting}
							>
								&times;
							</button>
						</div>
						<form onSubmit={handleSubmit}>
							<div className='form-group'>
								<label>Test Name</label>
								<input
									name='test_name'
									value={form.test_name}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Result Value</label>
								<input
									name='result_value'
									value={form.result_value}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Unit (optional)</label>
								<input
									name='unit'
									value={form.unit}
									onChange={handleChange}
									placeholder='e.g. mg/dL'
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Reference Range</label>
								<input
									name='reference_range'
									value={form.reference_range}
									onChange={handleChange}
									placeholder='e.g. 70-100'
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Status</label>
								<select
									name='result_status'
									value={form.result_status}
									onChange={handleChange}
									disabled={isSubmitting}
								>
									<option value='pending'>Pending</option>
									<option value='normal'>Normal</option>
									<option value='abnormal'>Abnormal</option>
									<option value='critical'>Critical</option>
								</select>
							</div>
							<div className='form-group'>
								<label>Test Date &amp; Time</label>
								<input
									type='datetime-local'
									name='tested_date'
									value={form.tested_date}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Received Date &amp; Time</label>
								<input
									type='datetime-local'
									name='received_date'
									value={form.received_date}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='modal-actions'>
								<button
									type='button'
									className='btn-secondary'
									onClick={
										isSubmitting ? undefined : () => setIsModalOpen(false)
									}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type='submit'
									className='btn-primary'
									disabled={isSubmitting}
								>
									{isSubmitting ? 'Saving...' : 'Save Lab Result'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};
