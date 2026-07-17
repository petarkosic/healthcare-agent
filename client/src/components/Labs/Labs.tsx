import { useState } from 'react';
import { useParams } from 'react-router';
import { useAppSelector } from '../../store/hooks';
import {
	useGetPatientQuery,
	useAddLabMutation,
} from '../../store/api/patientsApi';
import type { PatientFullResponse } from '../../types/types';
import type { ResultStatus } from '../../types/enums';
import { formatDate } from '../../utils/utils';
import './Labs.css';

type LabRow = PatientFullResponse['lab_results'][number];

export const Labs = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedLab, setSelectedLab] = useState<LabRow | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);
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
	const session = useAppSelector((state) => state.session.session);
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);

	const { data } = useGetPatientQuery(patient_serial!);
	const [addLab, { isLoading: isSubmitting }] = useAddLabMutation();

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

		setLocalError(null);

		try {
			await addLab({
				patientId: patient_serial!,
				body: {
					...form,
					result_status: form.result_status as ResultStatus,
					visit_id: session!.visitId as string,
					unit: form.unit || null,
					tested_date: new Date(form.tested_date).toISOString(),
					received_date: new Date(form.received_date).toISOString(),
				},
			}).unwrap();

			resetForm();
			setIsModalOpen(false);
		} catch {
			setLocalError('Failed to add lab result');
		}
	};

	if (!data) return null;

	return (
		<>
			{localError && <div className='error'>{localError}</div>}
			<div className='card card-labs'>
				<div className='card-header-row'>
					<h3>Lab Results</h3>
					{doctorSerialNumber && (
						<span
							className={!session ? 'btn-tooltip-wrap' : undefined}
							data-tooltip={
								!session ? 'Start a session to add lab results' : undefined
							}
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
				{data.lab_results?.length > 0 ? (
					<table className='mini-table'>
						<thead>
							<tr>
								<th>Test</th>
								<th>Result</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{data.lab_results.slice(0, 4).map((lab) => (
								<tr
									key={lab.lab_id}
									className='lab-row-clickable'
									onClick={() => setSelectedLab(lab)}
								>
									<td>{lab.test_name}</td>
									<td>
										{lab.result_value} {lab.unit}
									</td>
									<td>
										<span
											className={`status-badge status-${lab.result_status}`}
										>
											{lab.result_status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p className='empty-text'>No lab results recorded.</p>
				)}
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

			{selectedLab && (
				<div className='modal-overlay' onClick={() => setSelectedLab(null)}>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>{selectedLab.test_name}</h2>
							<button
								className='modal-close'
								onClick={() => setSelectedLab(null)}
							>
								&times;
							</button>
						</div>
						<div className='modal-body lab-readonly'>
							<div className='lab-readonly-row'>
								<span className='lab-readonly-label'>Result</span>
								<span>
									{selectedLab.result_value} {selectedLab.unit}
								</span>
							</div>
							<div className='lab-readonly-row'>
								<span className='lab-readonly-label'>Reference Range</span>
								<span>{selectedLab.reference_range}</span>
							</div>
							<div className='lab-readonly-row'>
								<span className='lab-readonly-label'>Status</span>
								<span
									className={`status-badge status-${selectedLab.result_status}`}
								>
									{selectedLab.result_status}
								</span>
							</div>
							<div className='lab-readonly-row'>
								<span className='lab-readonly-label'>Tested</span>
								<span>{formatDate(selectedLab.tested_date)}</span>
							</div>
							<div className='lab-readonly-row'>
								<span className='lab-readonly-label'>Received</span>
								<span>{formatDate(selectedLab.received_date)}</span>
							</div>
							<div className='lab-readonly-row'>
								<span className='lab-readonly-label'>Ordering Doctor</span>
								<span>
									Dr. {selectedLab.ordering_doctor_first_name}{' '}
									{selectedLab.ordering_doctor_last_name}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
