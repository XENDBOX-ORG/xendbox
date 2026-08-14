import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { MapPin, BadgeCheck, Home, Zap, Wallet, Building2, type LucideIcon } from 'lucide-react'

interface FeatureItem {
  title: string
  description: string
  Icon: LucideIcon
  iconColor: string
  bgColor: string
}

const features: FeatureItem[] = [
  {
    title: 'Pickup Station Network',
    description: '46+ agent-run stations in Lagos and Abuja. Local shops that hold parcels and verify recipients securely.',
    Icon: MapPin,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    title: 'QR + Code Verification',
    description: 'Every pickup requires a unique code or QR scan. Parcels only change hands when identity is confirmed.',
    Icon: BadgeCheck,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
  {
    title: 'Home Delivery Too',
    description: 'Need to deliver directly? We do that too. Same riders, same tracking, just door to door.',
    Icon: Home,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    title: 'Real-Time Tracking',
    description: 'Live map tracking on every delivery. Know exactly where your parcel is, from pickup to collected.',
    Icon: Zap,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    title: 'In-App Wallet',
    description: 'Top up once, pay for multiple deliveries. No card details at checkout every time, just tap and go.',
    Icon: Wallet,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    title: 'Logistics Company Tools',
    description: 'Running a fleet? Manage your riders, vehicles, and orders from a dedicated company dashboard.',
    Icon: Building2,
    iconColor: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20',
  },
]

function FeatureCard({ feature }: { feature: FeatureItem }) {
  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative shrink-0 w-[280px] sm:w-[300px]"
    >
      <div className="relative h-full glass rounded-2xl p-6 sm:p-8 glass-hover overflow-hidden">
        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-16 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
            <feature.Icon className={`h-6 w-6 ${feature.iconColor}`} />
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>

          <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function WhyChooseXendbox() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section id="features" ref={ref} className="relative py-20 sm:py-28 scroll-mt-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-white/[0.04] to-white/[0.02]" />
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/delivery-truck.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-dark/70" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-start justify-between gap-8">
            <div className="text-left max-w-2xl">
              <p className="text-sm font-medium text-brand-500 uppercase tracking-widest mb-3">
                Why Xendbox
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                The only <span className="text-brand-500">platform</span> built around Nigeria&apos;s{' '}
                last mile problem
              </h2>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-md ml-auto mt-4 hidden sm:block">
            Home delivery fails when nobody is home.<br />
            We built a better model, pickup stations<br />
            that let recipients collect on their own time,<br />
            with proof of identity.
          </p>
        </motion.div>

        <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="snap-start"
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
