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
    <section id="productos" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-primary">
          Nuestros Productos
        </h2>
        <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
          CBD + CBG + Terpenos en Broad Spectrum para uso veterinario
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {products.map((product) => (
            <Card key={product.name} className="overflow-hidden hover:shadow-2xl transition-all border-primary/20">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-48 h-auto object-contain drop-shadow-xl"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-primary">{product.name}</h3>
                  <Badge variant="secondary" className="text-sm">
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

                <Badge className="w-full justify-center py-2 bg-accent/10 text-accent border-accent/30 hover:bg-accent/20">
                  USO VETERINARIO
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 max-w-3xl mx-auto bg-primary text-primary-foreground">
          <h3 className="text-2xl font-bold mb-4 text-center">Opciones de Uso</h3>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="font-semibold mb-2">Dosis Sugerida</p>
              <p className="text-primary-foreground/90">0.5 – 2 mg/kg PO</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Posología</p>
              <p className="text-primary-foreground/90">Cada 12 horas</p>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/80 mb-6">
            En casos especiales la dosis podría llegar hasta 8mg/kg y ajustarse a cada 8 horas. 
            Siempre comenzar con la dosis más baja e ir ajustando según los resultados terapéuticos.
          </p>
          <Button 
            onClick={handleContact}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <Phone className="mr-2 h-5 w-5" />
            Realizar Pedido
          </Button>
        </Card>
      </div>
    </section>
  );
};

export default ProductsSection;
