import { BENEFITS } from "@/data/benefits";
import { useReveal } from "@/hooks/use-reveal";


const SystemSection = () => {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="beneficios" className="section scroll-mt-20" aria-labelledby="beneficios-title">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="reveal lg:col-span-5">
            <span className="eyebrow">Sistema endocannabinoide</span>
            <h2 id="beneficios-title" className="section-title mt-4">
              Todos los mamíferos tienen un sistema natural que regula su funcionalidad.
            </h2>
            <p className="section-lead">
              Los cannabinoides ayudan a{" "}
              <strong className="font-semibold text-primary">equilibrar este sistema</strong>, brindando alivio y calidad de vida.
            </p>

            <dl className="mt-10 grid grid-cols-3 divide-x rounded-3xl border bg-card p-2 shadow-soft">
              {[
                { k: "3", v: "componentes naturales" },
                { k: "8", v: "presentaciones" },
                { k: "3", v: "concentraciones" },
              ].map((s) => (
                <div key={s.v} className="min-w-0 px-1.5 py-4 text-center sm:px-3">
                  <dt className="sr-only">{s.v}</dt>
                  <dd className="font-display text-3xl font-medium text-primary sm:text-4xl">{s.k}</dd>
                  <dd className="mt-1 text-[10px] leading-tight text-muted-foreground min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ul className="grid gap-4 sm:gap-5 lg:col-span-7">
            {BENEFITS.map(({ icon: Icon, title, lead, text }, i) => (
              <li
                key={title}
                className="reveal surface flex gap-5 p-6 transition-shadow hover:shadow-medium sm:p-8"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-glow">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-medium">{title}</h3>
                  <p className="mt-2 font-semibold leading-snug text-foreground/85">{lead}</p>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SystemSection;
