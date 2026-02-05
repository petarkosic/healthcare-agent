import type { Diagnosis, PatientFullResponse } from '../../types/types';
import { formatDate } from '../../utils/utils';
import './Diagnoses.css';

type DiagnosesProps = {
	data: PatientFullResponse;
};

export const Diagnoses = ({ data }: DiagnosesProps) => {
	return (
		<div className='card card-diagnoses'>
			<h3>Diagnoses History</h3>
			<ul className='diagnoses-list'>
				{data.diagnoses.map((diag: Diagnosis) => (
					<li key={diag.diagnosis_id}>
						<div className='diag-header'>
							<strong>{diag.diagnosis_name}</strong>{' '}
							<span className='tag diag-code'>
								{diag.diagnosis_code || 'N/A'}
							</span>
						</div>
						<div className='diag-meta'>
							<span className={`status-badge status-${diag.status}`}>
								{diag.status}
							</span>
							<span>{formatDate(diag.diagnosed_date)}</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};
