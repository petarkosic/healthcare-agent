import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSession } from '../../context/SessionContext';
import './Navbar.css';

const VISIT_TYPES = [
	{ value: 'checkup', label: 'Checkup' },
	{ value: 'followup', label: 'Follow-up' },
	{ value: 'emergency', label: 'Emergency' },
	{ value: 'specialist', label: 'Specialist' },
	{ value: 'vaccination', label: 'Vaccination' },
	{ value: 'routine', label: 'Routine' },
	{ value: 'urgent_care', label: 'Urgent Care' },
	{ value: 'surgical', label: 'Surgical' },
	{ value: 'telehealth', label: 'Telehealth' },
];

const LOCATIONS = [
	{ value: 'Clinic', label: 'Clinic' },
	{ value: 'Hospital', label: 'Hospital' },
	{ value: 'Telehealth', label: 'Telehealth' },
	{ value: 'Home Visit', label: 'Home Visit' },
	{ value: 'Urgent Care', label: 'Urgent Care' },
];

export const Navbar = () => {
	const [showTypeSelect, setShowTypeSelect] = useState(false);
	const [selectedType, setSelectedType] = useState('checkup');
	const [selectedLocation, setSelectedLocation] = useState('Clinic');

	const location = useLocation();
	const { session, formatTime, endSession, startSession, elapsedTime } =
		useSession();

	const handleStartClick = () => {
		setShowTypeSelect(true);
	};

	const handleStartSession = () => {
		startSession(selectedType, selectedLocation);
		setShowTypeSelect(false);
	};

	const handleCancelSelect = () => {
		setShowTypeSelect(false);
		setSelectedType('checkup');
		setSelectedLocation('Clinic');
	};

	return (
		<nav className='navbar'>
			<div className='navbar-left'>
				<Link to='/' className='navbar-brand'>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						className='navbar-brand-icon'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
						/>
					</svg>
					Home
				</Link>
			</div>

			{location.pathname! != '/' && (
				<div className='navbar-center'>
					{session ? (
						<div className='session-active'>
							<div className='session-info'>
								<span className='session-type'>
									{session.type} - {session.location}
								</span>
								<span className='session-timer'>{formatTime(elapsedTime)}</span>
							</div>
							<button onClick={endSession} className='btn-end-session'>
								End Session
							</button>
						</div>
					) : showTypeSelect ? (
						<div className='session-select'>
							<select
								className='session-select-input'
								value={selectedType}
								onChange={(e) => setSelectedType(e.target.value)}
							>
								{VISIT_TYPES.map((t) => (
									<option key={t.value} value={t.value}>
										{t.label}
									</option>
								))}
							</select>
							<select
								className='session-select-input'
								value={selectedLocation}
								onChange={(e) => setSelectedLocation(e.target.value)}
							>
								{LOCATIONS.map((l) => (
									<option key={l.value} value={l.value}>
										{l.label}
									</option>
								))}
							</select>
							<div className='session-select-actions'>
								<button onClick={handleCancelSelect} className='btn-cancel'>
									Cancel
								</button>
								<button
									onClick={handleStartSession}
									className='btn-start-timer'
								>
									Start Timer
								</button>
							</div>
						</div>
					) : (
						<button onClick={handleStartClick} className='btn-start-session'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='btn-start-icon'
								viewBox='0 0 20 20'
								fill='currentColor'
							>
								<path
									fillRule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
									clipRule='evenodd'
								/>
							</svg>
							Start Session
						</button>
					)}
				</div>
			)}

			<div className='navbar-right'>
				<div className='doctor-info'>
					<p className='doctor-specialty'>Cardiology</p>
				</div>
				<div className='doctor-avatar'>
					<span>DS</span>
				</div>
			</div>
		</nav>
	);
};
