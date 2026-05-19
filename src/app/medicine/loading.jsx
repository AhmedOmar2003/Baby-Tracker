export default function MedicineLoading() {
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ height: 32, width: 175, background: '#f1f5f9', borderRadius: 8, marginBottom: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 20, padding: '1.5rem', boxShadow: '0 4px 15px rgba(54,64,206,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ height: 100, background: '#f1f5f9', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 18, background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 14, width: '75%', background: '#f1f5f9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
