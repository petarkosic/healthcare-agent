import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useSession } from '../../context/SessionContext';
import './Navbar.css';
import { getInitials, secondsToRoundedMinutes } from '../../utils/utils';
import { useAuth } from '../../context/Auth/AuthProvider';
import { API_BASE } from '../../lib/api';

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
	const [showEndForm, setShowEndForm] = useState(false);
	const [chiefComplaint, setChiefComplaint] = useState('');
	const [error, setError] = useState('');

	const location = useLocation();
	const navigate = useNavigate();
	const isPatientProfile = /^\/patients\/[^/]+$/.test(location.pathname);
	const { session, formatTime, endSession, startSession, elapsedTime } =
		useSession();
	const { doctorSerialNumber, doctorName, openModal, logout } = useAuth();

	const handleStartClick = () => {
		setShowTypeSelect(true);
	};

	const handleStartSession = async () => {
		try {
			const response = await fetch(`${API_BASE}/api/patients/visits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					patient_serial_number: location.pathname.split('/')[2],
					doctor_serial_number: doctorSerialNumber,
					visit_type: selectedType,
					location: selectedLocation,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to start session');
			}

			const data = await response.json();

			startSession(
				selectedType,
				selectedLocation,
				data.visit_id,
				location.pathname.split('/')[2],
			);
			setShowTypeSelect(false);
		} catch (error) {
			console.error(error);
			alert('Failed to start session');
		}
	};

	const handleCancelSelect = () => {
		setShowTypeSelect(false);
		setSelectedType('checkup');
		setSelectedLocation('Clinic');
	};

	const handleEndClick = () => {
		setShowEndForm(true);
	};

	const handleConfirmEnd = async () => {
		if (chiefComplaint.trim() === '') {
			setError('Main complaint cannot be empty');
			return;
		}

		const sessionData = {
			duration_minutes: secondsToRoundedMinutes(elapsedTime),
			chief_complaint: chiefComplaint,
			status: 'completed',
		};

		try {
			if (session?.visitId) {
				const response = await fetch(`${API_BASE}/api/patients/visits`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						visit_id: session.visitId,
						...sessionData,
					}),
				});

				if (!response.ok) {
					throw new Error('Failed to update visit');
				}
			}

			setChiefComplaint('');
			setShowEndForm(false);
			setError('');
			endSession();
		} catch (err) {
			console.error(err);
			alert('Failed to end session');
		}
	};

	const handleCancelEnd = () => {
		setShowEndForm(false);
		setChiefComplaint('');
	};

	const doctorLogout = () => {
		logout();
		navigate('/');
	};

	return (
		<nav className='navbar'>
			<div className='navbar-left'>
				<Link to='/' className='navbar-brand'>
					<span className='lp-logo-icon'>
						<svg
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							aria-hidden='true'
						>
							<path d='M22 12h-4l-3 9L9 3l-3 9H2' strokeLinejoin='round' />
						</svg>
					</span>
					HealthAgent
				</Link>
			</div>

			{(session || isPatientProfile) && location.pathname !== '/' && (
				<div className='navbar-center'>
					{session ? (
						<div className='session-active'>
							{showEndForm ? (
								<div className='session-end-form'>
									<div className='input-wrapper'>
										<input
											type='text'
											placeholder='Main complaint...'
											value={chiefComplaint}
											onChange={(e) => {
												setChiefComplaint(e.target.value);
												if (error) setError('');
											}}
											className='complaint-input'
											autoFocus
										/>
										{error && <span className='error'>{error}</span>}
									</div>
									<button onClick={handleCancelEnd} className='btn-cancel'>
										Cancel
									</button>
									<button
										onClick={handleConfirmEnd}
										className='btn-confirm-end'
									>
										Save and End
									</button>
								</div>
							) : (
								<>
									<div className='session-info'>
										<span className='session-type'>
											{session.type} - {session.location}
										</span>
										<span className='session-timer'>
											{formatTime(elapsedTime)}
										</span>
									</div>
									<button onClick={handleEndClick} className='btn-end-session'>
										End Session
									</button>
								</>
							)}
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

			<div className='lp-nav-actions'>
				{doctorSerialNumber ? (
					<>
						<div className='doctor-avatar'>{getInitials(doctorName!)}</div>
						<span className='doctor-nav-name'>{doctorName}</span>
						<button className='lp-btn lp-btn-outline' onClick={doctorLogout}>
							Sign Out
						</button>
					</>
				) : (
					<button className='lp-btn lp-btn-primary' onClick={openModal}>
						Sign In
					</button>
				)}
			</div>
		</nav>
	);
};
