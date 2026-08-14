import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Apple from '@thesvg/react/apple'
import GooglePlay from '@thesvg/react/google-play'

function scrollToWaitlist() {
  const el = document.getElementById('waitlist')
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const trackingSteps = [
  { label: 'Order Placed', time: '11:20 AM', location: 'Yaba, Lagos', done: true },
  { label: 'Rider Assigned', time: '12:45 PM', location: 'Yaba, Lagos', done: true },
  { label: 'Parcel Picked Up', time: '2:10 PM', location: 'Yaba, Lagos', done: true },
  { label: 'Collected by Recipient', time: '', location: '', done: false, desc: 'Awaiting Amaka' },
]

export function Hero() {
  const [imageIndex, setImageIndex] = useState(0)
  const images = ['/delivery_at_night.jpg', '/infrastructure.jpg']

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-dark">
      <div className="absolute inset-0">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === imageIndex ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-dark/60 via-dark/40 to-dark/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dark/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-dark to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-6 w-full pt-36 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mb-10"
        >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 text-xs font-semibold tracking-wider text-white mb-5">
            🇳🇬 NIGERIA&apos;S FIRST PICK UP &amp; DROP OFF DELIVERY NETWORK
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
            Deliver Anything in Minutes{' '}
            <span className="text-brand-500">With Xendbox</span>
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden lg:block justify-self-center"
          >
            <div className="glass rounded-xl p-6 sm:p-8 max-w-[360px] relative">
              <div className="absolute top-8 -right-24 glass text-gray-300 text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                +₦650 credited · Garki Station
              </div>
              <div className="absolute bottom-8 -left-24 glass text-gray-300 text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                +₦650 credited · Garki Station
              </div>
              <div className="text-center mb-5 pr-4">
                <div className="text-3xl mb-2">📦</div>
                <p className="text-base font-semibold text-white">Arrived at Station</p>
                <p className="text-xs text-gray-400 mt-1">Ready for collection · Garki Market</p>
              </div>
              <div className="space-y-0">
                {trackingSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        step.done
                          ? 'bg-green-500'
                          : 'bg-transparent border border-gray-600'
                      }`}>
                        {step.done && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {i < trackingSteps.length - 1 && (
                        <div className={`w-px h-5 ${step.done ? 'bg-green-500/50' : 'bg-gray-700'}`} />
                      )}
                    </div>
                    <div className="pb-3">
                      <span className={`text-sm ${step.done ? 'text-gray-200' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                      {step.done && step.time ? (
                        <p className="text-[9px] text-gray-500 mt-0.5">{step.time} · {step.location}</p>
                      ) : step.desc ? (
                        <p className="text-[9px] text-gray-600 mt-0.5">{step.desc}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">Pickup Code</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 glass rounded-lg px-3 py-2.5 text-center">
                    <span className="text-lg font-bold tracking-widest text-white">XB-7K9M</span>
                  </div>
                  <button className="glass rounded-lg px-3 py-2.5 text-xs font-semibold text-brand-500 hover:bg-white/10 transition-all whitespace-nowrap">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:pl-12"
          >
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
              Whether you&apos;re selling on socials, running a store, or just sending something across town, Home delivery or pickup from a nearby station. No more missed deliveries, no more failed drop-offs. Just parcels that always arrive.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-all text-sm">
                Start Sending
              </button>
              <button
                onClick={scrollToWaitlist}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 text-sm"
              >
                Get Started
              </button>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Coming soon on
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer">
                  <Apple className="h-5 w-5 text-white" />
                  <div className="text-left">
                    <div className="text-[9px] text-gray-400 leading-none mb-0.5">Download on the</div>
                    <div className="text-xs font-semibold text-white leading-none">App Store</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer">
                  <GooglePlay className="h-5 w-5 text-white" />
                  <div className="text-left">
                    <div className="text-[9px] text-gray-400 leading-none mb-0.5">Get it on</div>
                    <div className="text-xs font-semibold text-white leading-none">Google Play</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-white/10">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-brand-500">12K+</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Active Senders</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-brand-500">1,200+</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Verified Riders</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-brand-500">46</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Pickup Stations</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-brand-500">2</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Cities Growing</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
