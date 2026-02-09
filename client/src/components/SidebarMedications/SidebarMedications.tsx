import type {
	MedicationChange,
	MedicationsResponse,
	ResponseData,
} from '../../types/types';
import './SidebarMedications.css';

type SidebarMedicationsProps = {
	data: ResponseData | null;
};

const isMedicationsResponse = (
	data: ResponseData,
): data is MedicationsResponse => {
	return 'medications' in data && 'current_medications' in data.medications;
};

export const SidebarMedications = ({ data }: SidebarMedicationsProps) => {
	if (!data || !isMedicationsResponse(data)) return null;

	const { current_medications, prescribed_changes } = data.medications;

	return (
		<div className='medications-container'>
			{current_medications?.length > 0 && (
				<div className='current-medications'>
					<h4>Current Medications</h4>
					{current_medications?.map(
						(
							med: MedicationsResponse['medications']['current_medications'][number],
							index: number,
						) => (
							<div className='medication-item' key={index}>
								<span className='name'>{med.name}</span>
								<span className='dosage'>{med.dosage}</span>
								<span className='frequency'>{med.frequency}</span>
							</div>
						),
					)}
				</div>
			)}

			{prescribed_changes?.length > 0 && (
				<div className='prescribed-changes'>
					<h4>Suggested Changes</h4>
					{prescribed_changes.map((change: MedicationChange, index: number) => (
						<div className={`change-item change-${change.action}`} key={index}>
							<div className='change-header'>
								<span className='change-action'>{change.action}</span>
								<span className='change-name'>{change.name}</span>
							</div>
							<div className='change-details'>
								{change.dosage && <span>Dosage: {change.dosage}</span>}
								{change.frequency && <span>Frequency: {change.frequency}</span>}
							</div>
							<div className='change-reason'>Reason: {change.reason}</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
