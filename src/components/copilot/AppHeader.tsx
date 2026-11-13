import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

const nav = "rounded px-3 py-1.5 text-sm font-semibold opacity-80 hover:opacity-100";
export function AppHeader() {
  return (
    <header className="bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold">OT</div>
          <div><p className="text-sm font-bold leading-tight">OpenText · Sales Cloud</p><p className="text-[11px] opacity-70">AE Partner Co-Pilot</p></div>
        </div>
        <nav className="flex items-center gap-1">
          <Link to="/" className={nav} activeOptions={{ exact: true }} activeProps={{ className: "bg-primary opacity-100" }}>Workspace</Link>
          <Link to="/pipeline" className={nav} activeProps={{ className: "bg-primary opacity-100" }}>Pipeline</Link>
        </nav>
        <span className="hidden items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-semibold text-success-foreground md:flex"><CheckCircle2 className="h-3.5 w-3.5" />Synced with Salesforce</span>
      </div>
    </header>
  );
}
