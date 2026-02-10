import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import './Sidebar.css';
import type { Overview, ResponseData } from '../../types/types';
import { SidebarRecommendations } from '../SidebarRecommendations/SidebarRecommendations';
import { SidebarMedications } from '../SidebarMedications/SidebarMedications';

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
	const [overview, setOverview] = useState<Overview>();
	const [data, setData] = useState<ResponseData | null>(null);
	const [activeView, setActiveView] = useState<
		'recommendations' | 'medications' | null
	>(null);
	const [isActionLoading, setIsActionLoading] = useState(false);

	const { id: patient_serial } = useParams();

	const getAiOverview = async () => {
		try {
			const response = await fetch(
				`http://localhost:8000/api/agents/overview/${patient_serial}`,
			);

			if (!response.ok) {
				throw new Error('Failed to get AI overview');
			}

			const result = await response.json();

			setOverview(result);
		} catch (error) {
			setError(error as string);
		}
	};

	useEffect(() => {
		if (isAiSidebarOpen) {
			getAiOverview();

			setActiveView(null);
			setData(null);
		}
	}, [isAiSidebarOpen]);

	const handleQuickAction = async (
		action: 'recommendations' | 'medications',
	) => {
		if (isActionLoading) return;

		setError(null);
		setActiveView(action);
		setData(null);
		setIsActionLoading(true);

		try {
			const response = await fetch(
				`http://localhost:8000/api/agents/${action}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						overview: overview?.ai_overview.overview,
					}),
				},
			);

			if (!response.ok) {
				throw new Error('Failed to add note');
			}

			const newData = await response.json();

			setData(newData);
		} catch (error) {
			setError(error as string);
			setActiveView(null);
		} finally {
			setIsActionLoading(false);
		}
	};

	return (
		<div className={`ai-sidebar ${isAiSidebarOpen ? 'open' : ''}`}>
			<div className='ai-header'>
				<button
					className='ai-close-btn'
					onClick={() => setIsAiSidebarOpen(false)}
					disabled={isActionLoading}
				>
					&times;
				</button>
			</div>
			<div className='ai-body'>
				{activeView && !data && (
					<div className='ai-loading'>
						<p>Getting {activeView}...</p>
					</div>
				)}

				{!activeView && overview?.ai_overview && (
					<div className='ai-placeholder-content'>
						<div className='ai-message ai-ai'>
							<p>{overview?.ai_overview?.overview}</p>
						</div>
						<div>
							{overview?.ai_overview?.suggested_questions?.map(
								(question: string, index: number) => (
									<p className='ai-message' key={index}>
										{question}
									</p>
								),
							)}
						</div>
					</div>
				)}

				{!activeView && !overview?.ai_overview && (
					<div className='ai-message'>
						<p>Getting an overview...</p>
					</div>
				)}

				{activeView === 'recommendations' && (
					<SidebarRecommendations data={data} />
				)}

				{activeView === 'medications' && <SidebarMedications data={data} />}
			</div>
			{overview && (
				<div className='ai-quick-action'>
					<span
						className={`ai-quick-action-button ${activeView === 'recommendations' ? 'active' : ''} ${isActionLoading ? 'disabled' : ''}`}
						title='recommendations'
						onClick={() =>
							!isActionLoading && handleQuickAction('recommendations')
						}
						style={{
							cursor: isActionLoading ? 'not-allowed' : 'pointer',
							opacity: isActionLoading ? 0.6 : 1,
						}}
					>
						Recommendations
					</span>
					<span
						className={`ai-quick-action-button ${activeView === 'medications' ? 'active' : ''} ${isActionLoading ? 'disabled' : ''}`}
						title='medications'
						onClick={() => !isActionLoading && handleQuickAction('medications')}
						style={{
							cursor: isActionLoading ? 'not-allowed' : 'pointer',
							opacity: isActionLoading ? 0.6 : 1,
						}}
					>
						Medications
					</span>
				</div>
			)}
		</div>
	);
};
