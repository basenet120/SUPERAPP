import { useState, useEffect } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import BookingWizard from './components/booking/BookingWizard'
import CRM from './components/crm/CRM'
import EquipmentManagement from './components/equipment/EquipmentManagement'
import { useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { Loader2 } from 'lucide-react'

function App() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isAuthenticated, isLoading } = useAuth()

  // Handle navigation events
  useEffect(() => {
    const handleNavigate = (e) => {
      if (e.detail) {
        setActiveModule(e.detail)
      }
    }
    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

  // Check mobile and adjust sidebar
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-primary-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-primary-50">
      {/* Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={getModuleTitle(activeModule)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-auto p-6 page-transition">
          {activeModule === 'dashboard' && <Dashboard />}
          {activeModule === 'crm' && <CRM />}
          {activeModule === 'bookings' && <BookingWizard />}
          {activeModule === 'invoicing' && (
            <div className="flex flex-col items-center justify-center py-20 text-primary-500">
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-primary-900 mb-2">Invoicing</h2>
              <p className="text-primary-500 max-w-md text-center">Coming in Phase 4. Quotes, invoices, and QuickBooks sync.</p>
            </div>
          )}
          {activeModule === 'equipment' && <EquipmentManagement />}
          {activeModule === 'marketing' && (
            <div className="flex flex-col items-center justify-center py-20 text-primary-500">
              <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-primary-900 mb-2">Marketing Automation</h2>
              <p className="text-primary-500 max-w-md text-center">Coming in Phase 6. Email campaigns and workflows.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function getModuleTitle(module) {
  const titles = {
    dashboard: 'Dashboard',
    crm: 'CRM',
    bookings: 'Bookings & Calendar',
    invoicing: 'Invoicing',
    equipment: 'Equipment',
    marketing: 'Marketing'
  }
  return titles[module] || 'Base Super App'
}

export default App
