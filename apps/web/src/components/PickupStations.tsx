import { motion } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { MapPin, Send } from 'lucide-react'

const stations = [
  { name: "Ngozi's Provisions", city: 'Garki Market, Abuja', distance: '2.3 km' },
  { name: 'Mallam Yusuf Store', city: 'Area 3, Garki, Abuja', distance: '5.1 km' },
  { name: 'Mama Bose Shop', city: 'Yaba, Lagos Island', distance: '8.7 km' },
  { name: 'Unity Supermart', city: 'Wuse Zone 4, Abuja', distance: '1.5 km' },
]

export function PickupStations() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="relative py-20 sm:py-28 mb-12 border-y border-white/5 overflow-hidden" style={{ backgroundColor: '#111827' }}>
      <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-brand-500/[0.06] rounded-full blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden h-[500px] sm:h-[600px] bg-dark2 border border-white/5"
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/city-map.jpg)" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

            <svg viewBox="0 0 300 220" className="relative w-full h-full z-10" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="mglow"><stop offset="0%" stopColor="#FF6A00" stopOpacity="0.3"/><stop offset="100%" stopColor="#FF6A00" stopOpacity="0"/></radialGradient>
              </defs>

              <rect x="150" y="110" width="140" height="100" rx="60" fill="url(#mglow)" />

              <g fontFamily="sans-serif" fontSize="5" fill="#ddd" fontWeight="600" letterSpacing="0.3">
                <text x="30" y="25">Garki</text>
                <text x="92" y="25">Wuse</text>
                <text x="165" y="25">Maitama</text>
                <text x="220" y="25">Jabi</text>
                <text x="35" y="60">Asokoro</text>
                <text x="110" y="60">Gwarinpa</text>
                <text x="195" y="60">Lugbe</text>
                <text x="55" y="100">Kubwa</text>
                <text x="130" y="100">Bwari</text>
                <text x="215" y="100">Dei-Dei</text>
                <text x="45" y="160">Nyanya</text>
                <text x="155" y="160">Karu</text>
                <text x="230" y="160">Karshi</text>
              </g>

              <g opacity="0.5" fill="#FF6A00">
                <circle cx="38" cy="50" r="3" />
                <circle cx="60" cy="42" r="2.5" />
                <circle cx="85" cy="55" r="3.5" />
                <circle cx="105" cy="40" r="2.5" />
                <circle cx="125" cy="52" r="3" />
                <circle cx="150" cy="45" r="2.5" />
                <circle cx="175" cy="55" r="3" />
                <circle cx="200" cy="42" r="2.5" />
                <circle cx="225" cy="50" r="3" />
                <circle cx="255" cy="45" r="2.5" />
                <circle cx="280" cy="55" r="3" />
                <circle cx="48" cy="85" r="2.5" />
                <circle cx="78" cy="78" r="3" />
                <circle cx="110" cy="88" r="2.5" />
                <circle cx="140" cy="80" r="3" />
                <circle cx="170" cy="90" r="2.5" />
                <circle cx="200" cy="82" r="3" />
                <circle cx="230" cy="88" r="2.5" />
                <circle cx="265" cy="80" r="3" />
                <circle cx="55" cy="125" r="3" />
                <circle cx="90" cy="118" r="2.5" />
                <circle cx="125" cy="128" r="3" />
                <circle cx="160" cy="120" r="2.5" />
                <circle cx="195" cy="130" r="3" />
                <circle cx="230" cy="118" r="2.5" />
                <circle cx="265" cy="128" r="3" />
                <circle cx="70" cy="175" r="2.5" />
                <circle cx="120" cy="185" r="3" />
                <circle cx="170" cy="178" r="2.5" />
                <circle cx="220" cy="188" r="3" />
                <circle cx="265" cy="175" r="2.5" />
              </g>

              <circle cx="85" cy="55" r="5" fill="none" stroke="#FF6A00" strokeWidth="0.6" opacity="0.4" />
              <circle cx="200" cy="82" r="5" fill="none" stroke="#10B981" strokeWidth="0.6" opacity="0.4" />

              <g>
                <rect x="82" y="42" width="14" height="11" rx="2" fill="#FF6A00" />
                <polygon points="85,53 89,56 93,53" fill="#FF6A00" />
                <text x="89" y="50" fontSize="5" fill="#fff" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">NEW</text>

                <rect x="190" y="72" width="14" height="11" rx="2" fill="#10B981" />
                <polygon points="193,83 197,86 201,83" fill="#10B981" />
                <text x="197" y="80" fontSize="4" fill="#fff" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">OPEN</text>
              </g>

              <text x="150" y="200" fontSize="8" fill="#aaa" fontFamily="sans-serif" textAnchor="middle">46 stations across Lagos &amp; Abuja</text>
            </svg>

            <div className="absolute top-3 left-3 glass rounded-lg px-3 py-1.5 text-xs text-white flex items-center gap-1.5 shadow-lg">
              <MapPin className="h-3.5 w-3.5 text-brand-500" />
              <span className="font-semibold">46 Stations</span>
            </div>

            <div className="absolute bottom-3 left-3 flex gap-2">
              <div className="glass rounded-lg px-2.5 py-1.5 text-xs text-white flex items-center gap-1.5 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                Lagos (32)
              </div>
              <div className="glass rounded-lg px-2.5 py-1.5 text-xs text-white flex items-center gap-1.5 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Abuja (14)
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-6"
          >
            <div className="space-y-1">
              <span className="inline-block text-xs font-semibold tracking-[0.2em] text-brand-500 uppercase">Pickup Station</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="text-brand-500">46 stations</span> across Lagos &amp; Abuja
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed pt-2">
                Every station is a real shop or business in your neighbourhood, trusted and verified by Xendbox. Recipients collect when convenient, not when the rider shows up.
              </p>
            </div>

            <div className="space-y-3">
              {stations.map((station, i) => (
                <motion.div
                  key={station.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="group rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer border-b border-white/5 hover:border-brand-500/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white">{station.name}</div>
                      <div className="text-xs text-gray-500">{station.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-brand-500 transition-colors">
                    <Send className="h-3 w-3" />
                    {station.distance}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex justify-end"
            >
              <button className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25">
                <MapPin className="h-4 w-4" />
                Find Nearest Station
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
