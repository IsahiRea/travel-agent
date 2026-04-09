import Icon from './Icon';
import '../styles/components/LoadingProgress.css';

const STAGE_INFO = {
  initializing: {
    label: 'Initializing',
    icon: 'hourglass',
    description: 'Setting up your trip...'
  },
  fetching: {
    label: 'Fetching Data',
    icon: 'hourglass',
    description: 'Loading weather, flights, and hotels...'
  },
  weather: {
    label: 'Weather',
    icon: 'weather',
    description: 'Checking weather conditions'
  },
  flights: {
    label: 'Flights',
    icon: 'plane',
    description: 'Finding best flights'
  },
  hotels: {
    label: 'Hotels',
    icon: 'hotel',
    description: 'Searching hotels'
  },
  ai: {
    label: 'Itinerary',
    icon: 'sparkles',
    description: 'Creating your personalized itinerary'
  },
  complete: {
    label: 'Complete',
    icon: 'checkmark',
    description: 'Your trip is ready!'
  }
};

const DATA_SECTIONS = ['weather', 'flights', 'hotels'];

/**
 * Loading progress indicator showing current stage of trip data loading
 * @param {Object} props
 * @param {string} props.currentStage - Current loading stage
 * @param {Object} props.sections - Per-section status objects
 * @param {Object} props.streamingProgress - Partial data from streaming AI
 */
export default function LoadingProgress({ currentStage, sections, streamingProgress }) {
  const info = STAGE_INFO[currentStage] || STAGE_INFO.initializing;
  const isFetching = currentStage === 'fetching';
  const isAI = currentStage === 'ai';

  // Calculate overall progress
  let progress = 0;
  if (currentStage === 'fetching') {
    // Count completed data sections
    const completed = DATA_SECTIONS.filter(
      s => sections?.[s]?.status === 'success' || sections?.[s]?.status === 'error'
    ).length;
    progress = (completed / DATA_SECTIONS.length) * 50; // 0-50%
  } else if (currentStage === 'ai') {
    progress = 60;
  } else if (currentStage === 'complete') {
    progress = 100;
  }

  const isStreaming = isAI && streamingProgress;
  const streamingMessage = isStreaming && streamingProgress.summary
    ? 'Generating itinerary in real-time...'
    : info.description;

  return (
    <div className="loading-progress">
      <div className="loading-header">
        <div className="loading-icon">
          <Icon name={info.icon} size={32} color="#6b5d53" alt={info.label} />
        </div>
        <div className="loading-text">
          <h2 className="loading-title">{info.label}</h2>
          <p className="loading-description">{streamingMessage}</p>
          {isStreaming && (
            <div className="streaming-indicator">
              <span className="streaming-dot"></span>
              <span>Streaming updates...</span>
            </div>
          )}
        </div>
      </div>

      <div className="progress-stages">
        {/* Data fetching sections */}
        {DATA_SECTIONS.map((section) => {
          const sectionStatus = sections?.[section]?.status;
          const isComplete = sectionStatus === 'success';
          const isFailed = sectionStatus === 'error';
          const isActive = isFetching && sectionStatus === 'loading';
          const stageInfo = STAGE_INFO[section];

          return (
            <div
              key={section}
              className={`progress-stage ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''} ${isFailed ? 'failed' : ''}`}
            >
              <div className="stage-icon">
                <Icon
                  name={isComplete ? 'checkmark' : isFailed ? 'warning' : stageInfo.icon}
                  size={24}
                  color={isActive ? '#b5654d' : isFailed ? '#d4a574' : '#6b5d53'}
                  alt={stageInfo.label}
                />
              </div>
              <span className="stage-label">{stageInfo.label}</span>
            </div>
          );
        })}

        {/* AI stage */}
        <div
          className={`progress-stage ${currentStage === 'complete' ? 'complete' : ''} ${isAI ? 'active' : ''}`}
        >
          <div className="stage-icon">
            <Icon
              name={currentStage === 'complete' ? 'checkmark' : STAGE_INFO.ai.icon}
              size={24}
              color={isAI ? '#b5654d' : '#6b5d53'}
              alt={STAGE_INFO.ai.label}
            />
          </div>
          <span className="stage-label">{STAGE_INFO.ai.label}</span>
        </div>

        {/* Complete stage */}
        <div className={`progress-stage ${currentStage === 'complete' ? 'complete' : ''}`}>
          <div className="stage-icon">
            <Icon
              name={currentStage === 'complete' ? 'checkmark' : STAGE_INFO.complete.icon}
              size={24}
              color="#6b5d53"
              alt={STAGE_INFO.complete.label}
            />
          </div>
          <span className="stage-label">{STAGE_INFO.complete.label}</span>
        </div>
      </div>

      <div className="loading-bar-container">
        <div
          className="loading-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {isAI && (
        <div className="loading-note">
          <p>
            This typically takes 10-15 seconds as we analyze weather patterns,
            compare hundreds of options, and create a personalized itinerary just for you.
          </p>
        </div>
      )}
    </div>
  );
}
