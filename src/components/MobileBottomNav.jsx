import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Receipt, 
  Package, 
  Megaphone,
  MoreHorizontal,
  MessageCircle,
  FileText
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'equipment', label: 'Equipment', icon: Package },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export function MobileBottomNav({ activeModule, setActiveModule, onMoreClick }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary-200 pb-safe z-40 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isMore = item.id === 'more';
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isMore) {
                  onMoreClick?.();
                } else {
                  setActiveModule(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors ${
                isActive 
                  ? 'text-brand-600' 
                  : 'text-primary-400 hover:text-primary-600'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-colors ${
                isActive ? 'bg-brand-50' : ''
              }`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${
                isActive ? 'text-brand-600' : 'text-primary-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile menu drawer for "More" option
export function MobileMenuDrawer({ isOpen, onClose, activeModule, setActiveModule, onNavigate }) {
  const moreItems = [
    { id: 'invoicing', label: 'Invoicing', icon: Receipt },
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed bottom-16 left-4 right-4 bg-white rounded-2xl shadow-xl border border-primary-200 z-50 lg:hidden transform transition-all duration-200 ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}>
        <div className="p-2">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700' 
                    : 'text-primary-700 hover:bg-primary-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-primary-400'}`} strokeWidth={1.5} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 bg-brand-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
