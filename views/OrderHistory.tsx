
import React, { useContext, useMemo } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../db';
import { Calendar, MapPin, Store as StoreIcon, Package } from 'lucide-react';

const OrderHistory: React.FC = () => {
  const { store } = useContext(AuthContext);
  
  const orders = useMemo(() => {
    return db.getOrders()
      .filter(o => o.storeId === store?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [store]);

  return (
    <Layout title="Histórico de Pedidos">
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Nenhum pedido ainda</h3>
          <p className="text-slate-500 mt-2">Compartilhe sua loja para começar a receber pedidos!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-orange-200 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Calendar size={14} />
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Pedido #{order.id.toUpperCase()}</h3>
                  <p className="text-slate-500 font-medium">Cliente: {order.customerName}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 ${order.deliveryType === 'delivery' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {order.deliveryType === 'delivery' ? <MapPin size={12} /> : <StoreIcon size={12} />}
                    {order.deliveryType === 'delivery' ? 'DELIVERY' : 'RETIRADA'}
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Itens do Pedido</h4>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        <span className="font-bold text-slate-800">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="font-medium text-slate-800">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.deliveryType === 'delivery' && (
                <div className="flex items-start gap-3 text-sm text-slate-500">
                  <MapPin size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <p><span className="font-bold text-slate-700">Endereço:</span> {order.address}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default OrderHistory;
