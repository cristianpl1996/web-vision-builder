import { Card } from "@/components/ui/card";
import { Brain, Pill, Zap } from "lucide-react";

const SystemSection = () => {
  return (
    <section id="sistema" className="py-24 bg-gradient-to-b from-secondary to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary leading-tight">
            Bienestar Natural para tu Mascota
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Todos los mamíferos tienen un sistema natural que regula su bienestar. 
            Los cannabinoides ayudan a <span className="text-primary font-semibold">equilibrar este sistema</span>, 
            brindando alivio y calidad de vida.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 text-center hover:shadow-2xl transition-all hover:-translate-y-2 duration-300 bg-card border-primary/10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary">Alivio del Dolor</h3>
            <p className="text-muted-foreground leading-relaxed">
              Reduce molestias de forma natural, mejorando la movilidad y el confort de tu mascota.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-2xl transition-all hover:-translate-y-2 duration-300 bg-card border-primary/10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Pill className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary">Calma & Equilibrio</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ayuda a reducir la ansiedad y el estrés, promoviendo un estado emocional más estable.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-2xl transition-all hover:-translate-y-2 duration-300 bg-card border-primary/10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary">Vitalidad</h3>
            <p className="text-muted-foreground leading-relaxed">
              Mejora el apetito, la energía y la calidad de vida general de tu compañero.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SystemSection;
