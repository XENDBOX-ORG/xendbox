import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Sparkles, Bot, Route, Package, Rocket } from 'lucide-react'

const milestones = [
  {
    period: 'TODAY',
    title: 'AI Dispatch',
    Icon: Sparkles,
    gradient: 'from-brand-500 to-orange-500',
    desc: 'Intelligent routing connecting merchants and riders across the cities we serve in minutes.',
  },
  {
    period: 'TOMORROW',
    title: 'Predictive Delivery',
    Icon: Bot,
    gradient: 'from-teal-500 to-green-500',
    desc: 'Anticipating demand before it happens. Pre-positioning riders for instant pickup.',
  },
  {
    period: 'TOMORROW',
    title: 'Route Optimization',
    Icon: Route,
    gradient: 'from-purple-500 to-pink-500',
    desc: 'AI finds the fastest routes by analyzing traffic and order locations, cutting delivery time and fuel costs.',
  },
  {
    period: 'TOMORROW',
    title: 'Smart Locker',
    Icon: Package,
    gradient: 'from-indigo-500 to-purple-500',
    desc: 'Self-service storage and parcel collection system that allows users to send, receive, return, or store packages without human assistance.',
  },
  {
    period: 'FUTURE',
    title: 'Autonomous Drone Delivery',
    Icon: Rocket,
    gradient: 'from-blue-500 to-cyan-500',
    desc: 'Drone fleets handling last-mile delivery, bypassing Lagos and Abuja traffic entirely.',
  },
]

export function FutureVision() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 })

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: '#111827' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/[0.03] rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-[0.2em] text-brand-500 uppercase mb-4">Our Vision</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Building{' '}
            <span className="text-brand-500">Africa&apos;s</span> Delivery Infrastructure
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            From AI-native dispatch to autonomous drones, we&apos;re building the
            delivery backbone for the future of African commerce.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[calc(10%_+_2rem)] right-[calc(10%_+_2rem)] h-px bg-gradient-to-r from-brand-500/20 via-brand-500/60 to-brand-500/20" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {milestones.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isVisible ? { scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.2 + 0.3, type: 'spring' }}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${m.gradient} p-[2px]`}
                  >
                    <div className="w-full h-full rounded-2xl bg-dark flex items-center justify-center">
                      <m.Icon className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-3 rounded-full border border-brand-500/10"
                  />
                </div>

                <span className="text-xs font-bold text-brand-500 tracking-widest mb-3">
                  {m.period}
                </span>

                <h3 className="text-lg font-bold text-white mb-1">{m.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[180px]">{m.desc}</p>

                {i < milestones.length - 1 && (
                  <div className="lg:hidden w-px h-8 bg-gradient-to-b from-brand-500/30 to-transparent mt-4" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
