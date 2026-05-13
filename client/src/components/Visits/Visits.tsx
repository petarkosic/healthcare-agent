import type { PatientFullResponse } from '../../types/types';
import { formatDateOnly } from '../../utils/utils';
import './Visits.css';

type VisitsProps = {
	data: PatientFullResponse;
};

export const Visits = ({ data }: VisitsProps) => {
	return (
		<div className='card card-visits full-width'>
			<h3>Visit History</h3>
			<div className='visits-timeline'>
				<table className='data-table'>
					<thead>
						<tr>
							<th>Date</th>
							<th>Type</th>
							<th>Doctor</th>
							<th>Chief Complaint</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{data.visits.map((visit) => (
							<tr key={visit.visit_id}>
								<td>{formatDateOnly(visit.visit_date)}</td>
								<td style={{ textTransform: 'capitalize' }}>
									{visit?.visit_type?.replace('_', ' ')}
								</td>
								<td>
									{visit.doctor_first_name} {visit.doctor_last_name}
								</td>
								<td>{visit.chief_complaint || '-'}</td>
								<td>
									<span className={`status-badge status-${visit.status}`}>
										{visit.status}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
