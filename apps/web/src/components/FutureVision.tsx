import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Sparkles, Rocket, Bot, Eye } from 'lucide-react'

const milestones = [
  {
    period: 'Today',
    title: 'AI-Powered Dispatch',
    description: 'Intelligent routing connecting merchants and riders across Lagos in minutes.',
    Icon: Sparkles,
    gradient: 'from-brand-500 to-orange-500',
  },
  {
    period: 'Tomorrow',
    title: 'Predictive Logistics',
    description: 'Anticipating demand before it happens. Pre-positioning riders for instant pickup.',
    Icon: Bot,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    period: 'Future',
    title: 'Autonomous Drone Delivery',
    description: 'Drone fleets handling last-mile delivery, bypassing Lagos traffic entirely.',
    Icon: Rocket,
    gradient: 'from-blue-500 to-cyan-500',
  },
]

export function FutureVision() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 })

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/[0.03] rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-4">
            Our Vision
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Building{' '}
            <span className="text-gradient">Africa's Delivery Infrastructure</span>
          </h2>
          <p className="mt-4 text-gray-400 dark:text-gray-600 text-lg max-w-xl mx-auto">
            From AI-Native dispatch to autonomous drones — we're building the
            logistics backbone for the continent's future.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="hidden lg:block absolute top-10 left-[calc(16.67%_+_2rem)] right-[calc(16.67%_+_2rem)] h-px bg-gradient-to-r from-brand-500/20 via-brand-500/60 to-brand-500/20" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {milestones.map((m, i) => (
              <motion.div
                key={m.period}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon */}
                <div className="relative mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isVisible ? { scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.2 + 0.3, type: 'spring' }}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${m.gradient} p-[2px]`}
                  >
                    <div className="w-full h-full rounded-2xl bg-dark dark:bg-gray-50 flex items-center justify-center">
                      <m.Icon className="h-8 w-8 text-white dark:text-gray-900" />
                    </div>
                  </motion.div>

                  {/* Orbiting ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-3 rounded-full border border-brand-500/10"
                  />
                </div>

                {/* Period Badge */}
                <span className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">
                  {m.period}
                </span>

                <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-3">{m.title}</h3>
                <p className="text-sm text-gray-400 dark:text-gray-600 leading-relaxed max-w-xs">
                  {m.description}
                </p>

                {i < milestones.length - 1 && (
                  <div className="lg:hidden w-px h-8 bg-gradient-to-b from-brand-500/30 to-transparent mt-4" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Eye icon at bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex justify-center mt-16"
        >
          <div className="glass rounded-full px-6 py-3 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-600">
            <Eye className="h-4 w-4 text-brand-400" />
            The future of African logistics is being built today
          </div>
        </motion.div>
      </div>
    </section>
  )
}
