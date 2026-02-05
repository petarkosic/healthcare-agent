import { useEffect, useState } from 'react';
import type { Overview } from '../../types/types';
import { useParams } from 'react-router';
import './SIdebar.css';

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
		}
	}, [isAiSidebarOpen]);

	return (
		<div className={`ai-sidebar ${isAiSidebarOpen ? 'open' : ''}`}>
			<div className='ai-header'>
				<button
					className='ai-close-btn'
					onClick={() => setIsAiSidebarOpen(false)}
				>
					&times;
				</button>
			</div>
			<div className='ai-body'>
				{overview?.ai_overview && (
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

				{!overview?.ai_overview && (
					<div className='ai-message'>
						<p>Getting an overview...</p>
					</div>
				)}
			</div>
		</div>
	);
};
