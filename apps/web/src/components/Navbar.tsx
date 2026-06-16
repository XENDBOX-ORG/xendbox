import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useWaitlist } from '@/contexts/WaitlistContext'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Riders', href: '#riders' },
  { label: 'For Merchants', href: '#merchants' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const { setOpen: setWaitlistOpen } = useWaitlist()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark/80 backdrop-blur-xl border-b border-white/5 dark:bg-white/80 dark:border-b-gray-200'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <img
              src="/logo.jpeg"
              alt="Zendbox"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-lg font-bold text-white dark:text-gray-900">Zendbox</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors dark:text-gray-500 dark:hover:text-gray-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all dark:text-gray-500 dark:hover:text-gray-900 dark:hover:bg-gray-100"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Button variant="primary" size="sm" onClick={() => setWaitlistOpen(true)}>Join waitlist</Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-400 hover:text-white transition-all dark:text-gray-500 dark:hover:text-gray-900"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="p-2 text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-900"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
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
            className="md:hidden overflow-hidden bg-dark/95 backdrop-blur-xl border-b border-white/5 dark:bg-white/95 dark:border-b-gray-200"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-gray-400 hover:text-white transition-colors dark:text-gray-500 dark:hover:text-gray-900"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                <Button variant="primary" size="md" className="w-full" onClick={() => { setWaitlistOpen(true); setOpen(false) }}>Join waitlist</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
