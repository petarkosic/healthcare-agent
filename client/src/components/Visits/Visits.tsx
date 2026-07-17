import { useState } from 'react';
import type { Visit } from '../../types/types';
import { formatDateOnly } from '../../utils/utils';
import { useParams } from 'react-router';
import { useGetPatientQuery } from '../../store/api/patientsApi';
import { VisitModal } from '../VisitModal/VisitModal';
import { apiFetch, API_BASE } from '../../lib/api';
import './Visits.css';

export const Visits = () => {
	const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
	const [printingVisitId, setPrintingVisitId] = useState<string | null>(null);

	const { id: patient_serial } = useParams();
	const { data } = useGetPatientQuery(patient_serial!);

	if (!data) return null;

	const handlePrintReport = async (e: React.MouseEvent, visit: Visit) => {
		e.stopPropagation();

		if (printingVisitId) return;

		setPrintingVisitId(visit.visit_id);

		try {
			const response = await apiFetch(
				`${API_BASE}/api/patients/${visit.patient_serial_number}/visits/${visit.visit_id}/report`,
			);

			if (!response.ok) throw new Error();

			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			iframe.src = blobUrl;
			iframe.onload = () => {
				const win = iframe.contentWindow!;
				const originalTitle = document.title;
				const visitDate = new Date(visit.visit_date).toISOString().slice(0, 10);
				document.title = `${data.patient.first_name} ${data.patient.last_name} - Visit Report ${visitDate}`;

				win.print();

				// reset button once dialog is open; keep iframe alive for browser to render
				setTimeout(() => {
					document.title = originalTitle;

					setPrintingVisitId(null);
				}, 1000);

				setTimeout(() => {
					URL.revokeObjectURL(blobUrl);

					if (document.body.contains(iframe)) document.body.removeChild(iframe);
				}, 60_000);
			};

			document.body.appendChild(iframe);
		} catch {
			setPrintingVisitId(null);
		}
	};

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
								<th>Print Report</th>
							</tr>
						</thead>
						<tbody>
							{data.visits.map((visit) => (
								<tr
									key={visit.visit_id}
									className='visit-row-clickable'
									onClick={() => setSelectedVisit(visit)}
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
									<td
										style={{ width: '1%', whiteSpace: 'nowrap' }}
										className='print-report-tooltip'
										data-tooltip={
											visit.status === 'in-progress'
												? 'Visit is still in progress'
												: undefined
										}
									>
										<button
											className='btn-print-report'
											onClick={(e) => handlePrintReport(e, visit)}
											disabled={
												printingVisitId === visit.visit_id ||
												visit.status === 'in-progress'
											}
										>
											{printingVisitId === visit.visit_id ? '...' : 'Print'}
										</button>
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
				/>
			)}
		</>
	);
};
