
import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  LayoutDashboard, 
  Store, 
  UtensilsCrossed, 
  ClipboardList, 
  Settings, 
  LogOut,
  ExternalLink,
  ChefHat,
  Eye,
  Users
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, store, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Início', path: '/dashboard' },
    { icon: <UtensilsCrossed size={22} />, label: 'Cardápio', path: '/products' },
    { icon: <ClipboardList size={22} />, label: 'Pedidos', path: '/orders' },
    { icon: <Users size={22} />, label: 'Clientes', path: '/customers' },
    { icon: <Eye size={22} />, label: 'Preview', path: '/preview' },
    { icon: <Settings size={22} />, label: 'Minha Loja', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#FDFCFB] overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-orange-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <ChefHat size={24} />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800">Food<span className="text-orange-500">Zap</span></span>
        </div>
        
        <nav className="flex-1 px-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-orange-500 text-white shadow-xl shadow-orange-100 font-bold scale-[1.02]' 
                  : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 space-y-4">
          {store && (
            <a 
              href={`#/loja/${store.code}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <span>Ver Loja</span>
              <ExternalLink size={16} />
            </a>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-3 text-slate-400 hover:text-red-500 font-medium transition-all"
          >
            <LogOut size={18} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
              <ChefHat size={20} />
            </div>
            <span className="font-black text-slate-800 tracking-tight">Food<span className="text-orange-500">Zap</span></span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 p-2">
            <LogOut size={22} />
          </button>
        </header>

        <div className="p-6 md:p-12 max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-1">Painel administrativo</p>
              <h1 className="text-4xl font-black text-slate-900">{title}</h1>
            </div>
            {store && location.pathname !== '/settings' && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-orange-50">
                <img src={store.logo} className="w-8 h-8 rounded-full object-cover" />
                <span className="font-bold text-slate-700 text-sm">{store.name}</span>
              </div>
            )}
          </div>
          {children}
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-orange-50 flex justify-around p-3 pb-6 z-50">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                location.pathname === item.path ? 'text-orange-500 font-bold' : 'text-slate-300'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-1 font-bold">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
