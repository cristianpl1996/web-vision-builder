import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";
import logoImage from "@/assets/logo-white.png";

const ContactSection = () => {
  return (
    <section id="contacto" className="py-24 bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-primary leading-tight">
            Hagamos <span className="text-primary font-normal">SINERGIA</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            ¿Tienes dudas? Estamos aquí para asesorarte
          </p>
        </div>

        <Card className="max-w-3xl mx-auto p-12 text-center shadow-2xl bg-gradient-to-br from-card to-secondary/30">


          <div className="space-y-6 mb-10">
            <div className="flex items-center justify-center gap-6 text-foreground bg-primary/5 rounded-2xl p-6 hover:bg-primary/10 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Phone className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground mb-1">WhatsApp</p>
                <p className="text-xl font-bold text-primary">(+52) 55 4899 39 02</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-foreground bg-primary/5 rounded-2xl p-6 hover:bg-primary/10 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Mail className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground mb-1">Síguenos</p>
                <p className="text-xl font-bold text-primary">@marczuk.mario</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-foreground bg-primary/5 rounded-2xl p-6 hover:bg-primary/10 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground mb-1">Desarrollado por</p>
                <p className="text-xl font-bold text-primary">BOTICAN</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.open("https://wa.me/525548993902", "_blank")}
              className="w-full sm:w-auto text-lg py-6 px-8 bg-primary hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <Phone className="mr-3 h-6 w-6" />
              Enviar WhatsApp
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.open("https://instagram.com/marczuk.mario", "_blank")}
              className="w-full sm:w-auto text-lg py-6 px-8 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-xl transition-all hover:scale-105"
            >
              <Mail className="mr-3 h-6 w-6" />
              Ver Instagram
            </Button>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 SINERGIA by BOTICAN. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Uso Veterinario - Cannabinoides en la clínica diaria de perros y gatos
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
