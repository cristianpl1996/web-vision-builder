import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import productImage from "@/assets/product-hero.png";
import { Phone } from "lucide-react";

const ProductsSection = () => {
  const products = [
    {
      name: "SINERGIA 750",
      image: productImage,
      concentration: "25 mg/ml",
      cbd: "25 mg/ml de CBD",
      cbg: "0.5 mg/ml de CBG",
      content: "750 mg total",
      volume: "30 ml",
    },
    {
      name: "SINERGIA 1500",
      image: productImage,
      concentration: "50 mg/ml",
      cbd: "50 mg/ml de CBD",
      cbg: "1 mg/ml de CBG",
      content: "1500 mg total",
      volume: "30 ml",
    },
  ];

  const handleContact = () => {
    window.open("https://wa.me/525548993902", "_blank");
  };

  return (
    <section id="productos" className="py-24 bg-gradient-to-b from-secondary to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary leading-tight">
            Elige la Mejor Opción
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Dos presentaciones diseñadas para adaptarse a las necesidades de tu mascota
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-16">
          {products.map((product, index) => (
            <Card key={product.name} className="overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-primary/10 bg-gradient-to-br from-card to-secondary/20">
              <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-12 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent animate-pulse" />
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-64 h-auto object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-3xl font-bold text-primary">{product.name}</h3>
                  <Badge className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                    Broad Spectrum
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">Concentración</span>
                    <span className="font-semibold text-foreground">{product.concentration}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">CBD</span>
                    <span className="font-semibold text-primary">{product.cbd}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">CBG</span>
                    <span className="font-semibold text-primary">{product.cbg}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">Contenido</span>
                    <span className="font-semibold text-foreground">{product.content}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Volumen</span>
                    <span className="font-semibold text-foreground">{product.volume}</span>
                  </div>
                </div>

                <Badge className="w-full justify-center py-3 text-base bg-gradient-to-r from-accent/20 to-accent/10 text-accent border-accent/30 hover:from-accent/30 hover:to-accent/20 transition-all">
                  ✓ USO VETERINARIO
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-12 max-w-4xl mx-auto bg-gradient-to-br from-primary via-primary to-primary-dark text-primary-foreground shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold mb-8 text-center">Recomendaciones de Uso</h3>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6">
              <p className="font-bold text-lg mb-3">Dosis Inicial</p>
              <p className="text-2xl font-bold mb-2">0.5 - 2 mg/kg</p>
              <p className="text-primary-foreground/80 text-sm">Comenzar siempre con la dosis más baja</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6">
              <p className="font-bold text-lg mb-3">Frecuencia</p>
              <p className="text-2xl font-bold mb-2">Cada 12 horas</p>
              <p className="text-primary-foreground/80 text-sm">Ajustar según respuesta individual</p>
            </div>
          </div>
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <p className="text-primary-foreground/90 leading-relaxed text-center">
              Cada mascota es única. Nuestro equipo te ayudará a encontrar la dosis perfecta 
              para el bienestar de tu compañero.
            </p>
          </div>
          <Button 
            onClick={handleContact}
            size="lg"
            className="w-full text-lg py-7 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Phone className="mr-3 h-6 w-6" />
            Realizar Pedido por WhatsApp
          </Button>
        </Card>
      </div>
    </section>
  );
};

export default ProductsSection;
