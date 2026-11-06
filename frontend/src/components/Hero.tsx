import { useEffect, useState } from "react";
import { ArrowRight, Leaf, Droplet, PawPrint, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import petsImage from "@/assets/pets-hero.webp";
import petsImageSm from "@/assets/pets-hero-sm.webp";
import { useCatalog } from "@/context/CatalogContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";


/** Base: a fresh, lighter green (not the near-black of before). */
const BASE = "linear-gradient(115deg, hsl(153 46% 26%) 0%, hsl(150 40% 34%) 55%, hsl(146 36% 42%) 100%)";

/** Wash ON TOP of the pets: green from the copy side, opening up so the pets stay visible. */
const DESKTOP_WASH = [
  "linear-gradient(90deg, hsl(154 48% 20% / 0.85) 0%, hsl(153 46% 23% / 0.6) 26%, hsl(152 44% 26% / 0.18) 40%, transparent 52%)",
  "linear-gradient(180deg, hsl(154 48% 20% / 0.35) 0%, transparent 25%, transparent 78%, hsl(154 48% 20% / 0.45) 100%)",
].join(",");

const MOBILE_WASH =
  "linear-gradient(180deg, hsl(154 48% 20% / 0.4) 0%, transparent 14%, transparent 34%, hsl(153 46% 25% / 0.9) 46%, hsl(153 46% 25%) 54%)";

/** The featured card cycles through the presentations (answers "¿esta imagen irá cambiando?"). */
function useRotating(length: number, ms = 4200) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % length), ms);
    return () => clearInterval(t);
  }, [paused, length, ms]);
  return { i, setI, setPaused };
}

const Hero = () => {
  const { add } = useCart();
  const { price, priceOrQuote } = useCurrency();
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  // El carrusel muestra lo que se puede comprar, empezando por el destacado.
  const { products } = useCatalog();
  const PRODUCTS = [...products.filter((p) => !p.soldOut)].sort((a, b) => Number(b.featured) - Number(a.featured));
  const prices = PRODUCTS.map((p) => p.price).filter((v): v is number => v !== null);
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const { i, setI, setPaused } = useRotating(PRODUCTS.length);
  const featured = PRODUCTS[i % Math.max(PRODUCTS.length, 1)];

  return (
    <section className="relative isolate overflow-hidden text-white" style={{ backgroundImage: BASE }} aria-labelledby="hero-title">
      {/* Pets as the background: the doctor's own dog and cat */}
      <picture className="absolute inset-x-[8%] top-[92px] -z-20 block h-[56vw] max-h-[340px] md:bottom-0 md:left-[46%] md:right-[2%] md:top-[14%] md:h-auto md:max-h-none lg:left-[33%] lg:right-[22%] xl:left-[29%] xl:right-[33%]">
        <source media="(max-width: 767px)" srcSet={petsImageSm} />
        <img
          src={petsImage}
          alt=""
          {...{ fetchpriority: "high" }}
          className="h-full w-full object-contain object-bottom [filter:saturate(0.95)]"
          style={{
            // Melt the cutout into the scene: soft fade at the bottom and sides, no hard edges
            WebkitMaskImage: "linear-gradient(to top, transparent 0%, #000 16%), linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskImage: "linear-gradient(to top, transparent 0%, #000 16%), linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)",
            maskComposite: "intersect",
          }}
        />
        {/* soft green glow behind the pets so they sit in the scene */}
        <span aria-hidden className="absolute inset-x-[10%] bottom-[8%] -z-10 h-[70%] rounded-full bg-[hsl(140_55%_70%/0.22)] blur-3xl" />
      </picture>
      <div aria-hidden className="absolute inset-0 -z-10 md:hidden" style={{ backgroundImage: MOBILE_WASH }} />
      <div aria-hidden className="absolute inset-0 -z-10 hidden md:block" style={{ backgroundImage: DESKTOP_WASH }} />

      <div className="container grid items-end gap-10 pb-10 pt-[calc(84px+min(56vw,340px))] md:min-h-[560px] md:items-center md:pb-14 md:pt-28 lg:min-h-[min(max(620px,36vw),720px)] lg:grid-cols-12">
        {/* Copy */}
        <div className="lg:col-span-6">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-md">
            CBD + CBG + TERPENOS · Broad Spectrum
          </span>

          <h1
            id="hero-title"
            className="mt-5 animate-fade-up font-display text-[2.7rem] font-medium leading-[1.02] [animation-delay:80ms] [text-shadow:0_2px_30px_rgb(0_25_15/0.55)] sm:text-6xl xl:text-[4.5rem]"
          >
            Sinergia,
            <span className="block italic text-[hsl(140_55%_86%)]">más en cada gota.</span>
          </h1>

          <p className="mt-5 max-w-xl animate-fade-up text-base leading-relaxed text-white/90 [animation-delay:160ms] [text-shadow:0_1px_14px_rgb(0_25_15/0.6)] sm:text-lg">
            La fórmula perfecta para el bienestar de tu mascota. Combinamos los mejores fitocannabinoides y terpenos naturales
            para brindar un alivio completo y seguro.
          </p>

          <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <Button size="xl" variant="light" onClick={() => scrollTo("productos")} className="w-full sm:w-auto">
              {fromPrice === null ? "Ver presentaciones" : `Comprar desde ${price(fromPrice)}`} <ArrowRight />
            </Button>
            <Button size="xl" variant="glass" onClick={() => scrollTo("beneficios")} className="w-full sm:w-auto">
              Conoce los beneficios
            </Button>
          </div>

          <ul className="mt-7 flex animate-fade-up flex-wrap justify-center gap-2 text-xs text-white/95 [animation-delay:320ms] sm:justify-start sm:gap-6 sm:text-sm">
            {[
              { icon: Leaf, text: "CBD + CBG" },
              { icon: Droplet, text: "Terpenos naturales" },
              { icon: PawPrint, text: "Perros y gatos" },
            ].map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3 sm:border-0 sm:bg-transparent sm:p-0"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Featured product: same large card as before, right-aligned, cycling through the presentations */}
        <div className="hidden lg:col-span-6 lg:flex lg:justify-end">
          {featured && (
          <article
            className="relative w-[340px] animate-fade-up [animation-delay:300ms]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carrusel"
            aria-label="Presentaciones destacadas"
          >
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[hsl(150_60%_30%/0.35)] blur-3xl" aria-hidden />
            <div className="rounded-[2rem] border border-white/20 bg-[linear-gradient(160deg,hsl(154_45%_22%/0.82),hsl(153_48%_16%/0.88))] p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-[radial-gradient(120%_90%_at_50%_15%,hsl(140_40%_96%),hsl(145_32%_86%))]">
                <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                  Destacado
                </span>
                <span className="absolute right-4 top-4 z-10 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {featured.concentration}
                </span>
                <div className="absolute bottom-6 left-1/2 h-4 w-32 -translate-x-1/2 rounded-[100%] bg-foreground/15 blur-md" />
                <div className="relative h-[260px]">
                  {PRODUCTS.map((p, idx) => (
                    <img
                      key={p.id}
                      src={p.bottle}
                      alt={idx === i ? p.name : ""}
                      aria-hidden={idx !== i}
                      style={{ height: `${150 + p.bottleScale * 60}px` }}
                      className={cn(
                        "absolute bottom-7 left-1/2 w-auto -translate-x-1/2 object-contain drop-shadow-[0_20px_22px_rgba(0,0,0,0.25)] transition-all duration-700 ease-out",
                        idx === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="px-2 pb-1 pt-4" aria-live="polite">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(140_55%_80%)]">CBD + CBG + Terpenos</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="whitespace-nowrap font-display text-[1.4rem] leading-tight">{featured.name}</p>
                    <p className="text-sm text-white/75">
                      {featured.concentration} · {featured.volume}
                    </p>
                  </div>
                  <p className={featured.price === null ? "text-right text-xs font-semibold leading-tight text-white/85" : "price text-2xl font-bold"}>
                    {priceOrQuote(featured.price)}
                  </p>
                </div>
                <Button variant="light" size="lg" className="mt-4 w-full" onClick={() => add(featured.id)}>
                  <ShoppingBag /> Agregar al carrito
                </Button>
                <div className="mt-3 flex justify-center gap-1.5">
                  {PRODUCTS.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setI(idx)}
                      aria-label={`Ver ${p.name}`}
                      aria-current={idx === i}
                      className={cn("h-1.5 rounded-full transition-all cursor-pointer", idx === i ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </article>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
