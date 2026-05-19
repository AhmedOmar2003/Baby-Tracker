'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '4rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--section-head-color)', margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--text-color)', maxWidth: 400, margin: 0 }}>
        An unexpected error occurred. Please try again or go back to the home page.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.7rem 1.75rem',
            background: 'var(--gradient-primary, #3640ce)',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.7rem 1.75rem',
            background: 'transparent',
            color: 'var(--main-color, #3640ce)',
            border: '2px solid var(--main-color, #3640ce)',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
