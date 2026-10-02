export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="wrap pb-20 pt-14 sm:pt-20">
      <p className="tag">Legal</p>
      <h1 className="h2 mt-4">{title}</h1>
      <p className="mt-3 text-[13px] text-ink-3">Last updated {updated}</p>
      <div className="prose-legal mt-8 max-w-[760px]">{children}</div>
    </div>
  );
}
