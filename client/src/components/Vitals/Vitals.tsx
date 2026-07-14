import { useState } from 'react';
import { useParams } from 'react-router';
import { useAppSelector } from '../../store/hooks';
import {
	useGetPatientQuery,
	useAddVitalMutation,
} from '../../store/api/patientsApi';
import './Vitals.css';

export const Vitals = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);
	const [form, setForm] = useState({
		blood_pressure_systolic: '',
		blood_pressure_diastolic: '',
		heart_rate: '',
		temperature: '',
		respiratory_rate: '',
		oxygen_saturation: '',
		weight_kg: '',
		height_cm: '',
		pain_level: '0',
		notes: '',
	});

	const { id: patient_serial } = useParams();
	const session = useAppSelector((state) => state.session.session);
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);

	const { data } = useGetPatientQuery(patient_serial!);
	const [addVital, { isLoading: isSubmitting }] = useAddVitalMutation();

	const latestVitals = data?.vital_signs.length ? data.vital_signs[0] : null;

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const resetForm = () => {
		setForm({
			blood_pressure_systolic: '',
			blood_pressure_diastolic: '',
			heart_rate: '',
			temperature: '',
			respiratory_rate: '',
			oxygen_saturation: '',
			weight_kg: '',
			height_cm: '',
			pain_level: '0',
			notes: '',
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setLocalError(null);

		const toNumber = (v: string) => (v !== '' ? Number(v) : undefined);

		try {
			await addVital({
				patientId: patient_serial!,
				body: {
					visit_id: session!.visitId as string,
					blood_pressure_systolic: toNumber(form.blood_pressure_systolic),
					blood_pressure_diastolic: toNumber(form.blood_pressure_diastolic),
					heart_rate: toNumber(form.heart_rate),
					temperature: toNumber(form.temperature),
					respiratory_rate: toNumber(form.respiratory_rate),
					oxygen_saturation: toNumber(form.oxygen_saturation),
					weight_kg: toNumber(form.weight_kg),
					height_cm: toNumber(form.height_cm),
					pain_level: toNumber(form.pain_level),
					notes: form.notes,
				},
			}).unwrap();

			resetForm();

			setIsModalOpen(false);
		} catch {
			setLocalError('Failed to add vitals');
		}
	};

	if (!data) return null;

	return (
		<>
			{localError && <div className='error'>{localError}</div>}
			<div className='card card-vitals'>
				<div className='card-header-row'>
					<h3>Latest Vitals</h3>
					{doctorSerialNumber && (
						<span
							className={!session ? 'btn-tooltip-wrap' : undefined}
							data-tooltip={
								!session ? 'Start a session to add vitals' : undefined
							}
						>
							<button
								className='btn-primary'
								onClick={() => setIsModalOpen(true)}
								disabled={!session}
							>
								Add Vitals
							</button>
						</span>
					)}
				</div>
				{latestVitals ? (
					<div className='vitals-grid'>
						<div className='vital-box'>
							<span className='label' data-tooltip='Blood Pressure'>
								BP
							</span>
							<span className='value'>
								{latestVitals.blood_pressure_systolic}/
								{latestVitals.blood_pressure_diastolic}
							</span>
						</div>
						<div className='vital-box'>
							<span className='label' data-tooltip='Heart Rate'>
								HR
							</span>
							<span className='value'>
								{latestVitals.heart_rate} <small>bpm</small>
							</span>
						</div>
						<div className='vital-box'>
							<span className='label' data-tooltip='Temperature'>
								Temp
							</span>
							<span className='value'>
								{latestVitals.temperature} <small>°C</small>
							</span>
						</div>
						<div className='vital-box'>
							<span className='label' data-tooltip='Body Mass Index'>
								BMI
							</span>
							<span className='value'>
								{latestVitals.bmi ? latestVitals.bmi.toFixed(1) : 'N/A'}
							</span>
						</div>
						<div className='vital-box'>
							<span className='label' data-tooltip='Respiratory Rate'>
								RR
							</span>
							<span className='value'>
								{latestVitals.respiratory_rate} <small>bpm</small>
							</span>
						</div>
						<div className='vital-box'>
							<span className='label' data-tooltip='Oxygen Saturation'>
								SpO2
							</span>
							<span className='value'>
								{latestVitals.oxygen_saturation} <small>%</small>
							</span>
						</div>
						<div className='vital-box'>
							<span className='label' data-tooltip='Weight/Height'>
								Weight/Height
							</span>
							<span className='value'>
								{latestVitals.weight_kg} <small>kg</small>
								<small>/</small>
								{latestVitals.height_cm} <small>cm</small>
							</span>
						</div>
						<div className='vital-box'>
							<span className='label' data-tooltip='Pain Level'>
								Pain Level
							</span>
							<span className='value'>{latestVitals.pain_level}</span>
						</div>
					</div>
				) : (
					<p className='empty-text'>No vitals recorded.</p>
				)}
			</div>

			{isModalOpen && (
				<div
					className='modal-overlay'
					onClick={isSubmitting ? undefined : () => setIsModalOpen(false)}
				>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>Add Vitals</h2>
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
								<label>Systolic BP (mmHg)</label>
								<input
									type='number'
									name='blood_pressure_systolic'
									value={form.blood_pressure_systolic}
									onChange={handleChange}
									min={50}
									max={250}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Diastolic BP (mmHg)</label>
								<input
									type='number'
									name='blood_pressure_diastolic'
									value={form.blood_pressure_diastolic}
									onChange={handleChange}
									min={30}
									max={200}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Heart Rate (bpm)</label>
								<input
									type='number'
									name='heart_rate'
									value={form.heart_rate}
									onChange={handleChange}
									min={30}
									max={250}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Temperature (°C)</label>
								<input
									type='number'
									step='0.1'
									name='temperature'
									value={form.temperature}
									onChange={handleChange}
									min={30}
									max={45}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Respiratory Rate</label>
								<input
									type='number'
									name='respiratory_rate'
									value={form.respiratory_rate}
									onChange={handleChange}
									min={5}
									max={60}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Oxygen Saturation (%)</label>
								<input
									type='number'
									step='0.1'
									name='oxygen_saturation'
									value={form.oxygen_saturation}
									onChange={handleChange}
									min={70}
									max={100}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Weight (kg)</label>
								<input
									type='number'
									step='0.1'
									name='weight_kg'
									value={form.weight_kg}
									onChange={handleChange}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Height (cm)</label>
								<input
									type='number'
									step='0.1'
									name='height_cm'
									value={form.height_cm}
									onChange={handleChange}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Pain Level (0–10)</label>
								<input
									type='number'
									name='pain_level'
									value={form.pain_level}
									onChange={handleChange}
									min={0}
									max={10}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Notes (optional)</label>
								<textarea
									name='notes'
									value={form.notes}
									onChange={handleChange}
									rows={2}
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
									{isSubmitting ? 'Saving...' : 'Save Vitals'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};
