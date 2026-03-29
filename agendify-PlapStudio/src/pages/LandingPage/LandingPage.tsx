import Navbar from '../../components/LandingPage/Navbar'
import HeroSection from '../../components/LandingPage/HeroSection'
import HowItWorksSection from '../../components/LandingPage/HowItWorksSection'
import BusinessCategoriesSection from '../../components/LandingPage/BusinessCategoriesSection'
import FeaturesSection from '../../components/LandingPage/FeaturesSection'
import TestimonialsSection from '../../components/LandingPage/TestimonialsSection'
import PricingSection from '../../components/LandingPage/PricingSection'
import CTABanner from '../../components/LandingPage/CTABanner'
import Footer from '../../components/LandingPage/Footer'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <BusinessCategoriesSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
