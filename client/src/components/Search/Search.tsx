import {
	useState,
	useRef,
	forwardRef,
	useImperativeHandle,
	useEffect,
} from 'react';
import { useNavigate } from 'react-router';
import { useDebounce } from '../../hooks/useDebounce';
import { getInitials } from '../../utils/utils';
import { useSearchPatientsQuery } from '../../store/api/patientsApi';
import { useAppSelector } from '../../store/hooks';
import './Search.css';

export interface SearchHandle {
	focus(): void;
}

export const Search = forwardRef<SearchHandle, object>((_props, ref) => {
	const [query, setQuery] = useState('');
	const navigate = useNavigate();
	const session = useAppSelector((state) => state.session.session);
	const inputRef = useRef<HTMLInputElement>(null);

	const debouncedQuery = useDebounce(query.trim(), 1000);

	useImperativeHandle(ref, () => ({
		focus: () => inputRef.current?.focus(),
	}));

	useEffect(() => {
		const handler = () => inputRef.current?.focus();

		document.addEventListener('mediflow:focus-search', handler);

		return () => document.removeEventListener('mediflow:focus-search', handler);
	}, []);

	const { data, isFetching, isError } = useSearchPatientsQuery(debouncedQuery, {
		skip: !debouncedQuery,
	});

	const result = debouncedQuery ? (data?.[0] ?? null) : null;
	const notFound =
		!isFetching && !!debouncedQuery && (isError || (data && data.length === 0));

	const handleResultClick = () => {
		if (!result) return;

		if (
			session &&
			session.patientSerialNumber !== String(result.patient_serial_number)
		)
			return;

		navigate(`/patients/${result.patient_serial_number}`);
	};

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
					ref={inputRef}
					type='text'
					className='search-input'
					placeholder='Search by patient serial number...'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				{isFetching && (
					<span className='search-spinner' aria-label='Searching' />
				)}
			</div>

			{notFound && (
				<div className='search-not-found'>
					No patient found with serial number "{debouncedQuery}"
				</div>
			)}

			{result && !isFetching && (
				<article
					className={`patient-card search-result-card${session && session.patientSerialNumber !== String(result.patient_serial_number) ? ' patient-card--locked' : ''}`}
					data-locked-tip={
						session &&
						session.patientSerialNumber !== String(result.patient_serial_number)
							? 'Session in progress — end current session first'
							: undefined
					}
					onClick={handleResultClick}
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
});

Search.displayName = 'Search';
