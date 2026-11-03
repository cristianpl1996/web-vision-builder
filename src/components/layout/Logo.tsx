import { Link } from "react-router-dom";
import logoDark from "@/assets/logo-black-crop.png";
import logoLight from "@/assets/logo-white-crop.png";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="SINERGIA by BOTICAN, ir al inicio" className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        src={light ? logoLight : logoDark}
        alt="SINERGIA by BOTICAN"
        width={434}
        height={106}
        className="h-8 w-auto sm:h-9"
      />
    </Link>
  );
}
