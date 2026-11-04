import { Link } from "react-router-dom";
import logoDark from "@/assets/logo-sinergia-dark.png";
import logoLight from "@/assets/logo-sinergia-light.png";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="SINERGIA, ir al inicio" className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        src={light ? logoLight : logoDark}
        alt="SINERGIA CBD+CBG & Terpenos"
        width={1407}
        height={377}
        className="h-9 w-auto sm:h-10"
      />
    </Link>
  );
}
