import { NavLink } from 'react-router-dom';

const baseLink =
  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors';

export default function Sidebar({ items, title }) {
  return (
    <aside className="w-full border-b border-slate-200 bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:block md:border-b-0">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Hospital</p>
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
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
