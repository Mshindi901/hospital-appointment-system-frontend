import { ArrowUpDown } from 'lucide-react';

export default function DataTable({ columns, rows, emptyMessage = 'No records found.', rowClassName }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-100/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && <ArrowUpDown size={12} className="text-slate-400" />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row, index) => {
            const extraRowClass = typeof rowClassName === 'function' ? rowClassName(row, index) : '';

            return (
              <tr key={row.id || index} className={`hover:bg-slate-50 ${extraRowClass}`.trim()}>
                {columns.map((column) => (
                    <td key={`${row.id || index}-${column.key}`} className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
