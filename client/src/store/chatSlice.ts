import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ChatMessage, ChatConversation } from '../types/types';
import { API_BASE, apiFetch } from '../lib/api';

type FetchStatus = 'idle' | 'loading' | 'done' | 'error';

const CONVERSATIONS_PAGE_SIZE = 20;

interface PatientChatCache {
	conversations: ChatConversation[];
	conversationsStatus: FetchStatus;
	conversationsHasMore: boolean;
	activeConversationId: string | null;
	messages: ChatMessage[];
	messagesStatus: FetchStatus;
	sendStatus: FetchStatus;
	sendError: string | null;
	capReached: boolean;
	deleteConversationError: { conversationId: string; message: string } | null;
}

interface ChatState {
	byPatient: Record<string, PatientChatCache>;
}

const emptyCache = (): PatientChatCache => ({
	conversations: [],
	conversationsStatus: 'idle',
	conversationsHasMore: false,
	activeConversationId: null,
	messages: [],
	messagesStatus: 'idle',
	sendStatus: 'idle',
	sendError: null,
	capReached: false,
	deleteConversationError: null,
});

const initialState: ChatState = { byPatient: {} };

export const fetchConversations = createAsyncThunk(
	'chat/fetchConversations',
	async ({
		patientSerial,
		offset = 0,
	}: {
		patientSerial: string;
		offset?: number;
	}) => {
		const res = await apiFetch(
			`${API_BASE}/api/agents/chat/${patientSerial}/conversations?limit=${CONVERSATIONS_PAGE_SIZE}&offset=${offset}`,
		);
		if (!res.ok) throw new Error('Failed to load conversations');

		return (await res.json()) as {
			conversations: ChatConversation[];
			has_more: boolean;
		};
	},
);

export const createConversation = createAsyncThunk(
	'chat/createConversation',
	async (patientSerial: string) => {
		const res = await apiFetch(
			`${API_BASE}/api/agents/chat/${patientSerial}/conversations`,
			{
				method: 'POST',
			},
		);
		if (!res.ok) throw new Error('Failed to create conversation');

		const data = (await res.json()) as { conversation_id: string };

		return data.conversation_id;
	},
);

export const deleteConversation = createAsyncThunk(
	'chat/deleteConversation',
	async ({
		patientSerial,
		conversationId,
	}: {
		patientSerial: string;
		conversationId: string;
	}) => {
		const res = await apiFetch(
			`${API_BASE}/api/agents/chat/${patientSerial}/conversations/${conversationId}`,
			{ method: 'DELETE' },
		);
		if (!res.ok) throw new Error('Failed to delete conversation');

		return conversationId;
	},
);

export const fetchChatMessages = createAsyncThunk(
	'chat/fetchMessages',
	async ({
		patientSerial,
		conversationId,
	}: {
		patientSerial: string;
		conversationId: string;
	}) => {
		const res = await apiFetch(
			`${API_BASE}/api/agents/chat/${patientSerial}/conversations/${conversationId}/messages`,
		);

		if (!res.ok) throw new Error('Failed to load messages');

		return (await res.json()) as ChatMessage[];
	},
);

export const sendChatMessage = createAsyncThunk(
	'chat/sendMessage',
	async (
		{
			patientSerial,
			conversationId,
			message,
		}: { patientSerial: string; conversationId: string; message: string },
		{ rejectWithValue },
	) => {
		const res = await apiFetch(
			`${API_BASE}/api/agents/chat/${patientSerial}/conversations/${conversationId}/messages`,
			{ method: 'POST', body: JSON.stringify({ message }) },
		);

		if (res.status === 409) return rejectWithValue('cap_reached');
		if (res.status === 429) return rejectWithValue('rate_limited');
		if (!res.ok) return rejectWithValue('failed');

		return (await res.json()) as ChatMessage;
	},
);

const ensure = (state: ChatState, patientSerial: string) => {
	if (!state.byPatient[patientSerial])
		state.byPatient[patientSerial] = emptyCache();
};

const chatSlice = createSlice({
	name: 'chat',
	initialState,
	reducers: {
		setActiveConversation(
			state,
			action: { payload: { patientSerial: string; conversationId: string } },
		) {
			ensure(state, action.payload.patientSerial);
			state.byPatient[action.payload.patientSerial].activeConversationId =
				action.payload.conversationId;
		},
		startNewChat(state, action: { payload: string }) {
			ensure(state, action.payload);
			const cache = state.byPatient[action.payload];
			cache.activeConversationId = null;
			cache.messages = [];
			cache.messagesStatus = 'idle';
			cache.capReached = false;
			cache.sendError = null;
		},
		appendOptimisticUserMessage(
			state,
			action: { payload: { patientSerial: string; content: string } },
		) {
			ensure(state, action.payload.patientSerial);
			state.byPatient[action.payload.patientSerial].messages.push({
				role: 'user',
				content: action.payload.content,
				tool_calls: [],
				chart_data: null,
				created_at: new Date().toISOString(),
			});
		},
		clearPatientChatCache(state, action: { payload: string }) {
			delete state.byPatient[action.payload];
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchConversations.pending, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].conversationsStatus = 'loading';
			})
			.addCase(fetchConversations.fulfilled, (state, { meta, payload }) => {
				const cache = state.byPatient[meta.arg.patientSerial];
				const offset = meta.arg.offset ?? 0;

				cache.conversations =
					offset === 0
						? payload.conversations
						: [...cache.conversations, ...payload.conversations];
				cache.conversationsHasMore = payload.has_more;
				cache.conversationsStatus = 'done';
			})
			.addCase(fetchConversations.rejected, (state, { meta }) => {
				state.byPatient[meta.arg.patientSerial].conversationsStatus = 'error';
			})

			.addCase(createConversation.fulfilled, (state, { meta, payload }) => {
				ensure(state, meta.arg);
				state.byPatient[meta.arg].activeConversationId = payload;
				state.byPatient[meta.arg].messages = [];
				state.byPatient[meta.arg].capReached = false;
			})

			.addCase(deleteConversation.pending, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].deleteConversationError = null;
			})
			.addCase(deleteConversation.fulfilled, (state, { meta, payload }) => {
				const cache = state.byPatient[meta.arg.patientSerial];
				if (!cache) return;

				cache.conversations = cache.conversations.filter(
					(c) => c.id !== payload,
				);

				if (cache.activeConversationId === payload) {
					cache.activeConversationId = null;
					cache.messages = [];
					cache.messagesStatus = 'idle';
					cache.capReached = false;
					cache.sendError = null;
				}
			})
			.addCase(deleteConversation.rejected, (state, { meta }) => {
				const cache = state.byPatient[meta.arg.patientSerial];
				if (!cache) return;

				cache.deleteConversationError = {
					conversationId: meta.arg.conversationId,
					message: 'Failed to delete - try again.',
				};
			})

			.addCase(fetchChatMessages.pending, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].messagesStatus = 'loading';
			})
			.addCase(fetchChatMessages.fulfilled, (state, { meta, payload }) => {
				state.byPatient[meta.arg.patientSerial].messages = payload;
				state.byPatient[meta.arg.patientSerial].messagesStatus = 'done';
			})
			.addCase(fetchChatMessages.rejected, (state, { meta }) => {
				state.byPatient[meta.arg.patientSerial].messagesStatus = 'error';
			})

			.addCase(sendChatMessage.pending, (state, { meta }) => {
				ensure(state, meta.arg.patientSerial);
				state.byPatient[meta.arg.patientSerial].sendStatus = 'loading';
				state.byPatient[meta.arg.patientSerial].sendError = null;
			})
			.addCase(sendChatMessage.fulfilled, (state, { meta, payload }) => {
				state.byPatient[meta.arg.patientSerial].messages.push(payload);
				state.byPatient[meta.arg.patientSerial].sendStatus = 'done';
			})
			.addCase(sendChatMessage.rejected, (state, { meta, payload }) => {
				const cache = state.byPatient[meta.arg.patientSerial];
				cache.sendStatus = 'error';

				if (payload === 'cap_reached') {
					// Rejected before the user message was ever persisted (the
					// message-count check runs before chat_repository.add_message) -
					// true rollback.
					cache.messages.pop();
					cache.capReached = true;
				} else if (payload === 'rate_limited') {
					// Rejected by the rate limiter before the route body runs at
					// all - nothing was persisted either, same rollback.
					cache.messages.pop();
					cache.sendError =
						"You're sending messages too fast - wait a moment and try again.";
				} else {
					// The user message WAS persisted server-side before generation
					// failed (chat_repository.add_message runs before the LLM
					// call), so popping it here would be a lie - the row exists
					// and will reappear next time messages are refetched. Keep it
					// and mark it as failed instead.
					const last = cache.messages[cache.messages.length - 1];
					if (last) last.failed = true;
					cache.sendError =
						'Something went wrong sending that message - try again.';
				}
			});
	},
});

export const {
	setActiveConversation,
	startNewChat,
	appendOptimisticUserMessage,
	clearPatientChatCache,
} = chatSlice.actions;
export default chatSlice.reducer;
