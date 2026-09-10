const STACK = [
	'React 19',
	'TypeScript',
	'Redux Toolkit',
	'RTK Query',
	'Vite',
	'FastAPI',
	'Python',
	'PostgreSQL',
	'Alembic',
	'OpenAI',
	'RAG · Chroma',
	'Pydantic guardrails',
	'Langfuse',
	'Google Calendar API',
	'Docker',
	'AWS',
];

const GithubIcon = () => (
	<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
		<path d='M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.79-4.57 5.04.36.32.68.95.68 1.92l-.01 2.85c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z' />
	</svg>
);

export const BuiltWith = () => (
	<section className='lp-tech' id='tech'>
		<div className='lp-wrap lp-tech-grid'>
			<div>
				<span className='lp-eyebrow'>Built with</span>
				<h2>A working AI product, end to end.</h2>
				<p>
					MediFlow is a full clinical workflow app with a retrieval-grounded
					assistant, output guardrails, and observability, deployed on a
					low-cost AWS setup.
				</p>
				<div className='lp-tech-links'>
					<a
						href='https://github.com/petarkosic/healthcare-agent'
						target='_blank'
						rel='noreferrer'
					>
						<GithubIcon />
						Source on GitHub
					</a>
				</div>
			</div>
			<div className='lp-stack'>
				{STACK.map((s) => (
					<span key={s}>{s}</span>
				))}
			</div>
		</div>
	</section>
);
