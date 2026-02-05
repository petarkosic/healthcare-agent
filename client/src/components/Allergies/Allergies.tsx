import type { PatientFullResponse } from '../../types/types';
import './Allergies.css';

type AllergiesProps = {
	data: PatientFullResponse;
};

export const Allergies = ({ data }: AllergiesProps) => {
	return (
		<div className='allergy-banner'>
			<span className='icon-alert'>⚠️</span>
			<div>
				<strong>Known Allergies:</strong> {data.patient.allergies.join(', ')}
			</div>
		</div>
	);
};
