import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'

const navLinks = [
  { label: 'How it Works', href: '#how-it-works', id: 'how-it-works' },
  { label: 'Features', href: '#features', id: 'features' },
  { label: 'Become a Partner', href: '#partners', id: 'partners' },
  { label: 'Why Xendbox', href: '#features', id: 'features' },
]

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function scrollToWaitlist() {
  const el = document.getElementById('waitlist')
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`transition-all duration-300 ${
          scrolled
            ? 'bg-dark/90 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
              <a href="#" className="flex items-center gap-2">
                <img src="/logo.jpeg" alt="Xendbox" className="h-8 w-8 rounded-lg object-cover" />
                <span className="text-lg font-bold text-white">Xendbox</span>
              </a>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={scrollToWaitlist}
                className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25"
              >
                Join the waitlist
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={scrollToWaitlist}
                className="bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                Join
              </button>
              <button
                onClick={() => setOpen(!open)}
                className="p-2 text-gray-400 hover:text-white"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-dark/95 backdrop-blur-xl border-b border-white/5"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      setOpen(false)
                      setTimeout(() => scrollToSection(link.id), 200)
                    }}
                    className="block text-left w-full text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-4 space-y-3">
                  <button
                    className="w-full bg-brand-500 text-white px-5 py-3 rounded-xl text-sm font-semibold"
                    onClick={() => { scrollToWaitlist(); setOpen(false) }}
                  >
                    Join the waitlist
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  )
}
