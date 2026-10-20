'use client';

import { useEffect, useRef, useState } from 'react';

const SPLASH_SEEN_KEY = 'makao254_splash_seen';
const FADE_IN_MS = 600;
const HOLD_MS = 800;
const FADE_OUT_MS = 600;

export default function Splash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const beginExit = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      } catch {
        // ignore quota/private-mode errors
      }
    }
    setExiting(true);
    const t = setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, FADE_OUT_MS);
    timersRef.current.push(t);
  };

  const handleSkip = () => {
    if (!visible || exiting) return;
    clearTimers();
    beginExit();
  };

  useEffect(() => {
    let alreadySeen = false;
    if (typeof window !== 'undefined') {
      try {
        alreadySeen = sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
      } catch {
        alreadySeen = false;
      }
    }

    if (alreadySeen) {
      return;
    }

    setVisible(true);

    const t1 = setTimeout(() => {
      beginExit();
    }, FADE_IN_MS + HOLD_MS);
    timersRef.current.push(t1);

    return () => {
      clearTimers();
    };
  }, []);

  const overlayClass = [
    'splash-overlay',
    exiting ? 'splash-exiting' : '',
    !visible && !exiting ? 'splash-hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {children}
      {visible && (
        <div className={overlayClass} aria-hidden={exiting ? 'true' : 'false'}>
          <button
            type="button"
            onClick={handleSkip}
            className="splash-skip min-h-11 min-w-11"
            aria-label="Skip splash screen"
          >
            Skip
          </button>
          <div className="splash-content">
            <div className="splash-brand-mark" aria-hidden="true">
              M
            </div>
            <div className="splash-wordmark">
              Makao&nbsp;<span className="splash-number">254</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
