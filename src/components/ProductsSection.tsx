import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import productImage1500 from "@/assets/Sinergia_1500mg.png";
import productImage1000 from "@/assets/Sinergia_1000mg.png";
import productImage750 from "@/assets/Sinergia_750mg.png";
import productImage500 from "@/assets/Sinergia_500mg.png";
import productImage250 from "@/assets/Sinergia_250mg.png";

const ProductsSection = () => {
  const products = [
    {
      name: "SINERGIA 250",
      image: productImage250,
      concentration: "25 mg/ml",
      cbd: "25 mg/ml de CBD",
      cbg: "0.5 mg/ml de CBG",
      content: "250 mg total",
      volume: "10 ml",
    },
    {
      name: "SINERGIA 500",
      image: productImage500,
      concentration: "25 mg/ml",
      cbd: "25 mg/ml de CBD",
      cbg: "0.5 mg/ml de CBG",
      content: "500 mg total",
      volume: "20 ml",
    },
    {
      name: "SINERGIA 750",
      image: productImage750,
      concentration: "25 mg/ml",
      cbd: "25 mg/ml de CBD",
      cbg: "0.5 mg/ml de CBG",
      content: "750 mg total",
      volume: "30 ml",
    },
    {
      name: "SINERGIA 1000",
      image: productImage1000,
      concentration: "50 mg/ml",
      cbd: "50 mg/ml de CBD",
      cbg: "1 mg/ml de CBG",
      content: "1000 mg total",
      volume: "40 ml",
    },
    {
      name: "SINERGIA 1500",
      image: productImage1500,
      concentration: "50 mg/ml",
      cbd: "50 mg/ml de CBD",
      cbg: "1 mg/ml de CBG",
      content: "1500 mg total",
      volume: "60 ml",
    },
  ];

  return (
    <section id="productos" className="py-24 bg-gradient-to-b from-secondary to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary leading-tight">
            Elige la Mejor Opción
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Cinco presentaciones diseñadas para adaptarse a las necesidades de tu mascota
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {products.map((product, index) => (
            <Card key={product.name} className="overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-primary/10 bg-gradient-to-br from-card to-secondary/20">
              <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent animate-pulse" />
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-48 lg:w-56 h-auto object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl lg:text-3xl font-bold text-primary">{product.name}</h3>
                  <Badge className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                  CBD/CBG
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
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
