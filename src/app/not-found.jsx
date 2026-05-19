import Link from 'next/link';

function NotFound() {
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
      <h1 style={{ fontSize: '6rem', fontWeight: 'bold', color: 'var(--main-color)', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--section-head-color)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-color)', maxWidth: '400px' }}>
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          backgroundColor: 'var(--main-color)',
          color: '#fff',
          borderRadius: 'var(--radius-full)',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '1rem',
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
