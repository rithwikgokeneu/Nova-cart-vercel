import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

const QUICK_ACTIONS = [
  { label: '🔍 Find products', message: 'What products do you have available?' },
  { label: '📦 My orders', message: 'Show me my recent orders' },
  { label: '🏷️ Categories', message: 'What categories do you sell?' },
  { label: '🚚 Shipping info', message: 'What are your shipping options and costs?' },
  { label: '↩️ Returns', message: 'What is your return policy?' },
]

export default function Chatbot() {
  const { user, loading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi there! 👋 I'm NovaBot, your Nova Cart assistant.\n\nI can help you find products, check your orders, or answer any shopping questions. What can I do for you?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  if (authLoading) return null

  const send = async (text) => {
    const msg = text || input
    if (!msg.trim() || loading) return
    setShowChips(false)
    const userMsg = { role: 'user', content: msg }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      const { data } = await API.post('/api/chatbot/message', {
        message: msg,
        conversationHistory: messages.slice(-8)
      })
      setMessages([...history, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Sorry, I\'m having trouble right now. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  // Parse bold **text** in responses
  const formatMessage = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div
          className="mb-4 bg-white rounded-2xl flex flex-col overflow-hidden"
          style={{ width: '340px', height: '500px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--primary-color)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
              <div>
                <p className="font-semibold text-white text-sm">NovaBot</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  <p className="text-white/70 text-xs">Online</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: '#fafafa' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs mr-2 mt-1" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                    🤖
                  </div>
                )}
                <div
                  className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? { backgroundColor: 'var(--primary-color)', color: '#fff', borderBottomRightRadius: '4px' }
                    : { backgroundColor: '#fff', color: 'var(--heading-color)', borderBottomLeftRadius: '4px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  }
                >
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{formatMessage(line)}{j < msg.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick action chips — shown after first assistant message */}
            {showChips && messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => send(a.message)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:shadow-sm"
                    style={{ backgroundColor: 'var(--light-cyan)', color: 'var(--primary-color)', border: '1px solid rgba(0,61,41,0.15)' }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs mr-2" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>🤖</div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm">
                  <div className="flex space-x-1 items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white" style={{ borderTop: '1px solid #f0f0f0' }}>
            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2" style={{ border: '1px solid #e5e7eb' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--heading-color)' }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        {open
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  )
}
