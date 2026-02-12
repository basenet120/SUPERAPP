import { useState, useEffect } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import BookingWizard from './components/booking/BookingWizard'
import CRM from './components/crm/CRM'
import EquipmentManagement from './components/equipment/EquipmentManagement'
import ClientPortal from './components/client/ClientPortal'
import CalendarIntegration from './components/calendar/CalendarIntegration'
import ReportingDashboard from './components/reports/ReportingDashboard'
import MarketingTools from './components/marketing/MarketingTools'
import NotificationSettings from './components/settings/NotificationSettings'
import { MobileBottomNav, MobileMenuDrawer } from './components/MobileBottomNav'
import { useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { Loader2 } from 'lucide-react'

function App() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()
  
  // Check if this is a client portal route (public access)
  const isClientPortal = window.location.pathname.startsWith('/client') || 
                         window.location.search.includes('quote=') ||
                         window.location.pathname.startsWith('/booking');

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

  // Show client portal for public routes (no auth required)
  if (isClientPortal) {
    return <ClientPortal />
  }

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
    <div className="flex h-screen bg-primary-50 pb-16 lg:pb-0">
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
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 page-transition">
          {activeModule === 'dashboard' && <Dashboard />}
          {activeModule === 'crm' && <CRM />}
          {activeModule === 'bookings' && <CalendarIntegration />}
          {activeModule === 'invoicing' && <ReportingDashboard />}
          {activeModule === 'equipment' && <EquipmentManagement />}
          {activeModule === 'marketing' && <MarketingTools />}
          {activeModule === 'settings/notifications' && <NotificationSettings />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onMoreClick={() => setMobileMenuOpen(true)}
      />
      
      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />
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
    marketing: 'Marketing',
    'settings/notifications': 'Notification Settings'
  }
  return titles[module] || 'Base Super App'
}

export default App
