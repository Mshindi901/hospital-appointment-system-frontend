export default function StatCard({ title, value, subtitle, tone = 'sky' }) {
  const styles = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[tone] || styles.sky}`}>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
      </div>
      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
