import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <SiteLayout>
    <div className="container grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-7xl text-primary">404</p>
        <h1 className="mt-4 font-display text-3xl">No encontramos esta página</h1>
        <p className="mt-2 text-muted-foreground">Puede que el enlace haya cambiado.</p>
        <Button asChild className="mt-6"><Link to="/">Volver al inicio</Link></Button>
      </div>
    </div>
  </SiteLayout>
);

export default NotFound;
