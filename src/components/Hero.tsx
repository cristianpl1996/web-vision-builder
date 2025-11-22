import { Button } from "@/components/ui/button";
import productImage from "@/assets/product-hero.png";
import logoImage from "@/assets/logo-white.png";
import heroImage from "@/assets/hero-bg.jpg";

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
            <img 
              src={logoImage} 
              alt="Sinergia by Botican" 
              className="w-64 md:w-80 h-auto mx-auto md:mx-0 mb-8 drop-shadow-2xl"
            />
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              SINERGIA
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/95 mb-4 font-semibold">
              CBD + CBG + TERPENOS
            </p>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 font-light">
              Broad Spectrum
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                size="lg"
                variant="default"
                onClick={() => scrollToSection("productos")}
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-xl hover:scale-105 transition-transform"
              >
                Ver Productos
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => scrollToSection("contacto")}
                className="text-lg px-8 py-6 bg-white/10 border-white text-white hover:bg-white/20 shadow-xl hover:scale-105 transition-transform backdrop-blur-sm"
              >
                Contactar
              </Button>
            </div>
          </div>
          
          {/* Right side - Product image */}
          <div className="flex items-center justify-center">
            <img 
              src={productImage} 
              alt="Sinergia 750mg Product" 
              className="w-full max-w-lg h-auto drop-shadow-2xl animate-fade-in"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
