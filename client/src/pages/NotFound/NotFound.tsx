import { Link } from 'react-router';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './NotFound.css';

const NotFound = () => {
	useDocumentTitle('Not found');

	return (
		<div className="not-found">
			<div className="not-found__mark">
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M12 8v5"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
					/>
					<circle cx="12" cy="16.5" r="1" fill="currentColor" />
					<path
						d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
						stroke="currentColor"
						strokeWidth="1.6"
						strokeLinejoin="round"
					/>
				</svg>
			</div>
			<p className="not-found__code u-mono">404</p>
			<h1 className="not-found__title">We couldn&rsquo;t find that page.</h1>
			<p className="not-found__body">
				The link may be broken, or the page may have moved.
			</p>
			<div className="not-found__actions">
				<Link to="/dashboard" className="btn btn--primary">
					Back to dashboard
				</Link>
				<Link to="/patients" className="btn btn--outline">
					View patients
				</Link>
			</div>
		</div>
	);
};

export default NotFound;
