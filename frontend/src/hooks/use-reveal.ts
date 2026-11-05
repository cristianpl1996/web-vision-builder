import { useEffect, useRef } from "react";

/**
 * Agrega `is-visible` a los `.reveal` dentro del ref cuando entran en pantalla.
 * También observa los que aparecen DESPUÉS (p. ej. las tarjetas que llegan de la API):
 * sin eso se quedarían con opacidad 0 para siempre.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!("IntersectionObserver" in window)) {
      root.querySelectorAll<HTMLElement>(".reveal").forEach((t) => t.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    const observar = () =>
      root.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((t) => io.observe(t));
    observar();
    const mo = new MutationObserver(observar);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return ref;
}
