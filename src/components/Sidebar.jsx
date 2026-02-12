import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Receipt, 
  Package, 
  Megaphone, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  BookOpen
} from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'invoicing', label: 'Invoicing', icon: Receipt },
  { id: 'equipment', label: 'Equipment', icon: Package },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'quickbooks', label: 'QuickBooks', icon: BookOpen },
]

function Sidebar({ activeModule, setActiveModule, isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-primary-200 
                    transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:transform-none flex flex-col
                    ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-primary-200 ${isOpen ? 'px-4 justify-between' : 'px-3 justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            {isOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-primary-900 leading-tight text-lg tracking-tight">Base</h1>
                <p className="text-[11px] text-primary-500 font-medium uppercase tracking-wider">Operating System</p>
              </div>
            )}
          </div>
          
          {/* Toggle button (desktop) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id)
                  if (window.innerWidth < 1024) setIsOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-brand-50 text-brand-700 font-semibold relative' 
                    : 'text-primary-600 hover:bg-primary-100 hover:text-primary-900'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-600 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-600' : 'text-primary-400 group-hover:text-primary-600'}`} strokeWidth={1.5} />
                {isOpen && (
                  <span className="text-sm animate-fade-in">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
        
        {/* Bottom section */}
        <div className="p-3 border-t border-primary-200 space-y-1">
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 text-primary-600 hover:bg-primary-100 hover:text-primary-900 rounded-lg transition-all group ${!isOpen && 'justify-center'}`}>
            <Settings className="w-5 h-5 text-primary-400 group-hover:text-primary-600" strokeWidth={1.5} />
            {isOpen && <span className="text-sm">Settings</span>}
          </button>
          
          {/* User Profile */}
          <div className={`mt-2 pt-2 border-t border-primary-100 ${!isOpen && 'border-transparent'}`}>
            <button className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors ${!isOpen && 'justify-center p-1'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">AS</span>
              </div>
              {isOpen && (
                <div className="text-left animate-fade-in">
                  <p className="text-sm font-medium text-primary-900">Alon Sicherman</p>
                  <p className="text-xs text-primary-500">Admin</p>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
