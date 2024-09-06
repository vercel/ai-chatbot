const Message = ({ key, message }: { key: number; message: any }) => {
  return (
    <div
      key={key}
      className={`p-2 flex 
        justify-${message.role === 'user' ? 'end' : 'start'}
        `}
    >
      <div
        className={`p-2 flex rounded-t-lg
        ${
          message.role === 'user'
            ? 'rounded-bl-lg bg-slate-900 text-white'
            : 'rounded-br-lg bg-slate-100 text-black'
        }
        text-balance
        `}
        style={{
          display: 'inline-block',
          maxWidth: '75%'
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
export default Message
