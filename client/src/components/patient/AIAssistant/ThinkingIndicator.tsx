import { useEffect, useState } from 'react';

const shuffled = <T,>(items: T[]): T[] => {
	const copy = [...items];

	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}

	return copy;
};

type Props = {
	messages: string[];
	/** How long each message stays on screen, in ms. */
	intervalMs?: number;
};

export const ThinkingIndicator = ({ messages, intervalMs = 3200 }: Props) => {
	const [order] = useState(() => shuffled(messages));
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (order.length <= 1) return;

		const id = window.setInterval(() => {
			setIndex((i) => (i + 1) % order.length);
		}, intervalMs);

		return () => window.clearInterval(id);
	}, [order.length, intervalMs]);

	return (
		<span className='ai-chat__thinking' role='status'>
			<span key={index} className='ai-chat__thinking-caption'>
				{order[index]}
			</span>
		</span>
	);
};
