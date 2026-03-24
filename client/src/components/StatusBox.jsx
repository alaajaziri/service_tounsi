import { useStatus } from '../contexts/StatusContext'

export default function StatusBox() {
  const { message, isError } = useStatus()
  
  if (!message) return null

  return (
    <div
      className={`fixed left-4 bottom-24 max-w-sm p-3.5 rounded-lg font-body text-sm z-50 border whitespace-pre-wrap ${
        isError
          ? 'bg-error/20 border-error/50 text-error'
          : 'bg-primary/20 border-primary/35 text-on-surface'
      }`}
    >
      {message}
    </div>
  )
}
