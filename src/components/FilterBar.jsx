export default function FilterBar({ children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">{children}</div>
    </div>
  );
}
