import { Link, NavLink } from 'react-router-dom';

const navLinkClasses = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
  }`;

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/dictionaries" className="text-lg font-semibold text-slate-900">
            Dictionary Manager
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/dictionaries" className={navLinkClasses}>
              Dictionaries
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export default Layout;
