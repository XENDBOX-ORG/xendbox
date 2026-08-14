import { ThemeProvider } from '@/contexts/ThemeContext'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { HowItWorks } from '@/components/HowItWorks'
import { WhyChooseXendbox } from '@/components/WhyChooseXendbox'
import { PickupStations } from '@/components/PickupStations'
import { Partner } from '@/components/Partner'
import { FutureVision } from '@/components/FutureVision'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-dark">
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <WhyChooseXendbox />
          <PickupStations />
          <Partner />
          <FutureVision />
          <CTA />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}
