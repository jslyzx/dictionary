import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigation = [
  { to: '/dictionaries', label: '词典管理' },
  { to: '/words', label: '单词库' },
  { to: '/sentences', label: '句子管理' },
  { to: '/word-plans', label: '单词计划' },
  { to: '/learning', label: '背单词' },
  { to: '/pronunciation-rules', label: '发音规则' },
]

const MainLayout = () => {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const title = useMemo(() => {
    if (location.pathname.startsWith('/dictionaries/') && location.pathname !== '/dictionaries') {
      return '词典详情'
    }
    if (location.pathname === '/learning') {
      return '背单词'
    }
    if (location.pathname.startsWith('/word-plans')) {
      return location.pathname === '/word-plans' ? '单词计划' : '计划详情'
    }
    if (location.pathname.startsWith('/words/') && location.pathname !== '/words') {
      return '单词详情'
    }
    if (location.pathname.startsWith('/pronunciation-rules/') && location.pathname !== '/pronunciation-rules') {
      return '发音规则详情'
    }
    if (location.pathname === '/sentences') {
      return '句子管理'
    }

    const match = navigation.find((item) => location.pathname.startsWith(item.to))
    return match?.label ?? '词典管理'
  }, [location.pathname])

  const handleCloseSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div
        aria-hidden={!isSidebarOpen}
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-200 md:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={handleCloseSidebar}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 md:justify-center">
          <span className="text-lg font-semibold text-slate-900">词典管理系统</span>
          <button
            aria-label="Close navigation"
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
            onClick={handleCloseSidebar}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <nav
          aria-label="Primary"
          className="flex-1 space-y-1 px-4 py-6"
          id="primary-navigation"
        >
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700 ${
                  isActive ? 'link-active shadow-sm font-semibold' : 'text-slate-600'
                }`
              }
              to={item.to}
              onClick={handleCloseSidebar}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-4 py-6 text-xs text-slate-500">
          已连接到
          <span className="ml-1 font-medium text-slate-700">API</span>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-controls="primary-navigation"
              aria-expanded={isSidebarOpen}
              className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-xl font-semibold text-slate-900">{title}</span>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              前端就绪
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
