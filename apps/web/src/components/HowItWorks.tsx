import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { ClipboardList, Navigation2, Map, CheckCircle } from 'lucide-react'

const steps = [
  {
    number: 1,
    title: 'Create Delivery Request',
    description: 'Enter pickup and dropoff locations, package details, and preferred delivery time.',
    Icon: ClipboardList,
  },
  {
    number: 2,
    title: 'AI Finds Nearest Rider',
    description: 'Our intelligent dispatch engine matches your delivery with the nearest available rider.',
    Icon: Navigation2,
  },
  {
    number: 3,
    title: 'Track Delivery Live',
    description: 'Follow your package in real-time with live GPS tracking and precise ETAs.',
    Icon: Map,
  },
  {
    number: 4,
    title: 'Delivery Completed',
    description: 'Package arrives safely. Both parties confirm delivery and leave feedback.',
    Icon: CheckCircle,
  },
]

export function HowItWorks() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section id="how-it-works" ref={ref} className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/[0.03] rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-4">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Delivering in{' '}
            <span className="text-gradient">four simple steps</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Desktop Timeline Line */}
          <div className="hidden lg:block absolute top-8 left-[calc(12.5%_-_0.5625rem)] right-[calc(12.5%_-_0.5625rem)] h-px bg-gradient-to-r from-brand-500/20 via-brand-500/60 to-brand-500/20" />

          <div className="grid lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Circle */}
                <div className="relative mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isVisible ? { scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.2, type: 'spring' }}
                    className="w-16 h-16 rounded-2xl glass flex items-center justify-center"
                  >
                    <step.Icon className="h-7 w-7 text-brand-400" />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">
                    {step.number}
                  </div>
                </div>

                {/* Mobile Connector */}
                {i < steps.length - 1 && (
                  <div className="lg:hidden w-px h-8 bg-gradient-to-b from-brand-500/40 to-transparent my-2" />
                )}

                <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-600 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
