import { useState, useEffect } from 'react';
import './PatientProfile.css';
import { useParams } from 'react-router';
import type { PatientFullResponse } from '../../types/types';
import { ProfileHeader } from '../ProfileHeader/ProfileHeader';
import { Allergies } from '../Allergies/Allergies';
import { Vitals } from '../Vitals/Vitals';
import { Medications } from '../Medications/Medications';
import { Notes } from '../Notes/Notes';
import { Labs } from '../Labs/Labs';
import { Diagnoses } from '../Diagnoses/Diagnoses';
import { Visits } from '../Visits/Visits';
import { Sidebar } from '../Sidebar/Sidebar';

function PatientProfile() {
	const [data, setData] = useState<PatientFullResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

	const [error, setError] = useState<string | null>('');

	const { id: patient_serial } = useParams();

	const latestVitals = data?.vital_signs.length ? data.vital_signs[0] : null;

	useEffect(() => {
		const fetchPatient = async () => {
			try {
				const response = await fetch(
					`http://localhost:8000/api/patients/${patient_serial}`,
				);

				if (!response.ok) {
					const errorData = await response.json();

					throw new Error(
						errorData.detail || `HTTP error! status: ${response.status}`,
					);
				}

				const result = await response.json();

				setData(result);
			} catch (error) {
				const err = error as Error;

				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchPatient();
	}, [patient_serial]);

	if (loading)
		return <div className='loading-state'>Loading Patient Profile...</div>;

	if (error) return <div className='error-state'>{error}</div>;

	if (!data) return <div className='error-state'>Patient not found.</div>;

	return (
		<div className={`app-wrapper ${isAiSidebarOpen ? 'sidebar-open' : ''}`}>
			<div className='profile-container'>
				{!isAiSidebarOpen && (
					<button
						className='ai-toggle-btn'
						onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
						title={'Open AI Assistant'}
					>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
						</svg>
						<span>AI Assistant</span>
					</button>
				)}

				<ProfileHeader data={data} />

				{data.patient.allergies && data.patient.allergies.length > 0 && (
					<Allergies data={data} />
				)}

				<div className='profile-grid'>
					<Vitals latestVitals={latestVitals} />

					<Medications data={data} />

					<Notes data={data} setError={setError} setData={setData} />

					<Labs data={data} />

					<Diagnoses data={data} />

					<Visits data={data} />
				</div>
			</div>

			<Sidebar
				isAiSidebarOpen={isAiSidebarOpen}
				setIsAiSidebarOpen={setIsAiSidebarOpen}
				setError={setError}
			/>
		</div>
	);
}

export default PatientProfile;
