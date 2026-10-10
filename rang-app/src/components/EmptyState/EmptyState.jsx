import './EmptyState.css';

export function EmptyState({ type = 'no-results', onAction }) {
  const configs = {
    'no-results': {
      icon: '🔍',
      title: 'No stories found for that search.',
      description: 'Try a broader term or clear one of your filters.',
      actionLabel: 'Clear filters',
    },
    'no-stories': {
      icon: '📡',
      title: 'Stories are on their way.',
      description: 'The feed is being prepared. Check back shortly for the latest healthcare developments.',
      actionLabel: null,
    },
    'no-country': {
      icon: '🌎',
      title: 'No matching stories currently available.',
      description: 'There are no stories matching your selected country filter right now. Try viewing all news or check back later.',
      actionLabel: 'View all news',
    },
  };

  const config = configs[type] || configs['no-results'];

  return (
    <div className="empty-state" role="status">
      <span className="empty-state__icon" aria-hidden="true">{config.icon}</span>
      <h3 className="empty-state__title">{config.title}</h3>
      <p className="empty-state__description">{config.description}</p>
      {config.actionLabel && onAction && (
        <button className="empty-state__action" onClick={onAction}>
          {config.actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon" aria-hidden="true">⚠️</div>
      <h3 className="error-state__title">The feed couldn't refresh.</h3>
      <p className="error-state__description">
        Your previously loaded stories are still available. Try again in a moment.
      </p>
      {onRetry && (
        <button className="error-state__action" onClick={onRetry}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Try again
        </button>
      )}
    </div>
  );
}
