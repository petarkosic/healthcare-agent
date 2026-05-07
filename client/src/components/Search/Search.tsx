import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/Auth/AuthProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { getInitials } from '../../utils/utils';
import { API_BASE } from '../../lib/api';
import type { TPatients } from '../../types/types';
import './Search.css';

export const Search = () => {
	const [query, setQuery] = useState('');
	const [result, setResult] = useState<TPatients | null>(null);
	const [loading, setLoading] = useState(false);
	const [notFound, setNotFound] = useState(false);

	const debouncedQuery = useDebounce(query.trim(), 600);
	const { doctorSerialNumber, token } = useAuth();
	const navigate = useNavigate();
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (!debouncedQuery) {
			setResult(null);
			setNotFound(false);
			setLoading(false);
			return;
		}

		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		const search = async () => {
			setLoading(true);
			setResult(null);
			setNotFound(false);

			try {
				const url = `${API_BASE}/api/patients/search?patient_serial_number=${encodeURIComponent(debouncedQuery)}&doctor_serial_number=${encodeURIComponent(doctorSerialNumber!)}`;

				const res = await fetch(url, {
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					signal: controller.signal,
				});

				if (!res.ok) throw new Error(`${res.status}`);

				const data: TPatients[] = await res.json();

				if (data.length > 0) {
					setResult(data[0]);
				} else {
					setNotFound(true);
				}
			} catch (err) {
				if (err instanceof Error && err.name !== 'AbortError') {
					setNotFound(true);
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		search();
	}, [debouncedQuery, doctorSerialNumber, token]);

	return (
		<div className='search-container'>
			<div className='search-input-wrapper'>
				<svg className='search-icon' viewBox='0 0 20 20' fill='currentColor'>
					<path
						fillRule='evenodd'
						d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
						clipRule='evenodd'
					/>
				</svg>
				<input
					type='text'
					className='search-input'
					placeholder='Search by patient serial number...'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				{loading && <span className='search-spinner' aria-label='Searching' />}
			</div>

			{notFound && !loading && (
				<div className='search-not-found'>
					No patient found with serial number "{debouncedQuery}"
				</div>
			)}

			{result && !loading && (
				<article
					className='patient-card search-result-card'
					onClick={() => navigate(`/patients/${result.patient_serial_number}`)}
				>
					<div className='identity'>
						<div className='avatar'>{getInitials(result.full_name)}</div>
						<div className='info'>
							<h3>{result.full_name}</h3>
							<span className='serial'>
								ID: #{result.patient_serial_number}
							</span>
						</div>
					</div>
					<div className='vitals'>
						<div>
							{result.age}y • {result.gender}
						</div>
					</div>
					<div className='stats'>
						<div className='stat-item'>
							<span className='stat-val'>{result.total_visits}</span>
							<span className='stat-lbl'>Visits</span>
						</div>
						<div className='stat-item'>
							<span className='stat-val'>
								{result.active_medications_count}
							</span>
							<span className='stat-lbl'>Active Meds</span>
						</div>
						<div className='last-visit'>
							Last Visit:{' '}
							{new Date(result.last_visit_date).toLocaleDateString()}
						</div>
					</div>
				</article>
			)}
		</div>
	);
};
