import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Wallet, LayoutDashboard, BadgeCheck, ArrowRight, Store, TrendingUp } from 'lucide-react'

function scrollToWaitlist() {
  const el = document.getElementById('waitlist')
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const benefits = [
  {
    Icon: Wallet,
    title: 'Earn per collected parcel',
    desc: 'Commission is automatically credited to your wallet after every verified pickup. No paperwork, no chasing payments.',
  },
  {
    Icon: LayoutDashboard,
    title: 'A dashboard built for shop owners',
    desc: 'See incoming parcels, scan to verify recipients, and track your earnings all from your phone in seconds between serving customers.',
  },
  {
    Icon: BadgeCheck,
    title: 'Never hand over the wrong parcel',
    desc: 'Every collection requires a verified pickup code or QR scan. Xendbox handles the verification, you just hand over and go.',
  },
]

export function Partner() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section id="partners" ref={ref} className="relative py-20 sm:py-28 overflow-hidden scroll-mt-24">
      <div className="absolute inset-0 bg-[#111827]" />
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-brand-500/15" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-xs text-gray-400 mb-4">
              <Store className="h-3.5 w-3.5 text-brand-500" />
              Become a Partner
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Your shop. A new{' '}
              <span className="text-brand-500">income stream.</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mt-4 max-w-md">
              Turn your existing business into a Xendbox pickup station. No infrastructure investment. No extra staff. Just your space, our parcels, and paid per collection.
            </p>
            <div className="flex gap-3 mt-8 max-w-md">
              <button
                onClick={scrollToWaitlist}
                className="flex-1 inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-3 rounded-full font-semibold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 group text-sm justify-center"
              >
                Apply to Partner
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex-1 inline-flex items-center gap-2 border border-white/20 text-white px-5 py-3 rounded-full font-semibold hover:bg-white/5 transition-all group text-sm justify-center">
                Learn More
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 max-w-md">
              Already a partner? <a href="#" className="text-brand-500 hover:text-brand-400 transition-colors font-medium">Sign in to your dashboard →</a>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 10 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="group rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer bg-dark2 border border-white/5 hover:border-brand-500/30 hover:bg-white/[0.03] transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                  <benefit.Icon className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{benefit.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.54 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="group rounded-xl px-5 py-5 flex items-center gap-4 bg-brand-500/10 border border-brand-500/30 hover:border-brand-500/50 hover:bg-brand-500/15 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center shrink-0">
                <span className="text-brand-500 font-extrabold text-lg">₦</span>
              </div>
              <div className="flex-1">
                <div className="text-lg font-extrabold text-brand-500">₦300,000+</div>
                <p className="text-xs text-gray-400">average monthly partner earnings</p>
              </div>
              <TrendingUp className="h-6 w-6 text-brand-500/60" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
