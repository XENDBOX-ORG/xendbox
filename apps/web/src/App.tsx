import { ThemeProvider } from '@/contexts/ThemeContext'
import { WaitlistProvider } from '@/contexts/WaitlistContext'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { TrustMetrics } from '@/components/TrustMetrics'
import { HowItWorks } from '@/components/HowItWorks'
import { WhyChooseZendbox } from '@/components/WhyChooseZendbox'
import { MerchantExperience } from '@/components/MerchantExperience'
import { RiderExperience } from '@/components/RiderExperience'
import { Testimonials } from '@/components/Testimonials'
import { FutureVision } from '@/components/FutureVision'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'
import { WaitlistModal } from '@/components/WaitlistModal'

export default function App() {
  return (
    <ThemeProvider>
      <WaitlistProvider>
        <div className="min-h-screen bg-dark dark:bg-gray-50">
          <Navbar />
          <main>
            <Hero />
            <TrustMetrics />
            <HowItWorks />
            <WhyChooseZendbox />
            <MerchantExperience />
            <RiderExperience />
            <Testimonials />
            <FutureVision />
            <CTA />
          </main>
          <Footer />
          <WaitlistModal />
        </div>
      </WaitlistProvider>
    </ThemeProvider>
  )
}
