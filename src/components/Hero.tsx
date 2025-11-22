import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bg.jpg";
import logoImage from "@/assets/logo.png";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary-light/85" />
      </div>
      
      <div className="container relative z-10 px-4 py-20 text-center">
        <img 
          src={logoImage} 
          alt="Sinergia by Botican" 
          className="w-48 h-auto mx-auto mb-8 drop-shadow-2xl"
        />
        
        <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in">
          SINERGIA
        </h1>
        
        <p className="text-2xl md:text-3xl text-primary-foreground/95 mb-4 font-semibold">
          CBD + CBG + TERPENOS
        </p>
        
        <p className="text-xl md:text-2xl text-primary-foreground/90 mb-12 font-light">
          Broad Spectrum
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => scrollToSection("productos")}
            className="text-lg px-8 py-6 shadow-xl hover:scale-105 transition-transform"
          >
            Ver Productos
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => scrollToSection("contacto")}
            className="text-lg px-8 py-6 bg-background/20 border-primary-foreground text-primary-foreground hover:bg-background/30 shadow-xl hover:scale-105 transition-transform backdrop-blur-sm"
          >
            Contactar
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
