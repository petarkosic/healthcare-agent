import type { PatientFullResponse } from '../../types/types';
import './Labs.css';

type LabsProps = {
	data: PatientFullResponse;
};

export const Labs = ({ data }: LabsProps) => {
	return (
		<div className='card card-labs'>
			<div className='card-header-row'>
				<h3>Lab Results</h3>
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
	);
};
