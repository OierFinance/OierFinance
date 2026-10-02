export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="wrap grid grid-cols-1 gap-8 pb-24 pt-16 sm:pt-20 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
      <div>
        <h1 className="h1">{title}</h1>
        <p className="mt-3 text-[14px] text-ink-3">Last updated {updated}</p>
      </div>
      <div className="prose-legal max-w-[720px] [&>*:first-child]:mt-0">{children}</div>
    </div>
  );
}
