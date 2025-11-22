import { Card } from "@/components/ui/card";
import { Shield, Pill, Activity, Sparkles } from "lucide-react";

const InteractionsSection = () => {
  const interactions = [
    {
      icon: Shield,
      title: "Opioides",
      description: "Existe una relación fenotípica muy importante entre el sistema endocannabinoide y el sistema opioide endógeno, lo que fomenta una sinergia analgésica significativa.",
    },
    {
      icon: Pill,
      title: "AINES",
      description: "La inhibición selectiva de COX-2 promueve el aumento de los niveles de endocannabinoides. Algunos cannabinoides tienen inhibición directa sobre COX-2, generando sinergia analgésica.",
    },
    {
      icon: Activity,
      title: "Gabapentinoides",
      description: "Los receptores CB2, al activarse, son capaces de bloquear los canales de calcio dependientes del voltaje, de la misma manera que los gabapentinoides, generando sinergia analgésica.",
    },
    {
      icon: Sparkles,
      title: "Acetaminofén",
      description: "Los metabolitos activos del acetaminofén inhiben el efecto de degradación de la enzima FAAH del SEC, lo que alarga el efecto cannabinoide-receptor. Solo en caninos.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-primary">
          Interacciones Farmacológicas
        </h2>
        <p className="text-lg text-center text-muted-foreground mb-12 max-w-4xl mx-auto">
          Los cannabinoides pueden generar interacciones farmacológicas positivas con otros fármacos, 
          potenciando la analgesia de forma sinérgica.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {interactions.map((interaction) => {
            const Icon = interaction.icon;
            return (
              <Card 
                key={interaction.title}
                className="p-6 hover:shadow-lg transition-all border-primary/20"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">{interaction.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {interaction.description}
                </p>
              </Card>
            );
          })}
        </div>

        <Card className="p-8 max-w-4xl mx-auto bg-primary/5 border-primary/20">
          <p className="text-center text-lg text-foreground leading-relaxed">
            Los cannabinoides son una <span className="font-bold text-primary">herramienta terapéutica efectiva</span> para 
            tratar el dolor en perros y gatos, con beneficios adicionales en el bienestar emocional. 
            Además, pueden usarse de manera <span className="font-bold text-primary">segura a largo plazo</span> sin 
            efectos indeseados.
          </p>
        </Card>
      </div>
    </section>
  );
};

export default InteractionsSection;
