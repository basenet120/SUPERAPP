import { useState, useEffect, Suspense, lazy } from 'react'
import './index.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { MobileBottomNav, MobileMenuDrawer } from './components/MobileBottomNav'
import { useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { Loader2 } from 'lucide-react'

// Lazy load all heavy components
const Dashboard = lazy(() => import('./components/Dashboard'))
const CRM = lazy(() => import('./components/crm/CRM'))
const CalendarIntegration = lazy(() => import('./components/calendar/CalendarIntegration'))
const ReportingDashboard = lazy(() => import('./components/reports/ReportingDashboard'))
const EquipmentManagement = lazy(() => import('./components/equipment/EquipmentManagement'))
const MarketingTools = lazy(() => import('./components/marketing/MarketingTools'))
const NotificationSettings = lazy(() => import('./components/settings/NotificationSettings'))
const QuickBooksIntegration = lazy(() => import('./components/quickbooks/QuickBooksIntegration'))
const ClientPortal = lazy(() => import('./components/client/ClientPortal'))

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
  </div>
)

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
    return (
      <Suspense fallback={<PageLoader />}>
        <ClientPortal />
      </Suspense>
    )
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
          <Suspense fallback={<PageLoader />}>
            {activeModule === 'dashboard' && <Dashboard />}
            {activeModule === 'crm' && <CRM />}
            {activeModule === 'bookings' && <CalendarIntegration />}
            {activeModule === 'invoicing' && <ReportingDashboard />}
            {activeModule === 'equipment' && <EquipmentManagement />}
            {activeModule === 'marketing' && <MarketingTools />}
            {activeModule === 'quickbooks' && <QuickBooksIntegration />}
            {activeModule === 'settings/notifications' && <NotificationSettings />}
          </Suspense>
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
    quickbooks: 'QuickBooks',
    'settings/notifications': 'Notification Settings'
  }
  return titles[module] || 'Base Super App'
}

export default App