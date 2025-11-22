import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SystemSection from "@/components/SystemSection";
import PhytocannabinoidsSection from "@/components/PhytocannabinoidsSection";
import ProductsSection from "@/components/ProductsSection";
import InteractionsSection from "@/components/InteractionsSection";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  return (
    <div id="inicio" className="min-h-screen">
      <Navigation />
      <Hero />
      <SystemSection />
      <PhytocannabinoidsSection />
      <InteractionsSection />
      <ProductsSection />
      <ContactSection />
    </div>
  );
};

export default Index;
