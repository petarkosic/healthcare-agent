import type { VitalSigns } from '../../types/types';
import './Vitals.css';

type VitalsProps = {
	latestVitals: VitalSigns | null;
};

export const Vitals = ({ latestVitals }: VitalsProps) => {
	return (
		<div className='card card-vitals'>
			<h3>Latest Vitals</h3>
			{latestVitals ? (
				<div className='vitals-grid'>
					<div className='vital-box'>
						<span className='label'>BP</span>
						<span className='value'>
							{latestVitals.blood_pressure_systolic}/
							{latestVitals.blood_pressure_diastolic}
						</span>
					</div>
					<div className='vital-box'>
						<span className='label'>HR</span>
						<span className='value'>
							{latestVitals.heart_rate} <small>bpm</small>
						</span>
					</div>
					<div className='vital-box'>
						<span className='label'>Temp</span>
						<span className='value'>
							{latestVitals.temperature} <small>°C</small>
						</span>
					</div>
					<div className='vital-box'>
						<span className='label'>BMI</span>
						<span className='value'>
							{latestVitals.bmi ? latestVitals.bmi.toFixed(1) : 'N/A'}
						</span>
					</div>
					<div className='vital-box'>
						<span className='label'>Weight</span>
						<span className='value'>
							{latestVitals.weight_kg} <small>kg</small>
						</span>
					</div>
				</div>
			) : (
				<p className='empty-text'>No vitals recorded.</p>
			)}
		</div>
	);
};
