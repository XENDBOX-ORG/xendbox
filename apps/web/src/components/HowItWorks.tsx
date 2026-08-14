import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { ClipboardList, Navigation2, PackageCheck, Bike, Wallet, BarChart3, Users, MapPin } from 'lucide-react'

const tabs = [
  { id: 'senders', label: 'For Senders' },
  { id: 'riders', label: 'For Riders' },
  { id: 'partners', label: 'For Partners' },
]

const senderSteps = [
  {
    step: 'STEP 1',
    title: 'Create your delivery',
    desc: 'Enter your pickup address and recipient details. Choose between home delivery or a nearby pickup station, whichever works best for your recipient.',
    Icon: ClipboardList,
  },
  {
    step: 'STEP 2',
    title: 'A rider picks up your parcel',
    desc: 'A verified Xendbox rider arrives at your location, collects the parcel, and heads straight to the destination. Track everything in real time.',
    Icon: Navigation2,
  },
  {
    step: 'STEP 3',
    title: 'Recipient collects securely',
    desc: 'Choose home delivery or collect your parcel from a nearby partner station using a secure QR code or PIN, whichever is most convenient for you.',
    Icon: PackageCheck,
  },
]

const riderSteps = [
  {
    step: 'STEP 1',
    title: 'Register & get verified',
    desc: 'Sign up on the Xendbox Rider App, submit your documents, and get approved. Independent riders and logistics company are both welcome.',
    Icon: Navigation2,
  },
  {
    step: 'STEP 2',
    title: 'Go online & accept jobs',
    desc: 'Switch online when you\'re ready. Job alerts come in based on your location, accept, navigate, pick up, and deliver.',
    Icon: Bike,
  },
  {
    step: 'STEP 3',
    title: 'Get paid same day',
    desc: 'Earnings are credited to your Xendbox wallet after every delivery. Withdraw to your bank account anytime, no waiting, no delays.',
    Icon: Wallet,
  },
]

const partnerSteps = [
  {
    step: 'STEP 1',
    title: 'Register your shop',
    desc: 'Apply to be a pickup partner from the Xendbox Partner Dashboard. We\'ll review your location, approve your station, and get you set up in days.',
    Icon: Users,
  },
  {
    step: 'STEP 2',
    title: 'Receive & hold parcels',
    desc: 'Riders deliver parcels to your station. Scan each parcel to log it in. The dashboard shows you everything, what\'s arrived, what\'s been collected, what\'s overdue.',
    Icon: MapPin,
  },
  {
    step: 'STEP 3',
    title: 'Earn on every collection',
    desc: 'Get 1k commission for every parcel successfully collected at your station. It adds up so fast, extra cash on top of your regular business.',
    Icon: BarChart3,
  },
]

const stepData: Record<string, typeof senderSteps> = {
  senders: senderSteps,
  riders: riderSteps,
  partners: partnerSteps,
}

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState('senders')
  const { ref, isVisible } = useScrollReveal()

  const steps = stepData[activeTab]

  return (
    <section id="how-it-works" ref={ref} className="relative py-20 sm:py-28 overflow-hidden scroll-mt-24" style={{ backgroundColor: '#111827' }}>
      <div className="absolute top-1/4 -left-48 w-[600px] h-[600px] bg-purple-600/[0.06] rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-brand-500/[0.06] rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-left max-w-3xl mb-12"
        >
          <p className="text-sm font-medium text-brand-500 uppercase tracking-widest mb-3">
            How it Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Built for{' '}
            <span className="text-brand-500">everyone</span> on the platform
          </h2>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed mt-3 max-w-xl">
            Xendbox works differently depending on your role.<br />
            Choose yours below.
          </p>
        </motion.div>

        <div className="flex justify-start mb-12">
          <div className="inline-flex rounded-full bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-lg'
                    : 'text-black hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-8 left-[calc(16.666%_-_0.5625rem)] right-[calc(16.666%_-_0.5625rem)] h-px bg-gradient-to-r from-brand-500/20 via-brand-500/60 to-brand-500/20" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {steps.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative bg-white rounded-2xl p-6 flex flex-col items-start text-left shadow-lg"
                >
                  <span className="text-xs font-bold text-brand-500 tracking-widest mb-3">
                    {item.step}
                  </span>

                  <item.Icon className="h-6 w-6 text-brand-500 mb-4" />
                  <h3 className="text-lg font-semibold text-dark mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-3 mt-16"
        >
          <div className="bg-white rounded-full px-4 py-2 text-center shadow-lg">
            <p className="text-sm font-semibold text-dark">Senders? <span className="text-brand-500">Get the App</span></p>
          </div>
          <div className="bg-white rounded-full px-4 py-2 text-center shadow-lg">
            <p className="text-sm font-semibold text-dark">Independent riders? <span className="text-brand-500">Get the App</span></p>
          </div>
          <div className="bg-white rounded-full px-4 py-2 text-center shadow-lg">
            <p className="text-sm font-semibold text-dark">Logistics company? <span className="text-brand-500">Sign in to your Dashboard</span></p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
