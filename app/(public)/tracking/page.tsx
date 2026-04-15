import Navbar from "@/components/landing/Navbar";
import TrackingSection from "@/components/landing/TrackingSection";
import Footer from "@/components/landing/Footer";
import ChatWidget from "@/components/chatbot/ChatWidget";

export const metadata = {
  title: "Rastrear Servicio | SanPedroMotoCare",
  description: "Rastrea tu servicio en tiempo real con tu número de ticket SPM-XXXX.",
};

export default function TrackingPage() {
  return (
    <main>
      <Navbar />
      <div className="pt-20">
        <TrackingSection />
      </div>
      <Footer />
      <ChatWidget />
    </main>
  );
}
