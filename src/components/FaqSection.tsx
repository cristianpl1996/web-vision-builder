import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQS } from "@/data/content";
import { useReveal } from "@/hooks/use-reveal";

export function FaqSection() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="faq" className="section scroll-mt-20 bg-secondary/60" aria-labelledby="faq-title">
      <div className="container grid gap-10 lg:grid-cols-12">
        <div className="reveal lg:col-span-4">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2 id="faq-title" className="section-title mt-4">
            Resolvemos tus dudas
          </h2>
          <p className="section-lead">¿No encuentras tu respuesta? Escríbenos por WhatsApp y te asesoramos.</p>
        </div>
        <Accordion type="single" collapsible className="reveal space-y-3 lg:col-span-8">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="rounded-2xl border bg-card px-5 shadow-soft sm:px-6">
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline sm:text-lg">{f.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
