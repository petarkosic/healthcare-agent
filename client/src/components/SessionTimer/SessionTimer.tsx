import { useEffect, useState } from 'react';
import { formatTime } from '../../utils/utils';

interface SessionTimerProps {
	startTime: number;
}

export const SessionTimer = ({ startTime }: SessionTimerProps) => {
	const [elapsedTime, setElapsedTime] = useState(() =>
		Math.floor((Date.now() - startTime) / 1000),
	);

	useEffect(() => {
		const id = window.setInterval(() => {
			setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
		}, 1000);
		return () => clearInterval(id);
	}, [startTime]);

	return <span className='session-timer'>{formatTime(elapsedTime)}</span>;
};
