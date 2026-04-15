import Navbar from "@/components/landing/Navbar";
import QuoteSection from "@/components/landing/QuoteSection";
import Footer from "@/components/landing/Footer";
import ChatWidget from "@/components/chatbot/ChatWidget";

export const metadata = {
  title: "Cotizar Servicio | SanPedroMotoCare",
  description: "Solicita una cotización gratuita para el mantenimiento o reparación de tu moto.",
};

export default function CotizarPage() {
  return (
    <main>
      <Navbar />
      <div className="pt-20">
        <QuoteSection />
      </div>
      <Footer />
      <ChatWidget />
    </main>
  );
}
