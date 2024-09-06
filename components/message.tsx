const Message = ({ key, message }: { key: number; message: any }) => {
  return (
    <div
      key={key}
      style={{
        textAlign: message.role === 'user' ? 'right' : 'left',
        marginBottom: '8px',
        padding: '2px'
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '8px 12px',
          borderRadius: '20px',
          backgroundColor: message.role === 'user' ? '#DCF8C6' : '#E5E5EA',
          color: '#000',
          maxWidth: '75%',
          wordWrap: 'break-word'
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
export default Message
