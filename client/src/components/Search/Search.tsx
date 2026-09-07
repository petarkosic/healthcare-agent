import {
	useState,
	useRef,
	forwardRef,
	useImperativeHandle,
	useEffect,
} from 'react';
import { useNavigate } from 'react-router';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDateOnly, getInitials } from '../../utils/utils';
import { useSearchPatientsQuery } from '../../store/api/patientsApi';
import { useAppSelector } from '../../store/hooks';
import './Search.css';

export interface SearchHandle {
	focus(): void;
}

type SearchProps = {
	/** Locked while a session is running — a search could navigate away. */
	disabled?: boolean;
};

export const Search = forwardRef<SearchHandle, SearchProps>(
	({ disabled = false }, ref) => {
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

			return () =>
				document.removeEventListener('mediflow:focus-search', handler);
		}, []);

		const { data, isFetching, isError } = useSearchPatientsQuery(
			debouncedQuery,
			{ skip: !debouncedQuery || disabled },
		);

		const result =
			!disabled && debouncedQuery ? (data?.[0] ?? null) : null;
		const notFound =
			!disabled &&
			!isFetching &&
			!!debouncedQuery &&
			(isError || (data && data.length === 0));

		const isLocked =
			!!result &&
			!!session &&
			session.patientSerialNumber !== String(result.patient_serial_number);

		const handleResultClick = () => {
			if (!result || isLocked) return;

			navigate(`/patients/${result.patient_serial_number}`);
		};

		return (
			<div className='search'>
				<div
					className={`search__field${disabled ? ' search__field--disabled' : ''}`}
				>
					<svg
						className='search__icon'
						viewBox='0 0 20 20'
						fill='currentColor'
						aria-hidden='true'
					>
						<path
							fillRule='evenodd'
							d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
							clipRule='evenodd'
						/>
					</svg>
					<input
						ref={inputRef}
						type='text'
						className='search__input'
						placeholder={
							disabled
								? 'End the current session to search'
								: 'Search by patient serial number…'
						}
						value={disabled ? '' : query}
						onChange={(e) => setQuery(e.target.value)}
						disabled={disabled}
					/>
					{isFetching && !disabled && (
						<span className='search__spinner' aria-label='Searching' />
					)}
				</div>

				{notFound && (
					<div className='search__not-found'>
						No patient found with serial number &ldquo;{debouncedQuery}
						&rdquo;
					</div>
				)}

				{result && !isFetching && (
					<article
						className={`patient-card search__result-card${isLocked ? ' patient-card--locked' : ''}`}
						data-locked-tip={
							isLocked
								? 'Session in progress — end current session first'
								: undefined
						}
						onClick={handleResultClick}
					>
						<div className='identity'>
							<div className='patient-card__avatar'>
								{getInitials(result.full_name)}
							</div>
							<div>
								<div className='patient-card__name'>
									{result.full_name}
								</div>
								<div className='patient-card__sub'>
									<span className='u-mono'>
										#{result.patient_serial_number}
									</span>
									<span className='patient-card__sep' />
									<span>
										{result.age}y &middot; {result.gender}
									</span>
								</div>
							</div>
						</div>

						<div className='patient-card__stats'>
							<div className='patient-card__stat'>
								<div className='patient-card__stat-n u-mono'>
									{result.total_visits}
								</div>
								<div className='patient-card__stat-k'>Visits</div>
							</div>
							<div className='patient-card__stat'>
								<div className='patient-card__stat-n u-mono'>
									{result.active_medications_count}
								</div>
								<div className='patient-card__stat-k'>Active meds</div>
							</div>
							<div className='patient-card__stat patient-card__stat--wide'>
								<div className='patient-card__stat-n u-mono'>
									{formatDateOnly(result.last_visit_date)}
								</div>
								<div className='patient-card__stat-k'>Last visit</div>
							</div>
						</div>
					</article>
				)}
			</div>
		);
	},
);

Search.displayName = 'Search';
