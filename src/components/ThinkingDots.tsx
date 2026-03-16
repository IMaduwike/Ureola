export default function ThinkingDots() {
  return (
    <div style={{
      padding: '20px 0',
      borderBottom: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: '36px 1fr',
      gap: '0 16px',
      maxWidth: 760,
      margin: '0 auto',
      width: '100%',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
        fontFamily: "'Clash Display', sans-serif",
      }}>U</div>
      <div>
        <div style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
          textTransform: 'uppercase', marginBottom: 10,
          color: 'var(--accent)', opacity: 0.8,
        }}>Ureola</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <span key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'inline-block',
              animation: `tdot 1.4s ${delay}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes tdot {
            0%,80%,100% { opacity:0.2; transform:scale(0.75); }
            40% { opacity:1; transform:scale(1.1); }
          }
        `}</style>
      </div>
    </div>
  )
}
