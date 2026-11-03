import { Leaf, Droplet, Flower2 } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import bottle from "@/assets/bottle-750.webp";

const actives = [
  {
    icon: Leaf,
    name: "CBD",
    role: "El protagonista",
    text: "Alivia el dolor, reduce la inflamación y calma la ansiedad. Es el componente principal que mejora la calidad de vida de tu mascota de forma natural y segura.",
  },
  {
    icon: Droplet,
    name: "CBG",
    role: "El potenciador",
    text: "Trabaja en sinergia con el CBD para amplificar sus beneficios. Ayuda especialmente con la relajación muscular y el bienestar general.",
  },
];

const terpenes = [
  { name: "Lavanda", benefit: "Calma y relajación", text: "Reduce la ansiedad naturalmente" },
  { name: "Lúpulo", benefit: "Alivio muscular", text: "Relaja y reduce la inflamación" },
  { name: "Naranjo", benefit: "Protección celular", text: "Apoyo antioxidante natural" },
];

const PhytocannabinoidsSection = () => {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="formula" className="section scroll-mt-20 bg-secondary/60" aria-labelledby="formula-title">
      <div className="container">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="eyebrow">La fórmula</span>
          <h2 id="formula-title" className="section-title mt-4">
            Ingredientes naturales, <em className="text-primary">resultados reales.</em>
          </h2>
          <p className="section-lead">
            Nuestra fórmula combina componentes naturales de la planta que trabajan juntos para maximizar el bienestar de tu mascota.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-6 lg:mt-16 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
          {actives.map(({ icon: Icon, name, role, text }, i) => (
            <article
              key={name}
              className={`reveal surface p-7 sm:p-9 ${i === 1 ? "lg:order-3" : ""}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-4xl font-medium leading-none">{name}</h3>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-primary">{role}</p>
                </div>
              </div>
              <p className="mt-5 leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}

          <div className="reveal relative order-first mx-auto flex h-[280px] w-52 items-center justify-center sm:h-[330px] lg:order-2 lg:h-[390px] lg:w-64">
            <div className="absolute inset-x-0 bottom-6 top-10 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-2 left-1/2 h-6 w-40 -translate-x-1/2 rounded-[100%] bg-foreground/15 blur-md" />
            <img
              src={bottle}
              alt="Frasco SINERGIA 750 mg"
              loading="lazy"
              width={112}
              height={350}
              className="relative h-full w-auto animate-float object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.25)]"
            />
          </div>
        </div>

        <div className="reveal mt-6 overflow-hidden rounded-3xl bg-primary-dark text-primary-foreground lg:mt-10">
          <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent">
                  <Flower2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-3xl font-medium">Terpenos naturales</h3>
              </div>
              <p className="mt-4 leading-relaxed text-white/75">
                Extractos aromáticos de plantas que potencian el efecto de los cannabinoides y aportan beneficios adicionales.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3 lg:col-span-8">
              {terpenes.map((t) => (
                <li key={t.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="font-display text-2xl">{t.name}</p>
                  <p className="mt-2 font-semibold text-white">{t.benefit}</p>
                  <p className="mt-1 text-sm text-white/65">{t.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhytocannabinoidsSection;
