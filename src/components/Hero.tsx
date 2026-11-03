import { ArrowRight, Leaf, Droplet, PawPrint, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bg.webp";
import heroImageSm from "@/assets/hero-bg-sm.webp";
import { PRODUCTS } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

const featured = PRODUCTS.find((p) => p.featured) ?? PRODUCTS[2];
const fromPrice = Math.min(...PRODUCTS.map((p) => p.price));

/**
 * One continuous wash: near-black green on the left that keeps turning green
 * across the whole photo, plus a soft top/bottom vignette.
 */
const DESKTOP_WASH = [
  "linear-gradient(90deg, hsl(155 65% 6% / 0.96) 0%, hsl(155 62% 9% / 0.88) 28%, hsl(153 58% 15% / 0.55) 50%, hsl(152 55% 22% / 0.28) 72%, hsl(150 50% 28% / 0.14) 100%)",
  "linear-gradient(180deg, hsl(155 65% 5% / 0.55) 0%, transparent 22%, transparent 72%, hsl(155 65% 6% / 0.75) 100%)",
].join(",");

const MOBILE_WASH = [
  "linear-gradient(180deg, hsl(155 65% 5% / 0.6) 0%, hsl(153 55% 18% / 0.25) 18%, hsl(153 58% 14% / 0.55) 32%, hsl(155 62% 9% / 0.94) 44%, hsl(155 65% 7%) 54%)",
].join(",");

const Hero = () => {
  const { add } = useCart();
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative isolate overflow-hidden bg-[hsl(155_65%_7%)] text-white" aria-labelledby="hero-title">
      {/* Background — photo: Krista Mangulsone / Unsplash (Unsplash License), mirrored */}
      <picture className="absolute inset-x-0 top-0 -z-20 block h-[48%] md:inset-0 md:h-full">
        <source media="(max-width: 767px)" srcSet={heroImageSm} />
        <img src={heroImage} alt="" {...{ fetchpriority: "high" }} className="h-full w-full object-cover object-[center_35%] md:object-[center_42%]" />
      </picture>
      <div aria-hidden className="absolute inset-0 -z-10 md:hidden" style={{ backgroundImage: MOBILE_WASH }} />
      <div aria-hidden className="absolute inset-0 -z-10 hidden md:block" style={{ backgroundImage: DESKTOP_WASH }} />

      <div className="container grid items-end gap-8 pb-8 pt-[42vw] md:min-h-[560px] md:items-center md:pb-12 md:pt-24 lg:min-h-[min(max(600px,34vw),680px)] lg:grid-cols-12">
        {/* Copy */}
        <div className="lg:col-span-6">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-md">
            CBD + CBG + TERPENOS · Broad Spectrum
          </span>

          <h1
            id="hero-title"
            className="mt-5 animate-fade-up font-display text-[2.6rem] font-medium leading-[1.02] [animation-delay:80ms] [text-shadow:0_2px_30px_rgb(0_0_0/0.35)] sm:text-6xl xl:text-[4.5rem]"
          >
            Bienestar natural
            <span className="block italic text-[hsl(145_40%_80%)]">para tu mascota.</span>
          </h1>

          <p className="mt-5 max-w-xl animate-fade-up text-base leading-relaxed text-white/85 [animation-delay:160ms] sm:text-lg">
            La fórmula perfecta para el bienestar de tu mascota. Combinamos los mejores fitocannabinoides y terpenos naturales
            para brindar un alivio completo y seguro.
          </p>

          <div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <Button size="xl" variant="light" onClick={() => scrollTo("productos")} className="w-full sm:w-auto">
              Comprar desde {formatPrice(fromPrice)} <ArrowRight />
            </Button>
            <Button size="xl" variant="glass" onClick={() => scrollTo("beneficios")} className="w-full sm:w-auto">
              Conoce los beneficios
            </Button>
          </div>

          <ul className="mt-7 flex animate-fade-up flex-wrap justify-center gap-2 text-xs text-white/90 [animation-delay:320ms] sm:justify-start sm:gap-6 sm:text-sm">
            {[
              { icon: Leaf, text: "CBD + CBG" },
              { icon: Droplet, text: "Terpenos naturales" },
              { icon: PawPrint, text: "Perros y gatos" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-1.5 pr-3 sm:border-0 sm:bg-transparent sm:p-0">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Featured product — large card, vertically centered, aligned to the right edge (mirrors the logo / "Comprar ahora") */}
        <div className="hidden lg:col-span-6 lg:flex lg:justify-end">
          <article className="relative w-[340px] animate-fade-up [animation-delay:300ms]">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[hsl(145_60%_45%/0.25)] blur-3xl" aria-hidden />
            <div className="rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-background">
                <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                  Destacado
                </span>
                <span className="absolute right-4 top-4 z-10 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                  {featured.concentration}
                </span>
                <div className="absolute bottom-6 left-1/2 h-4 w-32 -translate-x-1/2 rounded-[100%] bg-foreground/15 blur-md" />
                <div className="flex h-[260px] items-end justify-center pb-7 pt-11">
                  <img src={featured.bottle} alt={featured.name} className="h-full w-auto animate-float object-contain drop-shadow-[0_20px_22px_rgba(0,0,0,0.25)]" />
                </div>
              </div>
              <div className="px-2 pb-1 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">CBD + CBG + Terpenos</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div>
                    <p className="whitespace-nowrap font-display text-[1.4rem] leading-tight">{featured.name}</p>
                    <p className="text-sm text-white/70">
                      {featured.concentration} · {featured.volume}
                    </p>
                  </div>
                  <p className="price text-2xl font-bold">{formatPrice(featured.price)}</p>
                </div>
                <Button variant="light" size="lg" className="mt-4 w-full" onClick={() => add(featured.id)}>
                  <ShoppingBag /> Agregar al carrito
                </Button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Hero;
