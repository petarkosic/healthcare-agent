import { Spinner } from './Spinner';
import './Spinner.css';

type PageLoaderProps = { label?: string };

export const PageLoader = ({ label = 'Loading…' }: PageLoaderProps) => (
	<div className="page-loader">
		<Spinner size="lg" />
		<p>{label}</p>
	</div>
);
