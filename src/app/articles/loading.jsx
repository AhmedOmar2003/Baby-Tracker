export default function ArticlesLoading() {
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ height: 32, width: 180, background: '#f1f5f9', borderRadius: 8, marginBottom: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 15px rgba(54,64,206,0.05)' }}>
            <div style={{ height: 180, background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ height: 18, background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 14, width: '90%', background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 14, width: '70%', background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
