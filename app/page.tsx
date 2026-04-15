import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ServicesSection from "@/components/landing/ServicesSection";
import TrackingSection from "@/components/landing/TrackingSection";
import QuoteSection from "@/components/landing/QuoteSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";
import ChatWidget from "@/components/chatbot/ChatWidget";
import PWAInstallBanner from "@/components/landing/PWAInstallBanner";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <TrackingSection />
      <QuoteSection />
      <ContactSection />
      <Footer />
      <ChatWidget />
      <PWAInstallBanner />
    </main>
  );
}
