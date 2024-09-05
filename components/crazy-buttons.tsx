export default function CrazyButtons({
  setIsChatOpen
}: {
  setIsChatOpen: (open: boolean) => void
}) {
  const buttonStyle = {
    position: 'fixed',
    right: '2vh',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#34B7F1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    zIndex: 1000,
    fontSize: '24px'
  }
  return (
    <div>
      <div
        style={{ ...buttonStyle, bottom: '55vh' }}
        onClick={() => setIsChatOpen(true)}
      >
        📅
      </div>
      <div
        style={{ ...buttonStyle, bottom: '45vh' }}
        onClick={() => setIsChatOpen(true)}
      >
        🏆
      </div>
      <div
        style={{ ...buttonStyle, bottom: '35vh' }}
        onClick={() => setIsChatOpen(true)}
      >
        🎁
      </div>
      <div
        style={{ ...buttonStyle, bottom: '25vh' }}
        onClick={() => setIsChatOpen(true)}
      >
        📖
      </div>
      <div
        style={{ ...buttonStyle, bottom: '15vh' }}
        onClick={() => setIsChatOpen(true)}
      >
        📞
      </div>
      <div
        style={{ ...buttonStyle, bottom: '5vh' }}
        onClick={() => setIsChatOpen(true)}
      >
        💬
      </div>
    </div>
  )
}
