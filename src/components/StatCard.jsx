export default function StatCard({ title, value, subtitle, tone = 'sky' }) {
  const styles = {
    sky: 'border-teal-200 bg-gradient-to-br from-teal-50 to-white text-teal-700',
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-700',
    violet: 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white text-cyan-700',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-700',
    rose: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white text-rose-700',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[tone] || styles.sky}`}>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
      </div>
      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
