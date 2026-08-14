import { useState } from 'react'
import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { CheckCircle, Loader2 } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Gmail from '@thesvg/react/gmail'

export function CTA() {
  const { ref, isVisible } = useScrollReveal()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      await addDoc(collection(db, 'waitlist'), {
        email: email.trim(),
        createdAt: serverTimestamp(),
      })

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/email/waitlist/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) throw new Error('API request failed')

      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section ref={ref} className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/drone.jpg"
          alt="Delivery drone"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/20 via-dark/5 to-dark/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/10 via-transparent to-dark/5" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Ready to{' '}
            <span className="text-brand-500">Deliver Smarter</span>?
          </h2>

          <p className="mt-6 text-lg text-gray-300 max-w-lg mx-auto">
            Questions about your delivery, partnership, or the platform? Reach us any way you prefer.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 max-w-md mx-auto"
        >
          <div className="glass rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4">
              <Gmail className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              For business enquiries, partnership applications, and account issues that need a detailed response.
            </p>
            <a href="mailto:Xendboxafrica@gmail.com" className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-400 transition-colors font-semibold text-sm bg-brand-500/10 px-4 py-2 rounded-xl">
              Xendboxafrica@gmail.com
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 max-w-md mx-auto"
          id="waitlist"
        >
          <div className="glass rounded-2xl p-4 sm:p-6">
            {status === 'success' ? (
              <div className="flex items-center gap-3 py-2">
                <CheckCircle className="h-5 w-5 text-brand-400 shrink-0" />
                <span className="text-sm text-gray-300">You're on the list! We'll notify you when Xendbox launches.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="shrink-0 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-all whitespace-nowrap disabled:opacity-50"
                  >
                  {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Get Started'}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-400 mt-2">Something went wrong. Please try again.</p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
