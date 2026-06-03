import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import './Sidebar.css';
import { SidebarRecommendations } from '../SidebarRecommendations/SidebarRecommendations';
import { SidebarMedications } from '../SidebarMedications/SidebarMedications';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useGetPatientQuery } from '../../store/api/patientsApi';
import {
	fetchAiOverview,
	fetchAiRecommendations,
	fetchAiMedications,
} from '../../store/aiSlice';

type SidebarProps = {
	isAiSidebarOpen: boolean;
	setIsAiSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export const Sidebar = ({
	isAiSidebarOpen,
	setIsAiSidebarOpen,
	setError,
}: SidebarProps) => {
	const [activeView, setActiveView] = useState<
		'recommendations' | 'medications' | null
	>(null);

	const { id: patient_serial } = useParams();
	const dispatch = useAppDispatch();
	const { data: patientData } = useGetPatientQuery(patient_serial!);

	const aiCache = useAppSelector(
		(state) => state.ai.byPatient[patient_serial!],
	);
	const overview = aiCache?.overview ?? null;
	const overviewLoading = aiCache?.overviewStatus === 'loading';
	const recommendations = aiCache?.recommendations ?? null;
	const medications = aiCache?.medications ?? null;
	const actionLoading =
		aiCache?.recommendationsStatus === 'loading' ||
		aiCache?.medicationsStatus === 'loading';

	useEffect(() => {
		if (!isAiSidebarOpen) return;

		dispatch(fetchAiOverview(patient_serial!)).then((result) => {
			if (fetchAiOverview.rejected.match(result) && !result.meta.condition) {
				setError(result.error.message ?? 'Failed to get AI overview');
			}
		});
	}, [isAiSidebarOpen, patient_serial]);

	const handleBack = () => {
		setActiveView(null);
	};

	const handleQuickAction = async (
		action: 'recommendations' | 'medications',
	) => {
		if (actionLoading || !overview) return;

		setActiveView(action);
		setError(null);

		const overviewText = overview.ai_overview.overview;

		if (action === 'recommendations') {
			const result = await dispatch(
				fetchAiRecommendations({
					patientSerial: patient_serial!,
					overviewText,
				}),
			);

			if (
				fetchAiRecommendations.rejected.match(result) &&
				!result.meta.condition
			) {
				setError(result.error.message ?? 'Failed to get recommendations');
				setActiveView(null);
			}
		} else {
			const currentMedications = (patientData?.medications ?? [])
				.filter((m) => m.status === 'active')
				.map((m) => ({
					name: m.medication_name,
					dosage: m.dosage,
					frequency: m.frequency,
					reason: m.prescribed_for,
				}));

			const result = await dispatch(
				fetchAiMedications({
					patientSerial: patient_serial!,
					overviewText,
					currentMedications,
				}),
			);

			if (fetchAiMedications.rejected.match(result) && !result.meta.condition) {
				setError(result.error.message ?? 'Failed to get medications');
				setActiveView(null);
			}
		}
	};

	const activeData =
		activeView === 'recommendations'
			? recommendations
			: activeView === 'medications'
				? medications
				: null;

	return (
		<div className={`ai-sidebar ${isAiSidebarOpen ? 'open' : ''}`}>
			<div className='ai-header'>
				{activeView && (
					<button
						className='ai-back-btn'
						onClick={handleBack}
						disabled={actionLoading}
					>
						&#8592; Overview
					</button>
				)}
				<button
					className='ai-close-btn'
					onClick={() => setIsAiSidebarOpen(false)}
					disabled={actionLoading}
				>
					&times;
				</button>
			</div>
			<div className='ai-body'>
				{overviewLoading && (
					<div className='ai-loading'>
						<span className='ai-spinner' />
						<p>Analyzing patient data...</p>
					</div>
				)}

				{activeView && !activeData && !overviewLoading && (
					<div className='ai-loading'>
						<span className='ai-spinner' />
						<p>Getting {activeView}...</p>
					</div>
				)}

				{!activeView && !overviewLoading && overview?.ai_overview && (
					<div className='ai-placeholder-content'>
						<div className='ai-message ai-ai'>
							<p>{overview.ai_overview.overview}</p>
						</div>
						<div>
							{overview.ai_overview.suggested_questions?.map(
								(question: string, index: number) => (
									<p className='ai-message' key={index}>
										{question}
									</p>
								),
							)}
						</div>
					</div>
				)}

				{!activeView && !overviewLoading && !overview?.ai_overview && (
					<div className='ai-message'>
						<p>No overview available.</p>
					</div>
				)}

				{activeView === 'recommendations' && (
					<SidebarRecommendations data={recommendations} />
				)}

				{activeView === 'medications' && (
					<SidebarMedications data={medications} />
				)}
			</div>
			{overview && (
				<div className='ai-quick-action'>
					<span
						className={`ai-quick-action-button ${activeView === 'recommendations' ? 'active' : ''} ${actionLoading ? 'disabled' : ''}`}
						title='recommendations'
						onClick={() =>
							!actionLoading && handleQuickAction('recommendations')
						}
						style={{
							cursor: actionLoading ? 'not-allowed' : 'pointer',
							opacity: actionLoading ? 0.6 : 1,
						}}
					>
						Recommendations
					</span>
					<span
						className={`ai-quick-action-button ${activeView === 'medications' ? 'active' : ''} ${actionLoading ? 'disabled' : ''}`}
						title='medications'
						onClick={() => !actionLoading && handleQuickAction('medications')}
						style={{
							cursor: actionLoading ? 'not-allowed' : 'pointer',
							opacity: actionLoading ? 0.6 : 1,
						}}
					>
						Medications
					</span>
				</div>
			)}
		</div>
	);
};
