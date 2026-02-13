import { Menu, Search, ChevronDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications, useNotificationCount } from '../hooks/useQueries'
import { NotificationBell } from './notifications/NotificationBell'

function Header({ title, sidebarOpen, setSidebarOpen }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuth()
  
  // Use HTTP-based notifications (more reliable than WebSocket)
  const { data: notificationsData } = useNotifications({ limit: 10 })
  const { data: unreadCountData } = useNotificationCount()
  
  const notifications = notificationsData?.notifications || []
  const unreadCount = unreadCountData || 0

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="h-16 bg-white border-b border-primary-200 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-primary-900 tracking-tight">{title}</h2>
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <Search className="w-4 h-4 text-primary-400" strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Search..."
            className="bg-transparent text-sm text-primary-700 placeholder:text-primary-400 focus:outline-none w-48"
          />
        </div>
        
        {/* Notifications */}
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        
        {/* User menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-primary-400 hidden sm:block" />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-primary-200 py-2 z-20 animate-fade-in">
                <div className="px-4 py-3 border-b border-primary-100">
                  <p className="text-sm font-semibold text-primary-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-primary-500">{user?.email || ''}</p>
                </div>
                <div className="py-1">
                  <button className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                    Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                    Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 transition-colors">
                    Billing
                  </button>
                </div>
                <div className="border-t border-primary-100 py-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
