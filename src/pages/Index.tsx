import { SiteLayout } from "@/components/layout/SiteLayout";
import Hero from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import SystemSection from "@/components/SystemSection";
import PhytocannabinoidsSection from "@/components/PhytocannabinoidsSection";
import ProductsSection from "@/components/ProductsSection";
import InteractionsSection from "@/components/InteractionsSection";
import { FaqSection } from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";

const Index = () => (
  <SiteLayout>
    <Hero />
    <TrustBar />
    <SystemSection />
    <PhytocannabinoidsSection />
    <ProductsSection />
    <InteractionsSection />
    <FaqSection />
    <ContactSection />
  </SiteLayout>
);

export default Index;
