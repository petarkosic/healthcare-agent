import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import './AIAssistant.css';
import { AIRecommendations } from './AIRecommendations';
import { AIMedications } from './AIMedications';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import {
	fetchAiOverview,
	fetchAiRecommendations,
	fetchAiMedications,
} from '../../../store/aiSlice';

export const AIAssistant = () => {
	const [open, setOpen] = useState(false);
	const isMobile = useMediaQuery('(max-width: 768px)');

	useEffect(() => {
		if (!isMobile || !open) return;

		const original = document.body.style.overflow;
		document.body.style.overflow = 'clip';

		return () => {
			document.body.style.overflow = original;
		};
	}, [isMobile, open]);
	const [error, setError] = useState<string | null>(null);
	const [activeView, setActiveView] = useState<
		'recommendations' | 'medications' | null
	>(null);
	const [recommendationsView, setRecommendationsView] = useState<
		'card' | 'schedule' | 'success'
	>('card');
	const isScheduling = recommendationsView === 'schedule';

	const { id: patient_serial } = useParams();
	const dispatch = useAppDispatch();
	const session = useAppSelector((state) => state.session.session);

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
		if (!open) return;

		dispatch(fetchAiOverview(patient_serial!)).then((result) => {
			if (fetchAiOverview.rejected.match(result) && !result.meta.condition) {
				setError(result.error.message ?? 'Failed to get AI overview');
			}
		});
	}, [open, patient_serial]);

	const activeData =
		activeView === 'recommendations'
			? recommendations
			: activeView === 'medications'
				? medications
				: null;

	const handleBack = () => {
		if (isScheduling) return;
		setActiveView(null);
		setRecommendationsView('card');
	};

	const handleClose = () => {
		setOpen(false);
		setRecommendationsView('card');
		setError(null);
	};

	const handleQuickAction = async (
		action: 'recommendations' | 'medications',
	) => {
		if (actionLoading || !overview || isScheduling) return;

		setActiveView(action);
		setRecommendationsView('card');
		setError(null);

		if (action === 'recommendations') {
			const result = await dispatch(
				fetchAiRecommendations({ patientSerial: patient_serial! }),
			);

			if (
				fetchAiRecommendations.rejected.match(result) &&
				!result.meta.condition
			) {
				setError(result.error.message ?? 'Failed to get recommendations');
				setActiveView(null);
			}
		} else {
			const result = await dispatch(
				fetchAiMedications({ patientSerial: patient_serial! }),
			);

			if (fetchAiMedications.rejected.match(result) && !result.meta.condition) {
				setError(result.error.message ?? 'Failed to get medications');
				setActiveView(null);
			}
		}
	};

	return (
		<div className={`card ai-assistant${open ? ' ai-assistant--open' : ''}`}>
			<div className='ai-assistant__head'>
				<span className='ai-assistant__title'>
					<svg
						className='ai-assistant__sparkle'
						viewBox='0 0 24 24'
						fill='currentColor'
						aria-hidden='true'
					>
						<path d='M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z' />
						<path d='M19 15l.8 2.2L22 18l-2.2.8-.8 2.2-.8-2.2L16 18l2.2-.8z' />
					</svg>
					AI Assistant
				</span>
				{open ? (
					<button
						type='button'
						className='ai-assistant__close'
						onClick={handleClose}
					>
						Close
					</button>
				) : (
					<span
						className={!session ? 'btn-tooltip-wrap' : undefined}
						data-tooltip={
							!session ? 'Start a session to use the AI assistant' : undefined
						}
					>
						<button
							type='button'
							className='ai-assistant__trigger'
							onClick={() => setOpen(true)}
							disabled={!session}
							aria-label='Open AI Assistant'
						>
							<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
								<path d='M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z' />
								<path d='M19 15l.8 2.2L22 18l-2.2.8-.8 2.2-.8-2.2L16 18l2.2-.8z' />
							</svg>
							<span className='ai-assistant__trigger-label'>Open</span>
						</button>
					</span>
				)}
			</div>

			{!open && (
				<p className='ai-assistant__blurb'>
					Summarizes this patient's chart, flags critical findings, and surfaces
					suggested questions to ask during the visit. Ask it for follow-up
					recommendations or a review of current medications whenever you need a
					second pair of eyes.
				</p>
			)}

			{open && (
				<div className='ai-assistant__body'>
					{activeView && (
						<span
							className={isScheduling ? 'btn-tooltip-wrap' : undefined}
							data-tooltip={
								isScheduling ? 'Finish or cancel scheduling first' : undefined
							}
						>
							<button
								className='ai-back-btn'
								onClick={handleBack}
								disabled={actionLoading || isScheduling}
							>
								&#8592; Overview
							</button>
						</span>
					)}

					{error && <p className='ai-assistant__error'>{error}</p>}

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
						<div className='ai-placeholder-content ai-assistant__tab-content'>
							<div className='ai-message ai-ai'>
								<p>{overview.ai_overview.overview}</p>
							</div>
							{overview.ai_overview.critical_alerts?.length > 0 && (
								<div className='ai-message ai-critical'>
									<p className='ai-critical-heading'>Critical findings</p>
									<ul className='ai-critical-list'>
										{overview.ai_overview.critical_alerts.map(
											(finding: string, index: number) => (
												<li key={index}>{finding}</li>
											),
										)}
									</ul>
								</div>
							)}
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
						<div className='ai-message ai-assistant__tab-content'>
							<p>No overview available.</p>
						</div>
					)}

					{activeView === 'recommendations' && (
						<div key='recommendations' className='ai-assistant__tab-content'>
							<AIRecommendations
								data={recommendations}
								viewMode={recommendationsView}
								setViewMode={setRecommendationsView}
							/>
						</div>
					)}

					{activeView === 'medications' && (
						<div key='medications' className='ai-assistant__tab-content'>
							<AIMedications data={medications} />
						</div>
					)}

					{overview && (
						<div className='ai-quick-action'>
							<span
								className={
									isScheduling
										? 'btn-tooltip-wrap ai-quick-action-wrap'
										: 'ai-quick-action-wrap'
								}
								data-tooltip={
									isScheduling ? 'Finish or cancel scheduling first' : undefined
								}
							>
								<button
									type='button'
									className={`ai-quick-action-button${activeView === 'recommendations' ? ' active' : ''}`}
									disabled={actionLoading || isScheduling}
									onClick={() => handleQuickAction('recommendations')}
								>
									Recommendations
								</button>
							</span>
							<span
								className={
									isScheduling
										? 'btn-tooltip-wrap ai-quick-action-wrap'
										: 'ai-quick-action-wrap'
								}
								data-tooltip={
									isScheduling ? 'Finish or cancel scheduling first' : undefined
								}
							>
								<button
									type='button'
									className={`ai-quick-action-button${activeView === 'medications' ? ' active' : ''}`}
									disabled={actionLoading || isScheduling}
									onClick={() => handleQuickAction('medications')}
								>
									Medications
								</button>
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
