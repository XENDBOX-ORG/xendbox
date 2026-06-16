import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Smartphone, Monitor, ArrowRight } from 'lucide-react'
import { useWaitlist } from '@/contexts/WaitlistContext'
import { LogisticsScene } from './LogisticsScene'

export function Hero() {
  const { setOpen: setWaitlistOpen } = useWaitlist()
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-dark dark:bg-gray-50">
      {/* Premium Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-brand-500/[0.03] dark:from-gray-50 dark:via-gray-50 dark:to-brand-500/[0.02]" />

        {/* Orange glow orbs */}
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-brand-500/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-[55%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-[160px]" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-20 dark:bg-grid-light" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-[40%_60%] gap-12 lg:gap-16 items-center min-h-[75vh]">
          {/* Left Column - 40% */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                AI-Native Delivery Infrastructure for African Commerce
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.05]"
            >
              Deliver Anything{' '}
              <br />
              <span className="text-gradient">Across Nigeria</span>{' '}
              <br />
              In Minutes
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-gray-400 dark:text-gray-600 max-w-md mx-auto lg:mx-0 leading-relaxed"
            >
              Connect merchants, riders, warehouses, and customers through one intelligent logistics network built for African commerce.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button variant="primary" size="lg" className="group" onClick={() => setWaitlistOpen(true)}>
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                Coming soon to
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 dark:border-gray-300 text-xs text-gray-400 dark:text-gray-600 hover:border-white/20 dark:hover:border-gray-400 hover:bg-white/5 transition-all cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  <span>App Store</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 dark:border-gray-300 text-xs text-gray-400 dark:text-gray-600 hover:border-white/20 dark:hover:border-gray-400 hover:bg-white/5 transition-all cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  <span>Google Play</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - 60% - Logistics Centerpiece */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
            className="relative hidden lg:block h-full min-h-[400px]"
          >
            <LogisticsScene />
          </motion.div>
        </div>

        {/* Trust Section - full width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 pt-8 border-t border-white/5 dark:border-gray-200"
        >
          <p className="text-sm text-gray-500 dark:text-gray-500 font-medium text-center">
            Trusted by <span className="text-white dark:text-gray-900 font-semibold">1,000+</span> merchants across Nigeria
          </p>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/10 dark:border-gray-300 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/30 dark:bg-gray-400" />
        </motion.div>
      </motion.div>
    </section>
  )
}
