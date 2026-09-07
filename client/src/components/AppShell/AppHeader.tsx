import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleSidebar } from '../../store/uiSlice';
import { startSession, endSession } from '../../store/sessionSlice';
import { secondsToRoundedMinutes } from '../../utils/utils';
import {
	useCreateVisitMutation,
	useUpdateVisitMutation,
} from '../../store/api/patientsApi';
import type { VisitType, VisitLocation, VisitStatus } from '../../types/enums';
import { SessionTimer } from '../SessionTimer/SessionTimer';
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

type AppHeaderProps = {
	onOpenDrawer: () => void;
	isMobile: boolean;
};

export const AppHeader = ({ onOpenDrawer, isMobile }: AppHeaderProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const session = useAppSelector((s) => s.session.session);
	const doctorSerialNumber = useAppSelector((s) => s.auth.doctorSerialNumber);
	const sidebarCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

	const [createVisit] = useCreateVisitMutation();
	const [updateVisit] = useUpdateVisitMutation();

	const isPatientProfile = /^\/patients\/(?!new$)[^/]+$/.test(
		location.pathname,
	);

	const [showTypeSelect, setShowTypeSelect] = useState(false);
	const [selectedType, setSelectedType] = useState('checkup');
	const [selectedLocation, setSelectedLocation] = useState('Clinic');
	const [showEndForm, setShowEndForm] = useState(false);
	const [chiefComplaint, setChiefComplaint] = useState('');
	const [error, setError] = useState('');

	const [settingsOpen, setSettingsOpen] = useState(false);
	const [settingsSection, setSettingsSection] = useState<
		'keyboard' | 'connections' | 'account'
	>('account');

	useEffect(() => {
		const handler = () => {
			setSettingsSection('account');
			setSettingsOpen(true);
		};
		document.addEventListener('mediflow:open-settings', handler);
		return () =>
			document.removeEventListener('mediflow:open-settings', handler);
	}, []);

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

	const handleStartSession = async () => {
		const patientId = location.pathname.split('/')[2];
		try {
			const data = await createVisit({
				patientId,
				body: {
					patient_serial_number: patientId,
					visit_type: selectedType as VisitType,
					location: selectedLocation as VisitLocation,
					status: 'in-progress',
					chief_complaint: '',
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

	const handleConfirmEnd = async () => {
		if (chiefComplaint.trim() === '') {
			setError('Main complaint cannot be empty');
			return;
		}

		const elapsedSeconds = session
			? Math.floor((Date.now() - session.startTime) / 1000)
			: 0;

		const sessionData = {
			duration_minutes: secondsToRoundedMinutes(elapsedSeconds),
			chief_complaint: chiefComplaint,
			status: 'completed' as VisitStatus,
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

	return (
		<header className='app-header'>
			{isMobile ? (
				<button
					type='button'
					className='app-header__icon-btn'
					onClick={onOpenDrawer}
					aria-label='Open navigation'
				>
					<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
						<path
							d='M4 7h16M4 12h16M4 17h16'
							stroke='currentColor'
							strokeWidth='1.8'
							strokeLinecap='round'
						/>
					</svg>
				</button>
			) : (
				<button
					type='button'
					className='app-header__icon-btn'
					onClick={() => dispatch(toggleSidebar())}
					aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				>
					<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
						<rect
							x='3'
							y='4.5'
							width='18'
							height='15'
							rx='2.5'
							stroke='currentColor'
							strokeWidth='1.7'
						/>
						<path d='M9 4.5v15' stroke='currentColor' strokeWidth='1.7' />
						<path
							d={
								sidebarCollapsed
									? 'M13 9.5l2.5 2.5L13 14.5'
									: 'M16 9.5l-2.5 2.5 2.5 2.5'
							}
							stroke='currentColor'
							strokeWidth='1.7'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</button>
			)}

			<div
				className={`app-header__right${
					showEndForm || showTypeSelect
						? ' app-header__right--expanded'
						: ''
				}`}
			>
				{session ? (
					showEndForm ? (
						<div className='app-header__end-form'>
							<div className='app-header__end-input'>
								<input
									type='text'
									className='field'
									placeholder='Main complaint…'
									value={chiefComplaint}
									onChange={(e) => {
										setChiefComplaint(e.target.value);
										if (error) setError('');
									}}
									autoFocus
								/>
								{error && (
									<span className='app-header__end-error'>{error}</span>
								)}
							</div>
							<button
								className='btn btn--outline btn--sm'
								onClick={handleCancelEnd}
							>
								Cancel
							</button>
							<button
								className='btn btn--primary btn--sm'
								onClick={handleConfirmEnd}
							>
								Save and end
							</button>
						</div>
					) : (
						<div className='app-header__session'>
							<span className='app-header__session-live' />
							<span className='app-header__session-type'>
								{session.type} · {session.location}
							</span>
							<SessionTimer startTime={session.startTime} />
							<button
								className='btn btn--danger-outline btn--sm app-header__end-btn'
								onClick={() => setShowEndForm(true)}
							>
								End session
							</button>
						</div>
					)
				) : (
					isPatientProfile &&
					(showTypeSelect ? (
						<div className='app-header__start-select'>
							<select
								className='field'
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
								className='field'
								value={selectedLocation}
								onChange={(e) => setSelectedLocation(e.target.value)}
							>
								{LOCATIONS.map((l) => (
									<option key={l.value} value={l.value}>
										{l.label}
									</option>
								))}
							</select>
							<button
								className='btn btn--outline btn--sm'
								onClick={handleCancelSelect}
							>
								Cancel
							</button>
							<button
								className='btn btn--primary btn--sm'
								onClick={handleStartSession}
							>
								Start timer
							</button>
						</div>
					) : (
						<button
							className='btn btn--primary btn--sm'
							onClick={() => setShowTypeSelect(true)}
						>
							Start session
						</button>
					))
				)}
			</div>

			<SettingsModal
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				defaultSection={settingsSection}
			/>
		</header>
	);
};
