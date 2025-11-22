import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const InteractionsSection = () => {

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary leading-tight">
            Complemento Perfecto
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            SINERGIA trabaja de forma segura junto con otros tratamientos, 
            <span className="text-primary font-semibold"> potenciando sus beneficios</span> sin efectos adversos.
          </p>
        </div>

        <Card className="p-12 max-w-4xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-lg">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium">
              <span className="text-primary font-bold">Seguro y efectivo</span> para uso a largo plazo.
              <br className="hidden md:block" />
              Tu mascota merece el mejor cuidado natural.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default InteractionsSection;
