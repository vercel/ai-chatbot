import ReactMarkdown from 'react-markdown'

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
            ? 'rounded-bl-lg bg-neutral-900 text-neutral-100 dark:bg-neutral-800 dark:text-neutral-100'
            : 'rounded-br-lg bg-neutral-100 text-neutral-900'
        }
        text-balance
        `}
        style={{
          display: 'inline-block',
          maxWidth: '75%'
        }}
      >
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  )
}
export default Message
