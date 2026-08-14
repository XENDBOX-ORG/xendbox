import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Package, Navigation, BarChart3, Users, ShoppingCart, Plus } from 'lucide-react'

const merchantFeatures = [
  { Icon: Plus, label: 'Create Orders', desc: 'Set pickup & dropoff locations instantly' },
  { Icon: Navigation, label: 'Track Deliveries', desc: 'Live GPS tracking for every order' },
  { Icon: BarChart3, label: 'View Analytics', desc: 'Daily, weekly & monthly delivery insights' },
  { Icon: Users, label: 'Manage Customers', desc: 'Customer profiles and order history' },
]

export function MerchantExperience() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section id="merchants" ref={ref} className="relative py-20 sm:py-28 border-y border-white/5 dark:border-gray-200 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-4">
            Merchant Experience
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Powerful tools for{' '}
            <span className="text-gradient">Merchants</span>
          </h2>
          <p className="mt-4 text-gray-400 dark:text-gray-600 text-lg">
            Everything you need to manage deliveries, track performance, and grow your operation.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 dark:border-gray-200">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs text-gray-500 dark:text-gray-600">Merchant Dashboard</span>
              </div>
              <div className="p-4 sm:p-6">
                <div className="rounded-xl bg-gradient-to-br from-brand-500/10 to-orange-500/5 p-4 sm:p-6">
                  {/* Dashboard header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white dark:text-gray-900">Today's Overview</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">24 deliveries • 92% on time</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-400">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>12 active</span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {merchantFeatures.map(({ Icon, label, desc }, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 glass rounded-xl px-4 py-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-brand-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white dark:text-gray-900">{label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-600">{desc}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500/60" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
