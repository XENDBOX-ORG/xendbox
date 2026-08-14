import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { MapPin, Check } from 'lucide-react'

const cities = [
  { name: 'Lagos', status: 'live' },
  { name: 'Abuja', status: 'coming' },
  { name: 'Kano', status: 'coming' },
  { name: 'Kaduna', status: 'coming' },
  { name: 'Ibadan', status: 'coming' },
  { name: 'Port Harcourt', status: 'coming' },
]

export function CitiesWeServe() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="relative py-20 sm:py-28 border-y border-white/5 dark:border-gray-200">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-4">
            Cities We Serve
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Expanding across{' '}
            <span className="text-gradient">Nigeria</span>
          </h2>
          <p className="mt-4 text-gray-400 dark:text-gray-600 text-lg">
            Started with Lagos, coming soon to more cities nationwide.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`glass rounded-xl p-5 flex items-center gap-4 ${
                  city.status === 'live'
                    ? 'border-brand-500/30 bg-brand-500/5'
                    : 'border-white/5 dark:border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  city.status === 'live'
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'bg-white/5 dark:bg-gray-200 text-gray-500'
                }`}>
                  {city.status === 'live' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className={`text-sm font-semibold ${
                    city.status === 'live'
                      ? 'text-white dark:text-gray-900'
                      : 'text-gray-300 dark:text-gray-700'
                  }`}>
                    {city.name}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    city.status === 'live'
                      ? 'text-brand-400'
                      : 'text-gray-500'
                  }`}>
                    {city.status === 'live' ? 'Live' : 'Coming Soon'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
