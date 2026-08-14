import { motion } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Building2, PackageCheck, Percent } from 'lucide-react'

const metrics = [
  {
    end: 1000,
    label: 'Merchants',
    suffix: '+',
    Icon: Building2,
    desc: 'Active merchants using Xendbox daily',
    gradient: 'from-brand-500/20 to-orange-500/10',
  },
  {
    end: 10000,
    label: 'Deliveries',
    suffix: '+',
    Icon: PackageCheck,
    desc: 'Deliveries completed across the cities we serve',
    gradient: 'from-blue-500/20 to-cyan-500/10',
  },
  {
    end: 98,
    label: 'Delivery Success',
    suffix: '%',
    decimals: 0,
    Icon: Percent,
    desc: 'On-time delivery success rate',
    gradient: 'from-green-500/20 to-emerald-500/10',
  },
]

function MetricCard({
  end, label, suffix, decimals = 0, Icon, desc, gradient,
}: {
  end: number; label: string; suffix?: string; decimals?: number
  Icon: any; desc: string; gradient: string
}) {
  const { ref, count } = useCountUp({ end, suffix, decimals })

  return (
    <div ref={ref} className="glass rounded-2xl p-6 sm:p-8 text-center group hover:scale-[1.02] transition-transform duration-300">
      <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-7 w-7 text-brand-400" />
      </div>
      <div className="text-4xl sm:text-5xl font-bold text-white dark:text-gray-900 tabular-nums">
        {count}
      </div>
      <div className="mt-1 text-base font-semibold text-gray-300 dark:text-gray-700">
        {label}
      </div>
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto">
        {desc}
      </div>
    </div>
  )
}

export function TrustMetrics() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="relative py-20 sm:py-28 border-b border-white/5 dark:border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-4">
            Trust Metrics
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gradient">Trusted to Operate at Scale</span>
          </h2>
          <p className="mt-4 text-gray-400 dark:text-gray-600 text-lg max-w-xl mx-auto">
            Delivering quality products faster than traditional delivery.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
