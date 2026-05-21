import { useState } from 'react';
import type { PatientFullResponse, Visit } from '../../types/types';
import { formatDateOnly } from '../../utils/utils';
import { useAuth } from '../../context/Auth/AuthProvider';
import { VisitModal } from '../VisitModal/VisitModal';
import './Visits.css';

type VisitsProps = {
	data: PatientFullResponse;
	refetch: () => void;
};

export const Visits = ({ data, refetch }: VisitsProps) => {
	const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
	const { doctorSerialNumber } = useAuth();

	return (
		<>
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
								<tr
									key={visit.visit_id}
									onClick={() => setSelectedVisit(visit)}
									style={{ cursor: 'pointer' }}
								>
									<td>{formatDateOnly(visit.visit_date)}</td>
									<td style={{ textTransform: 'capitalize' }}>
										{visit?.visit_type?.replace(/_/g, ' ')}
									</td>
									<td>
										{visit.doctor_first_name} {visit.doctor_last_name}
									</td>
									<td
										data-tooltip={visit.chief_complaint || undefined}
										className='chief-complaint-tooltip'
									>
										{visit.chief_complaint
											? visit.chief_complaint.length > 60
												? visit.chief_complaint.slice(0, 60) + '…'
												: visit.chief_complaint
											: '-'}
									</td>
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

			{selectedVisit && (
				<VisitModal
					visit={selectedVisit}
					onClose={() => setSelectedVisit(null)}
					onRefetch={refetch}
					doctorSerialNumber={doctorSerialNumber}
				/>
			)}
		</>
	);
};
