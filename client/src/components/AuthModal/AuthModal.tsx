import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { API_BASE, apiFetch } from '../../lib/api';
import { useAuth } from '../../context/Auth/AuthProvider';
import './AuthModal.css';

type View = 'signin' | 'signup';

interface SignUpSuccess {
	serialNumber: string;
}

export const AuthModal = () => {
	const { isModalOpen, closeModal, login } = useAuth();
	const navigate = useNavigate();
	const [view, setView] = useState<View>('signin');
	const [signUpSuccess, setSignUpSuccess] = useState<SignUpSuccess | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const overlayRef = useRef<HTMLDivElement>(null);

	// Sign up fields
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [specialty, setSpecialty] = useState('');
	const [licenseNumber, setLicenseNumber] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	// Sign in fields
	const [serialNumber, setSerialNumber] = useState('');
	const [loginPassword, setLoginPassword] = useState('');

	useEffect(() => {
		if (!isModalOpen) {
			setError('');
			setSignUpSuccess(null);
		}
	}, [isModalOpen]);

	const resetSignUpFields = () => {
		setFirstName('');
		setLastName('');
		setEmail('');
		setSpecialty('');
		setLicenseNumber('');
		setPassword('');
		setConfirmPassword('');
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) closeModal();
	};

	const switchView = (next: View) => {
		setView(next);
		setError('');
		setSignUpSuccess(null);
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters');
			return;
		}

		setLoading(true);
		try {
			const res = await apiFetch(`${API_BASE}/api/auth/signup`, {
				method: 'POST',
				body: JSON.stringify({
					first_name: firstName,
					last_name: lastName,
					email,
					specialty,
					license_number: licenseNumber,
					password,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.detail ?? 'Sign up failed');
				return;
			}

			await navigator.clipboard.writeText(data.doctor_serial_number);
			setSignUpSuccess({ serialNumber: data.doctor_serial_number });
			resetSignUpFields();
		} catch {
			setError('Network error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await apiFetch(`${API_BASE}/api/auth/login`, {
				method: 'POST',
				body: JSON.stringify({
					serial_number: serialNumber,
					password: loginPassword,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				if (res.status === 429) {
					setError('Too many attempts. Please wait a minute before trying again.');
				} else {
					setError(data.detail ?? 'Sign in failed');
				}
				return;
			}

			login(data.doctor_serial_number, data.doctor_name);
			closeModal();
			navigate('/patients');
		} catch {
			setError('Network error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (!isModalOpen) return null;

	return (
		<div
			className='modal-overlay'
			ref={overlayRef}
			onClick={handleOverlayClick}
		>
			<div className='modal-card'>
				<button className='modal-close' onClick={closeModal} aria-label='Close'>
					✕
				</button>

				<div className='modal-tabs'>
					<button
						className={`modal-tab ${view === 'signin' ? 'active' : ''}`}
						onClick={() => switchView('signin')}
					>
						Sign In
					</button>
					<button
						className={`modal-tab ${view === 'signup' ? 'active' : ''}`}
						onClick={() => switchView('signup')}
					>
						Sign Up
					</button>
				</div>

				{view === 'signup' ? (
					signUpSuccess ? (
						<div className='signup-success'>
							<h3>Account created!</h3>
							<p>
								Save your serial number — you'll use it to sign in. It has been
								copied to your clipboard.
							</p>
							<div className='serial-display'>
								<div className='serial-label'>Your Serial Number</div>
								<div className='serial-number'>
									{signUpSuccess.serialNumber}
								</div>
								<div className='serial-copied'>✓ Copied to clipboard</div>
							</div>
							<button
								className='modal-submit'
								style={{ width: '100%' }}
								onClick={() => switchView('signin')}
							>
								Proceed to Sign In
							</button>
						</div>
					) : (
						<form className='modal-form' onSubmit={handleSignUp}>
							<div className='form-row'>
								<div className='form-field'>
									<label htmlFor='firstName'>First Name</label>
									<input
										id='firstName'
										type='text'
										required
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
									/>
								</div>
								<div className='form-field'>
									<label htmlFor='lastName'>Last Name</label>
									<input
										id='lastName'
										type='text'
										required
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
									/>
								</div>
							</div>

							<div className='form-field'>
								<label htmlFor='email'>Email</label>
								<input
									id='email'
									type='email'
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>

							<div className='form-field'>
								<label htmlFor='specialty'>Specialty</label>
								<input
									id='specialty'
									type='text'
									required
									placeholder='e.g. Cardiology'
									value={specialty}
									onChange={(e) => setSpecialty(e.target.value)}
								/>
							</div>

							<div className='form-field'>
								<label htmlFor='licenseNumber'>License Number</label>
								<input
									id='licenseNumber'
									type='text'
									required
									value={licenseNumber}
									onChange={(e) => setLicenseNumber(e.target.value)}
								/>
							</div>

							<div className='form-row'>
								<div className='form-field'>
									<label htmlFor='password'>Password</label>
									<input
										id='password'
										type='password'
										required
										minLength={8}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
								</div>
								<div className='form-field'>
									<label htmlFor='confirmPassword'>Confirm</label>
									<input
										id='confirmPassword'
										type='password'
										required
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
									/>
								</div>
							</div>

							{error && <div className='modal-error'>{error}</div>}

							<button type='submit' className='modal-submit' disabled={loading}>
								{loading ? 'Creating account…' : 'Create Account'}
							</button>

							<p className='modal-switch'>
								Already have an account?{' '}
								<button type='button' onClick={() => switchView('signin')}>
									Sign in
								</button>
							</p>
						</form>
					)
				) : (
					<form className='modal-form' onSubmit={handleSignIn}>
						<div className='form-field'>
							<label htmlFor='serialNumber'>Serial Number</label>
							<input
								id='serialNumber'
								type='text'
								required
								placeholder='e.g. D3xK9mPq'
								value={serialNumber}
								onChange={(e) => setSerialNumber(e.target.value)}
							/>
						</div>

						<div className='form-field'>
							<label htmlFor='loginPassword'>Password</label>
							<input
								id='loginPassword'
								type='password'
								required
								value={loginPassword}
								onChange={(e) => setLoginPassword(e.target.value)}
							/>
						</div>

						{error && <div className='modal-error'>{error}</div>}

						<button type='submit' className='modal-submit' disabled={loading}>
							{loading ? 'Signing in…' : 'Sign In'}
						</button>

						<p className='modal-switch'>
							<button
								type='button'
								onClick={() => {
									setSerialNumber('Dsn90mA2');
									setLoginPassword('123123123');
								}}
							>
								Sign in with default credentials
							</button>
							<br />
							<small>Testing purposes only</small>
						</p>

						<p className='modal-switch'>
							Don't have an account?{' '}
							<button type='button' onClick={() => switchView('signup')}>
								Sign up
							</button>
						</p>
					</form>
				)}
			</div>
		</div>
	);
};
