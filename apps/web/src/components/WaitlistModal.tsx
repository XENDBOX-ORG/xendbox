import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, CheckCircle, Loader2 } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useWaitlist } from '@/contexts/WaitlistContext'
import { Button } from '@/components/ui/button'

export function WaitlistModal() {
  const { open, setOpen } = useWaitlist()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      await addDoc(collection(db, 'waitlist'), {
        email: email.trim(),
        createdAt: serverTimestamp(),
      })
      setStatus('success')
      setEmail('')

      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/email/waitlist/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => {})
    } catch (e) {
      console.error('Waitlist submission error:', e)
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-dark border border-white/10 p-8 shadow-2xl dark:bg-white dark:border-gray-200"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>

              {status === 'success' ? (
                <div className="text-center py-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
                    <CheckCircle className="h-7 w-7 text-brand-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-2">
                    You're on the list!
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    We'll notify you when Zendbox launches.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
                    <Mail className="h-7 w-7 text-brand-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-2 text-center">
                    Join the Waitlist
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-600 mb-6 text-center">
                    Be the first to know when we launch in your area.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all dark:bg-gray-100 dark:border-gray-300 dark:text-gray-900 dark:placeholder-gray-400"
                    />
                    {status === 'error' && (
                      <p className="text-sm text-red-400">{errorMsg}</p>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Join Waitlist'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
