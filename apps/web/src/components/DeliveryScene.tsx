import { motion } from 'framer-motion'

const cards = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
    gradient: 'from-blue-500/20 to-cyan-500/10',
    title: 'Package #ZB-4821',
    subtitle: 'ETA 6 min',
    delay: 1,
    x: '-right-3',
    y: '-top-3',
    animateY: [0, -4, 0],
    duration: 4,
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5">
        <path d="M22 11.1V12a10 10 0 11-5.9-9.1" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
    gradient: 'from-green-500/20 to-emerald-500/10',
    title: 'Delivery Complete',
    subtitle: 'Signed at 2:34 PM',
    delay: 1.3,
    x: '-right-3',
    y: '-bottom-3',
    animateY: [0, -3, 0],
    duration: 3.5,
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    gradient: 'from-brand-500/20 to-orange-500/10',
    title: 'Arriving in 8 min',
    subtitle: 'Lekki → VI',
    delay: 1.6,
    x: '-left-3',
    y: 'bottom-1/3',
    animateY: [0, 3, 0],
    duration: 5,
  },
]

export function DeliveryScene() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start">
      {/* Deep glow behind image */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[640px] h-[640px] bg-brand-500/8 rounded-full blur-[130px]" />
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[90px]" />

      {/* Image container - also serves as positioning parent for cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-[90%] lg:max-w-[620px] mt-6"
      >
        {/* Soft shadow layer */}
        <div className="absolute -inset-6 bg-gradient-to-b from-brand-500/5 via-transparent to-brand-500/10 rounded-[40px] blur-3xl pointer-events-none" />

        {/* Image wrapper with rounded corners */}
        <div className="relative rounded-[20px] overflow-hidden shadow-[0_0_80px_-30px_rgba(255,90,31,0.35)]">
          <div className="absolute inset-0 bg-gradient-to-t from-dark/5 via-transparent to-transparent pointer-events-none" />
          <img
            src="/delivery.png"
            alt="Xendbox delivery"
            className="w-full h-auto block"
          />
        </div>

        {/* Subtle bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-dark/10 to-transparent pointer-events-none rounded-[20px]" />

        {/* Floating Cards - positioned relative to image container */}
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: card.delay }}
            className={`absolute ${card.x} ${card.y} z-10`}
          >
            <motion.div
              animate={{ y: card.animateY }}
              transition={{ duration: card.duration, repeat: Infinity, ease: 'easeInOut' }}
              className="glass rounded-xl px-3 py-2 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0`}>
                  {card.icon}
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-white dark:text-gray-900 leading-tight">{card.title}</div>
                  <div className="text-[8px] text-gray-500 dark:text-gray-400 mt-0.5">{card.subtitle}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
