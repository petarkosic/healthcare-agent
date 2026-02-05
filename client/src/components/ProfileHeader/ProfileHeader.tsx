import type { PatientFullResponse } from '../../types/types';
import { calculateAge } from '../../utils/utils';
import './ProfileHeader.css';

type ProfileHeaderProps = {
	data: PatientFullResponse;
};

export const ProfileHeader = ({ data }: ProfileHeaderProps) => {
	return (
		<div className='profile-header'>
			<div className='header-identity'>
				<h1>
					{data.patient.first_name} {data.patient.last_name}
				</h1>
				<div className='meta-tags'>
					<span className='tag tag-serial'>
						ID: {data.patient.patient_serial_number}
					</span>
					<span className='tag tag-gender'>{data.patient.gender}</span>
					<span className='tag tag-blood'>{data.patient.blood_type}</span>
					<span className='tag tag-age'>
						{calculateAge(data.patient.date_of_birth)} Years Old
					</span>
				</div>
			</div>
			<div className='header-contact'>
				<div>
					<small>Phone</small>
					<div>{data.patient.phone || 'N/A'}</div>
				</div>
				<div>
					<small>Email</small>
					<div>{data.patient.email || 'N/A'}</div>
				</div>
				<div>
					<small>Emergency Contact</small>
					<div>
						{data.patient.emergency_contact_name}
						<br />({data.patient.emergency_contact_phone})
					</div>
				</div>
			</div>
		</div>
	);
};
