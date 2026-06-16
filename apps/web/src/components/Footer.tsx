import { motion } from 'framer-motion'
import { Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'
import { useWaitlist } from '@/contexts/WaitlistContext'

const socialLinks = [
  { Icon: Twitter, href: '#', label: 'Twitter' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Linkedin, href: '#', label: 'LinkedIn' },
  { Icon: Youtube, href: '#', label: 'YouTube' },
]

export function Footer() {
  const { setOpen: setWaitlistOpen } = useWaitlist()
  return (
    <footer className="relative border-t border-white/5 dark:border-gray-200 pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <a href="#" className="flex items-center gap-2 mb-3">
            <img
              src="/logo.jpeg"
              alt="Zendbox"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-lg font-bold text-white dark:text-gray-900">Zendbox</span>
          </a>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
            AI-Native delivery infrastructure built for African commerce.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {socialLinks.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-gray-500 hover:text-brand-400 hover:border-brand-500/30 transition-all duration-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <button
            onClick={() => setWaitlistOpen(true)}
            className="mt-6 text-sm text-brand-500 hover:text-brand-400 transition-colors font-medium"
          >
            Join the waitlist &rarr;
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 dark:border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Zendbox Africa. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-gray-600 dark:text-gray-500 hover:text-gray-400 dark:hover:text-gray-700 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-gray-600 dark:text-gray-500 hover:text-gray-400 dark:hover:text-gray-700 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
