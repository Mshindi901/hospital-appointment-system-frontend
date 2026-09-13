import { NavLink } from 'react-router-dom';

const baseLink =
  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors';

export default function Sidebar({ items, title }) {
  return (
    <aside className="w-full border-b border-teal-100 bg-gradient-to-b from-white to-teal-50/70 md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:block md:border-b-0">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-teal-600">CareSync</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{title}</h1>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3 md:mt-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${baseLink} ${
                isActive
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-teal-50 hover:text-slate-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
