export default function ProfileLoading() {
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Sidebar skeleton */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 48, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        {/* Content skeleton */}
        <div style={{ flex: 1, minWidth: 0, background: 'white', borderRadius: 20, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 15px rgba(54,64,206,0.05)' }}>
          <div style={{ height: 28, width: 200, background: '#f1f5f9', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 52, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
