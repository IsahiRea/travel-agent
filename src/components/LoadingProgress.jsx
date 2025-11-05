import './LoadingProgress.css';

const STAGE_INFO = {
  initializing: {
    label: 'Initializing',
    icon: '⏳',
    description: 'Setting up your trip...'
  },
  weather: {
    label: 'Weather',
    icon: '🌤️',
    description: 'Checking weather conditions'
  },
  flights: {
    label: 'Flights',
    icon: '✈️',
    description: 'Finding best flights'
  },
  hotels: {
    label: 'Hotels',
    icon: '🏨',
    description: 'Searching hotels'
  },
  ai: {
    label: 'Itinerary',
    icon: '✨',
    description: 'Creating your personalized itinerary'
  },
  complete: {
    label: 'Complete',
    icon: '✓',
    description: 'Your trip is ready!'
  }
};

const STAGES = ['initializing', 'weather', 'flights', 'hotels', 'ai', 'complete'];

/**
 * Loading progress indicator showing current stage of trip data loading
 * @param {Object} props
 * @param {string} props.currentStage - Current loading stage
 * @param {Object} props.streamingProgress - Partial data from streaming AI
 */
export default function LoadingProgress({ currentStage, streamingProgress }) {
  const currentStageIndex = STAGES.indexOf(currentStage);
  const info = STAGE_INFO[currentStage] || STAGE_INFO.initializing;

  // Show streaming progress if available
  const isStreaming = currentStage === 'ai' && streamingProgress;
  const streamingMessage = isStreaming && streamingProgress.summary
    ? 'Generating itinerary in real-time...'
    : info.description;

  return (
    <div className="loading-progress">
      <div className="loading-header">
        <div className="loading-icon">{info.icon}</div>
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
        {STAGES.filter(stage => stage !== 'initializing').map((stage) => {
          const stageIndex = STAGES.indexOf(stage);
          const isComplete = stageIndex < currentStageIndex;
          const isActive = stage === currentStage;
          const stageInfo = STAGE_INFO[stage];

          return (
            <div
              key={stage}
              className={`progress-stage ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="stage-icon">
                {isComplete ? '✓' : stageInfo.icon}
              </div>
              <span className="stage-label">{stageInfo.label}</span>
            </div>
          );
        })}
      </div>

      <div className="loading-bar-container">
        <div
          className="loading-bar"
          style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
        />
      </div>

      {currentStage === 'ai' && (
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
