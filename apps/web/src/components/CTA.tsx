import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useWaitlist } from '@/contexts/WaitlistContext'

export function CTA() {
  const { ref, isVisible } = useScrollReveal()
  const { setOpen: setWaitlistOpen } = useWaitlist()

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-dark to-orange-500/10 dark:via-gray-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/[0.06] rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            Join 1,000+ merchants already delivering smarter
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
        >
          Ready to{' '}
          <span className="text-gradient">Deliver Smarter</span>?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg text-gray-400 dark:text-gray-600 max-w-lg mx-auto"
        >
          Join the logistics revolution transforming how Africa moves.
          Start delivering in minutes, not days.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button variant="primary" size="lg" className="group text-base" onClick={() => setWaitlistOpen(true)}>
            Join waitlist
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
