import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";
import logoImage from "@/assets/logo.png";

const ContactSection = () => {
  return (
    <section id="contacto" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-primary">
          Contacto
        </h2>
        <p className="text-lg text-center text-muted-foreground mb-12">
          ¿Tienes dudas? Estamos aquí para ayudarte
        </p>

        <Card className="max-w-2xl mx-auto p-8 text-center">
          <img 
            src={logoImage} 
            alt="Sinergia by Botican" 
            className="w-32 h-auto mx-auto mb-6"
          />
          
          <h3 className="text-2xl font-bold mb-6 text-primary">HAGAMOS SINERGIA</h3>

          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-center gap-4 text-foreground">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Teléfono / WhatsApp</p>
                <p className="font-semibold">(+52) 55 4899 39 02</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-foreground">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Instagram</p>
                <p className="font-semibold">@marczuk.mario</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-foreground">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-semibold">by BOTICAN</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.open("https://wa.me/525548993902", "_blank")}
              className="w-full sm:w-auto"
            >
              <Phone className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.open("https://instagram.com/marczuk.mario", "_blank")}
              className="w-full sm:w-auto"
            >
              <Mail className="mr-2 h-5 w-5" />
              Instagram
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
