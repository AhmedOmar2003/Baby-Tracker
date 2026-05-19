export default function GlobalLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '4px solid rgba(54,64,206,0.15)',
        borderTopColor: 'var(--main-color, #3640ce)',
        animation: 'spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
