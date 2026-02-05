import type { PatientFullResponse } from '../../types/types';
import './Medications.css';

type MedicationsProps = {
	data: PatientFullResponse;
};

export const Medications = ({ data }: MedicationsProps) => {
	return (
		<div className='card card-meds'>
			<h3>Active Medications</h3>
			<div className='meds-list'>
				{data.medications
					.filter((m) => m.status === 'active')
					.map((med) => (
						<div key={med.medication_id} className='med-item'>
							<div className='med-main'>
								<strong>{med.medication_name}</strong>{' '}
								{med.generic_name && (
									<span className='generic'>({med.generic_name})</span>
								)}
							</div>
							<div className='med-dosage'>
								{med.dosage} • {med.frequency}
							</div>
						</div>
					))}
			</div>
		</div>
	);
};
