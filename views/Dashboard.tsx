
import React, { useContext, useMemo } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../db';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  Share2, 
  Copy, 
  CheckCircle2,
  AlertCircle,
  Zap,
  ShoppingBag,
  Coins
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return <Layout title="Erro">Erro ao carregar dados</Layout>;
  }
  const { store } = context;
  
  const stats = useMemo(() => {
    try {
      if (!store?.id) {
        return { productsCount: 0, ordersCount: 0, revenue: 0 };
      }
      const products = db.getProducts().filter(p => p.storeId === store.id && p.isActive);
      const orders = db.getOrders().filter(o => o.storeId === store.id);
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        productsCount: products.length,
        ordersCount: orders.length,
        revenue: totalRevenue
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return { productsCount: 0, ordersCount: 0, revenue: 0 };
    }
  }, [store]);

  const [copied, setCopied] = React.useState(false);

  const copyStoreCode = () => {
    try {
      if (!store?.code) {
        alert('Código da loja não disponível.');
        return;
      }
      navigator.clipboard.writeText(store.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch((error) => {
        console.error('Erro ao copiar código:', error);
        alert('Erro ao copiar código. Tente novamente.');
      });
    } catch (error) {
      console.error('Erro ao copiar código:', error);
      alert('Erro ao copiar código. Tente novamente.');
    }
  };

  const isStoreOpen = useMemo(() => {
    try {
      if (!store?.hours) return false;
      if (store.hours.isOpenAlways) return true;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      return currentTime >= (store.hours.open || '08:00') && currentTime <= (store.hours.close || '22:00');
    } catch (error) {
      console.error('Erro ao verificar horário da loja:', error);
      return false;
    }
  }, [store]);

  return (
    <Layout title="Bem-vindo de volta!">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[32px] shadow-sm border border-orange-50 group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-50 text-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
            <Coins size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Ganhos no mês</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 tracking-tight">
            R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[32px] shadow-sm border border-orange-50 group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 text-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
            <ShoppingBag size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Pedidos feitos</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 tracking-tight">{stats.ordersCount}</p>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[32px] shadow-sm border border-orange-50 group hover:shadow-xl transition-all duration-300 sm:col-span-2 md:col-span-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Pratos ativos</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-2 tracking-tight">{stats.productsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-orange-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-orange-50 opacity-10">
            <Share2 size={120} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-3">
              <Zap size={24} className="text-orange-500" fill="currentColor" />
              Código da sua loja
            </h2>
            <p className="text-slate-500 font-medium mb-8">Envie este código para seus clientes para que eles possam acessar sua loja.</p>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-3xl border-2 border-orange-200 mb-6">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-3">Código da Loja</p>
                <p className="text-5xl font-black text-orange-600 tracking-widest mb-2">{store?.code}</p>
                <p className="text-xs text-orange-500 font-bold">Compartilhe este código com seus clientes</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 font-bold text-slate-600 text-center text-lg tracking-widest">
                {store?.code}
              </div>
              <button 
                onClick={copyStoreCode}
                className={`w-full sm:w-auto font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all ${
                  copied 
                    ? 'bg-green-500 text-white shadow-green-100' 
                    : 'bg-orange-500 text-white shadow-orange-100 hover:scale-105 active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={20} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copiar Código
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-orange-50">
          <h2 className="text-2xl font-black text-slate-800 mb-8">Status</h2>
          <div className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 ${isStoreOpen ? 'bg-green-500 text-white shadow-green-200 rotate-3' : 'bg-red-500 text-white shadow-red-200 -rotate-3'}`}>
              <Clock size={40} strokeWidth={2.5} />
            </div>
            <p className={`text-2xl font-black ${isStoreOpen ? 'text-green-600' : 'text-red-600'}`}>
              {isStoreOpen ? 'Portas Abertas!' : 'Cozinha Fechada'}
            </p>
            <p className="text-sm text-slate-400 font-bold mt-2">
              {store?.hours.isOpenAlways 
                ? 'Sempre aberta para pedidos' 
                : `Funciona de ${store?.hours.open} às ${store?.hours.close}`}
            </p>
            
            {!isStoreOpen && (
              <div className="mt-8 flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                <AlertCircle size={24} className="text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-800 font-bold leading-tight uppercase">
                  Os clientes podem ver seu cardápio, mas o botão de compra está desativado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
