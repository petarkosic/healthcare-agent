import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import './AIChat.css';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	createConversation,
	fetchChatMessages,
	sendChatMessage,
	setActiveConversation,
	startNewChat,
	appendOptimisticUserMessage,
} from '../../../store/chatSlice';
import { ChatChart } from './ChatChart';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ChatHistory } from './ChatHistory';

const HINT_POOL = [
	'What are the current medications?',
	'Any critical labs this visit?',
	'Show blood pressure trend',
	'Show weight trend',
	'Show heart rate trend',
	'What are the active diagnoses?',
	'Summarize the most recent visit',
	'Any abnormal lab results recently?',
	'What did the last visit note say?',
];

const pickRandomHints = () =>
	[...HINT_POOL].sort(() => Math.random() - 0.5).slice(0, 3);

const THINKING_MESSAGES = [
	'Thinking...',
	'Checking the chart...',
	'Reviewing recent data...',
	'Looking at vitals and labs...',
	'Cross-referencing medications...',
	'Scanning visit notes...',
	'Double-checking the details...',
	'Putting together an answer...',
];

export const AIChat = () => {
	const { id: patientSerial } = useParams();
	const dispatch = useAppDispatch();
	const [input, setInput] = useState('');
	const [showHistory, setShowHistory] = useState(false);
	const hints = useMemo(() => pickRandomHints(), [patientSerial]);

	const cache = useAppSelector((state) => state.chat.byPatient[patientSerial!]);
	const activeConversationId = cache?.activeConversationId ?? null;
	const messages = cache?.messages ?? [];
	const sending = cache?.sendStatus === 'loading';
	const capReached = cache?.capReached ?? false;
	const sendError = cache?.sendError ?? null;

	const messagesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = messagesRef.current;
		if (!node) return;

		node.scrollTop = node.scrollHeight;
	}, [messages, sending]);

	const handleNewChat = () => {
		setShowHistory(false);
		setInput('');
		dispatch(startNewChat(patientSerial!));
	};

	const handleSelectConversation = (conversationId: string) => {
		dispatch(
			setActiveConversation({ patientSerial: patientSerial!, conversationId }),
		);
		dispatch(
			fetchChatMessages({ patientSerial: patientSerial!, conversationId }),
		);
		setShowHistory(false);
	};

	const submit = async (text: string) => {
		if (!text.trim() || sending || capReached) return;

		let conversationId = activeConversationId;
		if (!conversationId) {
			const result = await dispatch(createConversation(patientSerial!));
			if (createConversation.fulfilled.match(result)) {
				conversationId = result.payload;
			} else {
				return;
			}
		}

		dispatch(
			appendOptimisticUserMessage({
				patientSerial: patientSerial!,
				content: text,
			}),
		);
		setInput('');

		const result = await dispatch(
			sendChatMessage({
				patientSerial: patientSerial!,
				conversationId,
				message: text,
			}),
		);

		if (
			sendChatMessage.rejected.match(result) &&
			result.payload !== 'cap_reached'
		) {
			setInput(text);
		}
	};

	return (
		<div className='ai-chat'>
			<div className='ai-chat__header'>
				<span
					className='btn-tooltip-wrap ai-chat__history-trigger-wrap'
					data-tooltip={showHistory ? 'Back' : 'History'}
				>
					<button
						type='button'
						className='ai-chat__history-btn'
						onClick={() => setShowHistory((v) => !v)}
						aria-label={showHistory ? 'Back' : 'History'}
					>
						{showHistory ? (
							<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
								<path
									d='M15 5l-7 7 7 7'
									stroke='currentColor'
									strokeWidth='1.8'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
						) : (
							<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
								<circle
									cx='12'
									cy='12'
									r='9'
									stroke='currentColor'
									strokeWidth='1.8'
								/>
								<path
									d='M12 7v5l3 3'
									stroke='currentColor'
									strokeWidth='1.8'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
						)}
					</button>
				</span>
				<span
					className='btn-tooltip-wrap ai-chat__history-trigger-wrap ai-chat__new-chat-trigger-wrap'
					data-tooltip='New chat'
				>
					<button
						type='button'
						className='ai-chat__history-btn'
						onClick={handleNewChat}
						aria-label='New chat'
					>
						<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
							<path
								d='M12 5v14M5 12h14'
								stroke='currentColor'
								strokeWidth='1.8'
								strokeLinecap='round'
							/>
						</svg>
					</button>
				</span>
			</div>

			{showHistory ? (
				<ChatHistory
					patientSerial={patientSerial!}
					onSelect={handleSelectConversation}
				/>
			) : (
				<>
					<div className='ai-chat__messages' ref={messagesRef}>
						{messages.length === 0 && !sending ? (
							<div className='ai-chat__empty'>
								<svg
									className='ai-chat__empty-icon'
									viewBox='0 0 24 24'
									fill='currentColor'
									aria-hidden='true'
								>
									<path d='M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z' />
									<path d='M19 15l.8 2.2L22 18l-2.2.8-.8 2.2-.8-2.2L16 18l2.2-.8z' />
								</svg>
								<p>
									Ask about medications, labs, trends, or anything else in this
									patient's chart.
								</p>
							</div>
						) : (
							messages.map((msg, i) => (
								<div
									key={msg.id ?? i}
									className={`ai-chat__message ai-chat__message--${msg.role}${msg.failed ? ' ai-chat__message--failed' : ''}`}
								>
									<p>{msg.content}</p>
									{msg.chart_data && <ChatChart data={msg.chart_data} />}
									{msg.failed && (
										<div className='ai-chat__message-error'>
											<span>Failed to get a response.</span>
											<span
												className='btn-tooltip-wrap ai-chat__retry-wrap'
												data-tooltip='Retry'
											>
												<button
													type='button'
													className='ai-chat__retry-btn'
													onClick={() => submit(msg.content)}
													aria-label='Retry'
												>
													<svg
														viewBox='0 0 24 24'
														fill='currentColor'
														aria-hidden='true'
													>
														<path d='M17.65 6.35A7.95 7.95 0 0012 4a8 8 0 100 16 8 8 0 007.74-6h-2.08A6 6 0 1112 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z' />
													</svg>
												</button>
											</span>
										</div>
									)}
								</div>
							))
						)}
					</div>

					{sending && (
						<div className='ai-chat__message ai-chat__message--thinking'>
							<ThinkingIndicator messages={THINKING_MESSAGES} />
						</div>
					)}

					{messages.length === 0 && (
						<div className='ai-chat__hints'>
							{hints.map((q) => (
								<button
									key={q}
									type='button'
									className='ai-chat__hint-chip'
									onClick={() => submit(q)}
								>
									{q}
								</button>
							))}
						</div>
					)}

					{capReached && (
						<p className='ai-chat__cap-notice'>
							This chat is getting long — start a new one.
						</p>
					)}

					{sendError && !capReached && (
						<p className='ai-chat__cap-notice ai-chat__send-error'>
							{sendError}
						</p>
					)}

					<form
						className='ai-chat__input-row'
						onSubmit={(e) => {
							e.preventDefault();
							submit(input);
						}}
					>
						<input
							type='text'
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder='Ask about this patient...'
							disabled={sending || capReached}
						/>
						<button
							type='submit'
							disabled={sending || capReached || !input.trim()}
						>
							Send
						</button>
					</form>
				</>
			)}
		</div>
	);
};
