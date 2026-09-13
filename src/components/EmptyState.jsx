export default function EmptyState({ title = 'No records found.', message = 'There is nothing to display right now.' }) {
  return (
    <div className="flex min-h-50 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}
