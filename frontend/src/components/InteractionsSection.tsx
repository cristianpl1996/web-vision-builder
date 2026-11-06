import { ShoppingBag, UserCheck, PackageCheck } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { paymentPhrase, useStoreConfig } from "@/services/store";

const steps = [
  { icon: ShoppingBag, title: "Elige tu presentación", text: "Agrega al carrito la presentación que mejor se adapte a tu mascota." },
  { icon: UserCheck, title: "Crea tu cuenta", text: "Solo al finalizar la compra. Guarda tus direcciones y consulta tus pedidos." },
  { icon: PackageCheck, title: "Paga y recíbelo", text: "Paga {formas_de_pago}. Te avisamos cuando salga, con número de guía." },
];

/** "Cómo comprar" + safe-complement message */
const InteractionsSection = () => {
  const ref = useReveal<HTMLElement>();
  const { data: config } = useStoreConfig();
  return (
    <section ref={ref} className="section bg-card" aria-labelledby="como-comprar-title">
      <div className="container">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="eyebrow">Cómo comprar</span>
          <h2 id="como-comprar-title" className="section-title mt-4">
            Tres pasos y listo
          </h2>
        </div>

        <ol className="relative mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          <div aria-hidden className="absolute left-[16%] right-[16%] top-9 hidden h-px border-t border-dashed border-primary/30 md:block" />
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="reveal relative flex gap-5 md:flex-col md:items-center md:text-center" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full border-4 border-card bg-secondary text-primary shadow-soft">
                <Icon className="h-7 w-7" />
                <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="font-display text-xl font-medium sm:text-2xl">{title}</h3>
                <p className="mt-2 text-muted-foreground">{text.replace("{formas_de_pago}", paymentPhrase(config))}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="reveal mt-14 rounded-3xl border border-primary/15 bg-gradient-to-br from-secondary to-background p-8 text-center sm:p-12">
          <p className="mx-auto max-w-3xl font-display text-2xl leading-snug sm:text-3xl">
            SINERGIA trabaja de forma segura junto con otros tratamientos,{" "}
            <em className="text-primary">potenciando sus beneficios.</em>
          </p>
          <p className="mt-4 text-muted-foreground">
            <strong className="text-primary">Seguro y efectivo</strong> para uso a largo plazo. Tu mascota merece el mejor cuidado natural.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InteractionsSection;
