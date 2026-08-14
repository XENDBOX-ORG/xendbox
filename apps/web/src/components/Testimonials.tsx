import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    content: "Xendbox transformed how we handle deliveries. Our customers get their orders in under 30 minutes, and our operational costs dropped by 40%. It's a game-changer for Lagos e-commerce.",
    author: 'Amara O.',
    role: 'Founder',
    company: 'ShopKulture',
    type: 'Merchant',
  },
  {
    content: 'I make 3x more delivering with Xendbox than my previous job. The app is easy to use, payments are instant, and the support team is always available. Best decision I ever made.',
    author: 'Chidi E.',
    role: 'Delivery Rider',
    company: 'Xendbox Rider Network',
    type: 'Rider',
  },
  {
    content: 'I needed urgent documents delivered across town. Xendbox had a rider at my door in 4 minutes. Tracked everything live. Could not believe how seamless it was.',
    author: 'Tolu B.',
    role: 'Customer',
    company: 'Lagos',
    type: 'Customer',
  },
  {
    content: 'Our restaurant uses Xendbox for all our deliveries. The AI dispatch means food arrives hot and customers are always happy. Our repeat orders have doubled.',
    author: 'Kunle A.',
    role: 'Owner',
    company: 'Lagos Grille',
    type: 'Merchant',
  },
  {
    content: 'The best part about riding with Xendbox is the instant payout feature. I finish my shift and my money is already in my wallet. No waiting, no hassle.',
    author: 'Fatima B.',
    role: 'Delivery Rider',
    company: 'Xendbox Rider Network',
    type: 'Rider',
  },
]

const typeColors: Record<string, string> = {
  Merchant: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  Rider: 'bg-green-500/10 text-green-400 border-green-500/20',
  Customer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
}

export function Testimonials() {
  const { ref, isVisible } = useScrollReveal()
  const [[index, direction], setIndex] = useState([0, 0])

  const paginate = useCallback((newDirection: number) => {
    setIndex(([current]) => {
      const next = current + newDirection
      if (next < 0) return [testimonials.length - 1, newDirection]
      if (next >= testimonials.length) return [0, newDirection]
      return [next, newDirection]
    })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000)
    return () => clearInterval(timer)
  }, [paginate])

  const t = testimonials[index]

  return (
    <section ref={ref} className="relative py-20 sm:py-28 border-y border-white/5 dark:border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-4">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Loved by{' '}
            <span className="text-gradient">merchants, riders & customers</span>
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Carousel */}
            <div className="overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={index}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="glass rounded-2xl p-8 sm:p-10"
                >
                  <div className="flex items-start gap-2 mb-6">
                    <Quote className="h-8 w-8 text-brand-500/30 shrink-0 mt-1" />
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-brand-500 text-brand-500" />
                      ))}
                    </div>
                  </div>

                  <p className="text-base sm:text-lg text-gray-300 dark:text-gray-600 leading-relaxed mb-8 italic">
                    &ldquo;{t.content}&rdquo;
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-sm font-bold text-white">
                        {t.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white dark:text-gray-900">{t.author}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-600">{t.role}, {t.company}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${typeColors[t.type]}`}>
                      {t.type}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => paginate(-1)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white dark:hover:text-gray-900 transition-all hover:scale-105"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex([i, i > index ? 1 : -1])}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === index
                        ? 'bg-brand-500 w-6'
                        : 'bg-white/20 dark:bg-gray-400 hover:bg-white/40 dark:hover:bg-gray-500'
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => paginate(1)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white dark:hover:text-gray-900 transition-all hover:scale-105"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
