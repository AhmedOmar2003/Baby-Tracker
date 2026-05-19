'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './WelcomeOverlay.css';

/**
 * WelcomeOverlay
 * @param {string}   name      — user's first name
 * @param {boolean}  isSignup  — true = "Account created", false = "Welcome back"
 * @param {function} onDone    — called after the overlay finishes (redirect here)
 */
export default function WelcomeOverlay({ name, isSignup = false, onDone }) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const dismiss = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onDone?.(), 350);
  };

  // Auto-dismiss after 2.5s
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(dismiss, 2500);
    return () => clearTimeout(t);
  }, [mounted]);

  if (!mounted) return null;

  const firstName = name ? name.split(' ')[0] : 'there';

  return createPortal(
    <div
      className={`wo-overlay${leaving ? ' wo-leaving' : ''}`}
      onClick={dismiss}
    >
      <div className="wo-card" onClick={(e) => e.stopPropagation()}>
        <div className="wo-blob" />

        {/* Animated checkmark */}
        <svg className="wo-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle className="wo-circle-bg"   cx="40" cy="40" r="35" />
          <circle className="wo-circle-anim" cx="40" cy="40" r="35" />
          <polyline className="wo-check" points="24,40 35,52 56,28" />
        </svg>

        {/* Title */}
        <h2 className="wo-title">
          {isSignup
            ? <>Welcome aboard,{' '}<span className="wo-name">{firstName}!</span></>
            : <>Welcome back,{' '}<span className="wo-name">{firstName}!</span></>
          }
        </h2>

        {/* Subtitle */}
        <p className="wo-subtitle">
          {isSignup
            ? "Your account has been created successfully. Let's get started! 🎉"
            : "You're logged in successfully. Great to see you again! 👋"
          }
        </p>

        <p className="wo-hint">Tap anywhere to continue</p>

        {/* Progress countdown */}
        <div className="wo-progress-bar" />
      </div>
    </div>,
    document.body
  );
}
