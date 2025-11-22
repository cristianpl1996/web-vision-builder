import { Card } from "@/components/ui/card";
import { Leaf, Flower, Droplet } from "lucide-react";

const PhytocannabinoidsSection = () => {
  return (
    <section id="fitocannabinoides" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary leading-tight">
            Ingredientes Naturales, Resultados Reales
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Nuestra fórmula combina componentes naturales de la planta que trabajan juntos 
            para maximizar el bienestar de tu mascota.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          <Card className="p-10 hover:shadow-2xl transition-all hover:-translate-y-1 duration-300 bg-gradient-to-br from-card to-secondary/30 border-primary/10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Leaf className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-3xl font-bold mb-4 text-primary">CBD</h3>
            <p className="text-lg mb-4 text-foreground font-medium">El Protagonista</p>
            <p className="text-muted-foreground leading-relaxed">
              Alivia el dolor, reduce la inflamación y calma la ansiedad. Es el componente principal 
              que mejora la calidad de vida de tu mascota de forma natural y segura.
            </p>
          </Card>

          <Card className="p-10 hover:shadow-2xl transition-all hover:-translate-y-1 duration-300 bg-gradient-to-br from-card to-secondary/30 border-primary/10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Droplet className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-3xl font-bold mb-4 text-primary">CBG</h3>
            <p className="text-lg mb-4 text-foreground font-medium">El Potenciador</p>
            <p className="text-muted-foreground leading-relaxed">
              Trabaja en sinergia con el CBD para amplificar sus beneficios. Ayuda especialmente 
              con la relajación muscular y el bienestar general.
            </p>
          </Card>
        </div>

        <Card className="p-10 max-w-4xl mx-auto bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
              <Flower className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-3xl font-bold text-accent">Terpenos Naturales</h3>
          </div>
          <p className="text-center text-lg text-muted-foreground mb-8 leading-relaxed">
            Extractos aromáticos de plantas que potencian el efecto de los cannabinoides 
            y aportan beneficios adicionales.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-background/50 rounded-xl">
              <h4 className="font-bold text-xl text-accent mb-3">Lavanda</h4>
              <p className="text-foreground font-medium mb-2">Calma & Relajación</p>
              <p className="text-sm text-muted-foreground">Reduce la ansiedad naturalmente</p>
            </div>
            <div className="text-center p-6 bg-background/50 rounded-xl">
              <h4 className="font-bold text-xl text-accent mb-3">Lúpulo</h4>
              <p className="text-foreground font-medium mb-2">Alivio Muscular</p>
              <p className="text-sm text-muted-foreground">Relaja y reduce inflamación</p>
            </div>
            <div className="text-center p-6 bg-background/50 rounded-xl">
              <h4 className="font-bold text-xl text-accent mb-3">Naranjo</h4>
              <p className="text-foreground font-medium mb-2">Protección Celular</p>
              <p className="text-sm text-muted-foreground">Apoyo antioxidante natural</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default PhytocannabinoidsSection;
