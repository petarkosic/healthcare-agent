import type {
	Recommendation,
	RecommendationsResponse,
	ResponseData,
} from '../../types/types';
import './SidebarRecommendations.css';

type SidebarRecommendationsProps = {
	data: ResponseData | null;
};

const isRecommendationsResponse = (
	data: ResponseData,
): data is RecommendationsResponse => {
	return 'recommendations' in data;
};

export const SidebarRecommendations = ({
	data,
}: SidebarRecommendationsProps) => {
	if (!data || !isRecommendationsResponse(data)) return null;

	return (
		<div className='recommendations-container'>
			<h4>Recommendations</h4>
			{data.recommendations?.map((item: Recommendation, index: number) => (
				<div className='recommendation-item' key={index}>
					<div className='recommendation-priority'>
						<div>
							Priority:{' '}
							<span className={`priority ${item.priority}`}>
								{item.priority}
							</span>
						</div>
					</div>
					<div className='recommendation-text'>
						<strong>{item.recommendation}</strong>
					</div>
					<div className='recommendation-reason'>
						<em>Reason: {item.reason}</em>
					</div>
				</div>
			))}
		</div>
	);
};
