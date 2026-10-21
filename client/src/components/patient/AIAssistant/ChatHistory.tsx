import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchConversations } from '../../../store/chatSlice';

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

	useEffect(() => {
		dispatch(fetchConversations({ patientSerial }));
	}, [patientSerial]);

	const loadMore = () => {
		dispatch(
			fetchConversations({ patientSerial, offset: conversations.length }),
		);
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

				{conversations.map((c) => (
					<button
						key={c.id}
						type='button'
						className={`ai-chat__history-item${c.id === activeConversationId ? ' ai-chat__history-item--active' : ''}`}
						onClick={() => onSelect(c.id)}
					>
						<span>{formatDate(c.last_message_at ?? c.created_at)}</span>
						{waitingOnReply && c.id === activeConversationId && (
							<span className='ai-spinner ai-chat__history-item-spinner' />
						)}
					</button>
				))}

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
