import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { startSession, endSession } from '../../store/sessionSlice';
import './Navbar.css';
import {
	formatTime,
	getInitials,
	secondsToRoundedMinutes,
} from '../../utils/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { openModal, logoutUser } from '../../store/authSlice';
import {
	useCreateVisitMutation,
	useUpdateVisitMutation,
} from '../../store/api/patientsApi';
import { SettingsModal } from '../SettingsModal/SettingsModal';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

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
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [settingsSection, setSettingsSection] = useState<
		'keyboard' | 'connections' | 'account'
	>('account');

	const dropdownRef = useRef<HTMLDivElement>(null);

	const location = useLocation();
	const navigate = useNavigate();
	const isPatientProfile = /^\/patients\/(?!new$)[^/]+$/.test(
		location.pathname,
	);
	const session = useAppSelector((state) => state.session.session);
	const [elapsedTime, setElapsedTime] = useState(0);

	useEffect(() => {
		if (!session) return;
		const id = window.setInterval(() => {
			setElapsedTime(Math.floor((Date.now() - session.startTime) / 1000));
		}, 1000);
		return () => clearInterval(id);
	}, [session]);
	const dispatch = useAppDispatch();
	const { doctorSerialNumber, doctorName } = useAppSelector(
		(state) => state.auth,
	);
	const [createVisit] = useCreateVisitMutation();
	const [updateVisit] = useUpdateVisitMutation();

	useEffect(() => {
		if (!dropdownOpen) return;

		const handler = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handler);

		return () => document.removeEventListener('mousedown', handler);
	}, [dropdownOpen]);

	useKeyboardShortcuts({
		'?': () => {
			if (!doctorSerialNumber) return;

			setSettingsSection('account');
			setSettingsOpen(true);
		},
		n: () => {
			if (
				!doctorSerialNumber ||
				session ||
				location.pathname === '/patients/new'
			)
				return;

			navigate('/patients/new');
		},
		N: () => {
			if (
				!doctorSerialNumber ||
				session ||
				location.pathname === '/patients/new'
			)
				return;

			navigate('/patients/new');
		},
		'/': (e) => {
			if (!doctorSerialNumber) return;

			e.preventDefault();
			document.dispatchEvent(new CustomEvent('mediflow:focus-search'));
		},
	});

	const handleStartClick = () => {
		setShowTypeSelect(true);
	};

	const handleStartSession = async () => {
		const patientId = location.pathname.split('/')[2];

		try {
			const data = await createVisit({
				patientId,
				body: {
					patient_serial_number: patientId,
					doctor_serial_number: doctorSerialNumber,
					visit_type: selectedType,
					location: selectedLocation,
				},
			}).unwrap();

			dispatch(
				startSession({
					type: selectedType,
					location: selectedLocation,
					visitId: data.visit_id,
					patientSerialNumber: patientId,
				}),
			);

			setShowTypeSelect(false);
		} catch {
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
				await updateVisit({
					patientId: session.patientSerialNumber!,
					body: { visit_id: session.visitId, ...sessionData },
				}).unwrap();
			}

			setChiefComplaint('');
			setShowEndForm(false);
			setError('');
			dispatch(endSession());
		} catch {
			alert('Failed to end session');
		}
	};

	const handleCancelEnd = () => {
		setShowEndForm(false);
		setChiefComplaint('');
	};

	const doctorLogout = async () => {
		await dispatch(logoutUser());
		navigate('/');
	};

	return (
		<>
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
						<span className='navbar-brand-text'>MediFlow</span>
					</Link>

					{doctorSerialNumber && (
						<nav className='navbar-nav'>
							<Link
								to='/dashboard'
								className={`navbar-nav-link${location.pathname === '/dashboard' ? ' navbar-nav-link--active' : ''}`}
							>
								Dashboard
							</Link>
							<Link
								to='/patients'
								className={`navbar-nav-link${location.pathname.startsWith('/patients') ? ' navbar-nav-link--active' : ''}`}
							>
								Patients
							</Link>
						</nav>
					)}
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
										<button
											onClick={handleEndClick}
											className='btn-end-session'
										>
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
						<div className='doctor-menu-wrapper' ref={dropdownRef}>
							<button
								className='doctor-menu-trigger'
								onClick={() => setDropdownOpen((o) => !o)}
							>
								<div className='doctor-avatar'>{getInitials(doctorName!)}</div>
								<span className='doctor-nav-name'>Dr. {doctorName}</span>
							</button>
							{dropdownOpen && (
								<div className='doctor-dropdown'>
									<button
										className='doctor-dropdown-item'
										onClick={() => {
											setSettingsSection('account');
											setSettingsOpen(true);
											setDropdownOpen(false);
										}}
									>
										Settings
									</button>
									<button
										className='doctor-dropdown-item'
										onClick={doctorLogout}
									>
										Sign Out
									</button>
								</div>
							)}
						</div>
					) : (
						<button
							className='lp-btn lp-btn-primary'
							onClick={() => dispatch(openModal())}
						>
							Sign In
						</button>
					)}
				</div>
			</nav>

			<SettingsModal
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				defaultSection={settingsSection}
			/>
		</>
	);
};
