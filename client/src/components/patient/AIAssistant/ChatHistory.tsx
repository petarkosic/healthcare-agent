import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchConversations, deleteConversation } from '../../../store/chatSlice';

type Props = {
	patientSerial: string;
	onSelect: (conversationId: string) => void;
};

const formatDate = (iso: string) =>
	new Date(iso).toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});

export const ChatHistory = ({ patientSerial, onSelect }: Props) => {
	const dispatch = useAppDispatch();
	const cache = useAppSelector((state) => state.chat.byPatient[patientSerial]);
	const conversations = cache?.conversations ?? [];
	const hasMore = cache?.conversationsHasMore ?? false;
	const loading = cache?.conversationsStatus === 'loading';
	const activeConversationId = cache?.activeConversationId ?? null;
	const waitingOnReply = cache?.sendStatus === 'loading';
	const deleteError = cache?.deleteConversationError ?? null;
	const failedDeleteId = deleteError?.conversationId ?? null;
	const [confirmingId, setConfirmingId] = useState<string | null>(null);

	useEffect(() => {
		dispatch(fetchConversations({ patientSerial }));
	}, [patientSerial]);

	const loadMore = () => {
		dispatch(
			fetchConversations({ patientSerial, offset: conversations.length }),
		);
	};

	const confirmDelete = (conversationId: string) => {
		dispatch(deleteConversation({ patientSerial, conversationId }));
		setConfirmingId(null);
	};

	return (
		<div className='ai-chat__history'>
			<div className='ai-chat__history-head'>
				<span>History</span>
			</div>

			<div className='ai-chat__history-list'>
				{conversations.length === 0 && !loading && (
					<p className='ai-chat__history-empty'>No previous conversations.</p>
				)}

				{conversations.map((c) =>
					confirmingId === c.id ? (
						<div key={c.id} className='ai-chat__history-item ai-chat__history-item--confirm'>
							<span>Delete this conversation?</span>
							<div className='ai-chat__history-item-confirm-actions'>
								<button
									type='button'
									className='btn-secondary'
									onClick={() => setConfirmingId(null)}
								>
									Cancel
								</button>
								<button
									type='button'
									className='btn-danger'
									onClick={() => confirmDelete(c.id)}
								>
									Delete
								</button>
							</div>
						</div>
					) : (
						<div key={c.id}>
							<div
								className={`ai-chat__history-item ai-chat__history-item-clickable${c.id === activeConversationId ? ' ai-chat__history-item--active' : ''}${c.id === failedDeleteId ? ' ai-chat__history-item--delete-failed' : ''}`}
								onClick={() => onSelect(c.id)}
							>
								<span>{formatDate(c.last_message_at ?? c.created_at)}</span>

								<span className='ai-chat__history-item-trailing'>
									{waitingOnReply && c.id === activeConversationId && (
										<span className='ai-spinner ai-chat__history-item-spinner' />
									)}

									<span
										className='btn-tooltip-wrap ai-chat__history-delete-wrap'
										data-tooltip='Delete'
									>
										<button
											type='button'
											className='ai-chat__history-delete-btn'
											onClick={(e) => {
												e.stopPropagation();
												setConfirmingId(c.id);
											}}
											aria-label='Delete conversation'
										>
											<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
												<path
													d='M5 7h14M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13'
													stroke='currentColor'
													strokeWidth='1.8'
													strokeLinecap='round'
													strokeLinejoin='round'
												/>
											</svg>
										</button>
									</span>
								</span>
							</div>

							{c.id === failedDeleteId && (
								<p className='ai-chat__history-item-error'>
									{deleteError?.message}
								</p>
							)}
						</div>
					),
				)}

				{loading && <p className='ai-chat__history-empty'>Loading...</p>}
			</div>

			{hasMore && !loading && (
				<button type='button' className='ai-back-btn' onClick={loadMore}>
					Load more
				</button>
			)}
		</div>
	);
};
