import { Card } from "@/components/ui/card";
import { Brain, Pill, Zap } from "lucide-react";

const SystemSection = () => {
  return (
    <section id="sistema" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-primary">
          Sistema Endocannabinoide
        </h2>
        <p className="text-lg text-center text-muted-foreground mb-12 max-w-4xl mx-auto">
          El sistema endocannabinoide (SEC) está presente en prácticamente todas las especies animales 
          y juega un papel fundamental en el manejo del dolor y las emociones.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-primary">Endocannabinoides</h3>
            <ul className="text-muted-foreground space-y-2">
              <li>Anandamida</li>
              <li>2-AG (2-arquidonil glicerol)</li>
            </ul>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-primary">Receptores</h3>
            <ul className="text-muted-foreground space-y-2">
              <li>CB1</li>
              <li>CB2</li>
            </ul>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-primary">Enzimas</h3>
            <ul className="text-muted-foreground space-y-2">
              <li>FAAH</li>
              <li>MAGL</li>
            </ul>
          </Card>
        </div>

        <Card className="p-8 max-w-4xl mx-auto bg-primary/5 border-primary/20">
          <h3 className="text-2xl font-bold mb-4 text-primary">Tono del SEC</h3>
          <p className="text-muted-foreground mb-4">
            La actividad del SEC está determinada por el tono del SEC, que depende del perfil genético único de cada individuo y determina:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Producción de endocannabinoides</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Eficiencia de FAAH y MAGL</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Distribución de receptores CB1 y CB2</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Variabilidad de respuesta del paciente frente a los cannabinoides</span>
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
};

export default SystemSection;
