import { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { ensureGoogleConnected } from '../../store/googleCalendarSlice';
import './SettingsModal.css';

type Section = 'keyboard' | 'connections' | 'account';

const SECTIONS: { id: Section; label: string }[] = [
	{ id: 'keyboard', label: 'Keyboard Shortcuts' },
	{ id: 'connections', label: 'Connections' },
	{ id: 'account', label: 'Account' },
];

const SHORTCUTS = [
	{ keys: ['?'], description: 'Open Settings' },
	{ keys: ['N'], description: 'New patient' },
	{ keys: ['/'], description: 'Focus search' },
	{ keys: ['Esc'], description: 'Close modal' },
];

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	defaultSection?: Section;
}

export const SettingsModal = ({
	isOpen,
	onClose,
	defaultSection = 'keyboard',
}: SettingsModalProps) => {
	const [activeSection, setActiveSection] = useState<Section>(defaultSection);
	const dispatch = useAppDispatch();
	const { doctorName, doctorSerialNumber } = useAppSelector(
		(state) => state.auth,
	);
	const connected = useAppSelector((state) => state.googleCalendar.connected);
	const [copied, setCopied] = useState(false);
	const [connecting, setConnecting] = useState(false);

	useEffect(() => {
		if (isOpen) setActiveSection(defaultSection);
	}, [isOpen, defaultSection]);

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};

		document.addEventListener('keydown', handler);

		return () => document.removeEventListener('keydown', handler);
	}, [isOpen, onClose]);

	const copySerial = useCallback(() => {
		if (!doctorSerialNumber) return;

		navigator.clipboard.writeText(doctorSerialNumber);
		setCopied(true);

		setTimeout(() => setCopied(false), 2000);
	}, [doctorSerialNumber]);

	const handleConnect = async () => {
		setConnecting(true);

		try {
			await dispatch(ensureGoogleConnected()).unwrap();
		} finally {
			setConnecting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className='settings-overlay' onClick={onClose}>
			<div
				className='settings-modal'
				onClick={(e) => e.stopPropagation()}
				role='dialog'
				aria-modal='true'
				aria-label='Settings'
			>
				<div className='settings-modal-header'>
					<span className='settings-modal-title'>Settings</span>
					<button
						className='settings-close'
						onClick={onClose}
						aria-label='Close settings'
					>
						×
					</button>
				</div>

				<div className='settings-modal-body'>
					<nav className='settings-nav'>
						{SECTIONS.map((s) => (
							<button
								key={s.id}
								className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`}
								onClick={() => setActiveSection(s.id)}
							>
								{s.label}
							</button>
						))}
					</nav>

					<div className='settings-content'>
						{activeSection === 'keyboard' && (
							<div className='settings-section'>
								<h2 className='settings-section-title'>Keyboard Shortcuts</h2>
								<p className='settings-section-sub'>
									Shortcuts are disabled when focus is inside an input field.
								</p>
								<table className='shortcuts-table'>
									<thead>
										<tr>
											<th>Key</th>
											<th>Action</th>
										</tr>
									</thead>
									<tbody>
										{SHORTCUTS.map((s) => (
											<tr key={s.description}>
												<td>
													{s.keys.map((k) => (
														<kbd key={k} className='kbd'>
															{k}
														</kbd>
													))}
												</td>
												<td className='shortcut-desc'>{s.description}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{activeSection === 'connections' && (
							<div className='settings-section'>
								<h2 className='settings-section-title'>Connections</h2>
								<p className='settings-section-sub'>
									Connect external services to extend HealthAgent.
								</p>

								<div className='connection-item'>
									<div className='connection-info'>
										<div className='connection-name'>Google Calendar</div>
										<div className='connection-desc'>
											Schedule follow-up appointments directly from patient
											recommendations.
										</div>
									</div>
									<div className='connection-action'>
										{connected ? (
											<span className='connection-badge connected'>
												Connected
											</span>
										) : (
											<button
												className='btn-connect'
												onClick={handleConnect}
												disabled={connecting}
											>
												{connecting ? 'Connecting…' : 'Connect'}
											</button>
										)}
									</div>
								</div>
							</div>
						)}

						{activeSection === 'account' && (
							<div className='settings-section'>
								<h2 className='settings-section-title'>Account</h2>
								<p className='settings-section-sub'>
									Your doctor profile information.
								</p>

								<div className='account-field'>
									<span className='account-label'>Name</span>
									<span className='account-value'>{doctorName ?? '—'}</span>
								</div>

								<div className='account-field'>
									<span className='account-label'>Serial Number</span>
									<div className='account-serial-row'>
										<span className='account-serial'>
											{doctorSerialNumber ?? '—'}
										</span>
										<button
											className='btn-copy'
											onClick={copySerial}
											disabled={!doctorSerialNumber}
										>
											{copied ? 'Copied!' : 'Copy'}
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
