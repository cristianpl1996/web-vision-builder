import { MessageCircle, Instagram, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORE } from "@/data/products";
import { useReveal } from "@/hooks/use-reveal";

const ContactSection = () => {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="contacto" className="section scroll-mt-20" aria-labelledby="contacto-title">
      <div className="container">
        <div className="reveal relative isolate overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(55% 80% at 85% 30%, hsl(140 55% 70% / 0.35), transparent 70%), linear-gradient(115deg, hsl(154 50% 20%), hsl(150 42% 32%))",
            }}
          />
          <div className="grid gap-8 p-6 sm:gap-10 sm:p-12 lg:grid-cols-2 lg:items-center lg:p-16 [&>*]:min-w-0">
            <div>
              <h2 id="contacto-title" className="font-display text-3xl font-medium leading-tight sm:text-5xl">
                ¿Tienes dudas? <span className="italic text-white/80">Te asesoramos.</span>
              </h2>
              <p className="mt-4 max-w-md text-white/80 sm:text-lg">
                Nuestro equipo te ayuda a elegir la presentación correcta y resuelve todas tus preguntas.
              </p>
            </div>
            <div className="grid gap-3">
              <a
                href={`https://wa.me/${STORE.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/15 sm:gap-4 sm:p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12 bg-[#25D366]">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-white/70">WhatsApp</span>
                  <span className="price block text-base font-semibold sm:text-lg">{STORE.whatsappDisplay}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href={`https://instagram.com/${STORE.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/15 sm:gap-4 sm:p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12 bg-gradient-to-br from-fuchsia-500 to-amber-400">
                  <Instagram className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-white/70">Síguenos</span>
                  <span className="block truncate text-base font-semibold sm:text-lg">@{STORE.instagram}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <Button asChild size="xl" variant="light" className="mt-2">
                <a href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hola, quiero asesoría sobre SINERGIA")}`} target="_blank" rel="noopener noreferrer">
                  Hablar con un asesor
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
