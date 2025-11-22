import { Card } from "@/components/ui/card";
import { Leaf, Flower, Droplet } from "lucide-react";

const PhytocannabinoidsSection = () => {
  return (
    <section id="fitocannabinoides" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-primary">
          Fitocannabinoides
        </h2>
        <p className="text-lg text-center text-muted-foreground mb-12 max-w-4xl mx-auto">
          Existen más de 100 fitocannabinoides con efecto terapéutico en perros y gatos. 
          Los más reconocidos son CBD, THC y CBG.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 hover:shadow-xl transition-all border-primary/20">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary">CBD</h3>
            <p className="text-sm font-semibold mb-3 text-foreground">Cannabidiol</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Activación de receptores CB1 y CB2</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Inhibición del factor de crecimiento tumoral alfa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Activación de TRPV-1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Activación de receptores 5-HT1A de serotonina</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all border-primary/20">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Flower className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary">THC</h3>
            <p className="text-sm font-semibold mb-3 text-foreground">Tetrahidrocannabidiol</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Agonista CB1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Inhibición de síntesis de prostaglandina E2</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Estimulación de liberación de beta-endorfinas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Estimulación de la vía de las lipooxigenasas</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all border-primary/20">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Droplet className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary">CBG</h3>
            <p className="text-sm font-semibold mb-3 text-foreground">Cannabigerol</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Activación de receptores CB1 y CB2</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Agonista alfa 2</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Inhibición de recaptación de GABA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Inhibidor COX1 / COX2</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card className="p-8 max-w-4xl mx-auto bg-accent/5 border-accent/20">
          <h3 className="text-2xl font-bold mb-4 text-accent">Terpenos</h3>
          <p className="text-muted-foreground mb-6">
            Los terpenos son metabólitos secundarios que dan las características organolépticas de las plantas 
            y potencian la actividad de los cannabinoides.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold text-accent mb-2">LINALOL</h4>
              <p className="text-sm text-muted-foreground mb-1">Origen: Lavanda</p>
              <p className="text-sm text-foreground">Analgésico y ansiolítico</p>
            </div>
            <div>
              <h4 className="font-bold text-accent mb-2">MIRCENO</h4>
              <p className="text-sm text-muted-foreground mb-1">Origen: Lúpulo</p>
              <p className="text-sm text-foreground">Relajante muscular, antiinflamatorio y analgésico</p>
            </div>
            <div>
              <h4 className="font-bold text-accent mb-2">NEROLIDOL</h4>
              <p className="text-sm text-muted-foreground mb-1">Origen: Flor de naranjo</p>
              <p className="text-sm text-foreground">Citotóxico anti oncogénico</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default PhytocannabinoidsSection;
