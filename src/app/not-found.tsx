import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap grid min-h-[60vh] place-content-center py-24 text-center">
        <p className="formula">route ∈ ∅</p>
        <h1 className="h2 mt-4">No rule leads here.</h1>
        <p className="lead mx-auto mt-4 max-w-[480px]">The page you asked for does not exist.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-acc">Home</Link>
          <Link href="/studio" className="btn btn-ghost">Rule Studio</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
