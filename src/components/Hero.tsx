import { Button } from "@/components/ui/button";
import productImage from "@/assets/product-hero.png";
import heroImage from "@/assets/hero-bg.png";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image with dark gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-gray-900/80" />
      </div>
      
      <div className="container relative z-10 px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Logo and text */}
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal text-white mb-6 tracking-tight">
              SINERGIA
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/95 mb-4 font-semibold">
              CBD + CBG + TERPENOS
            </p>
            
            <p className="text-xl md:text-2xl text-white/80 mb-8 font-light">
              Broad Spectrum
            </p>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
              La fórmula perfecta para el bienestar de tu mascota. Combinamos los mejores 
              fitocannabinoides y terpenos naturales para brindar un alivio completo y seguro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                size="lg"
                variant="default"
                onClick={() => scrollToSection("productos")}
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-xl hover:scale-105 transition-transform"
              >
                VER PRODUCTOS
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => scrollToSection("contacto")}
                className="text-lg px-8 py-6 bg-white/10 border-white text-white hover:bg-white/20 shadow-xl hover:scale-105 transition-transform backdrop-blur-sm"
              >
                CONTACTANOS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
