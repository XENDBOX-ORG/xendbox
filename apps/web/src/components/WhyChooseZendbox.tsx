import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import {
  Brain,
  MapPin,
  BadgeCheck,
  Zap,
  Shield,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'

interface FeatureItem {
  title: string
  description: string
  Icon: LucideIcon
  gradient: string
}

const features: FeatureItem[] = [
  {
    title: 'AI Dispatch',
    description: 'Automatically assigns the nearest rider and optimizes delivery routes in real-time using machine learning.',
    Icon: Brain,
    gradient: 'from-brand-500/20 to-orange-500/10',
  },
  {
    title: 'Real-Time Tracking',
    description: 'Track deliveries live from pickup to dropoff with precise GPS location sharing and accurate ETAs.',
    Icon: MapPin,
    gradient: 'from-blue-500/20 to-cyan-500/10',
  },
  {
    title: 'Verified Riders',
    description: 'Every rider is thoroughly vetted, trained, and equipped. Quality and safety you can count on.',
    Icon: BadgeCheck,
    gradient: 'from-green-500/20 to-emerald-500/10',
  },
  {
    title: 'Fast Delivery',
    description: 'Average pickup time of under 5 minutes. We beat traditional courier services every single time.',
    Icon: Zap,
    gradient: 'from-yellow-500/20 to-orange-500/10',
  },
  {
    title: 'Secure Payments',
    description: 'Integrated wallet and payment processing with escrow protection for merchants and riders.',
    Icon: Shield,
    gradient: 'from-red-500/20 to-orange-500/10',
  },
  {
    title: 'Merchant Dashboard',
    description: 'Manage orders, customers, and delivery history from a single powerful analytics dashboard.',
    Icon: LayoutDashboard,
    gradient: 'from-purple-500/20 to-pink-500/10',
  },
]

function FeatureCard({ feature, index }: { feature: FeatureItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="relative h-full glass rounded-2xl p-6 sm:p-8 glass-hover">
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <feature.Icon className="h-6 w-6 text-brand-400" />
          </div>

          <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-2">
            {feature.title}
          </h3>

          <p className="text-sm text-gray-400 dark:text-gray-600 leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function WhyChooseZendbox() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section id="features" ref={ref} className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent" />

      {/* Decorative map routes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-10">
        <svg className="absolute top-1/4 -right-20 w-[500px] h-[600px]" viewBox="0 0 500 600" fill="none">
          <path d="M80 500 Q150 350 250 250 T420 180" stroke="#FF5A1F" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.3" />
          <path d="M120 450 Q200 300 300 200 T450 120" stroke="#FF5A1F" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.2" />
          <path d="M60 400 Q180 250 280 150 T400 80" stroke="#FF5A1F" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
          <circle cx="250" cy="250" r="8" fill="#FF5A1F" opacity="0.9" />
          <circle cx="420" cy="180" r="6" fill="#10B981" opacity="0.9" />
          <circle cx="80" cy="500" r="6" fill="#3B82F6" opacity="0.9" />
        </svg>
        <svg className="absolute bottom-1/4 -left-20 w-[400px] h-[500px]" viewBox="0 0 500 600" fill="none">
          <path d="M80 500 Q150 350 250 250 T420 180" stroke="#FF5A1F" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
          <path d="M120 450 Q200 300 300 200 T450 120" stroke="#FF5A1F" strokeWidth="1" strokeDasharray="4 4" opacity="0.1" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-4">
            Why Choose Zendbox
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Everything you need to{' '}
            <span className="text-gradient">deliver smarter</span>
          </h2>
          <p className="mt-4 text-gray-400 dark:text-gray-600 text-lg">
            Intelligent logistics tools that help merchants, riders, and customers
            work together seamlessly.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
