import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function getSessionId(): string {
  const KEY = 'wexa_session_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 's_' + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export default function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const track = () => {
      try {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: location.pathname + location.search,
            sessionId: getSessionId(),
            referrer: document.referrer || undefined,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    };

    track();
  }, [location.pathname, location.search]);

  return null;
}
