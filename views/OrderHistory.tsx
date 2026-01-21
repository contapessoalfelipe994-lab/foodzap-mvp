
import React, { useContext, useMemo } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../db';
import { Calendar, MapPin, Store as StoreIcon, Package } from 'lucide-react';

const OrderHistory: React.FC = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return <Layout title="Erro">Erro ao carregar dados</Layout>;
  }
  const { store } = context;
  
  const orders = useMemo(() => {
    try {
      if (!store?.id) {
        return [];
      }
      const allOrders = db.getOrders();
      const filtered = allOrders.filter(o => o && o.storeId === store.id);
      
      return filtered.sort((a, b) => {
        try {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        } catch (error) {
          console.error('Erro ao ordenar pedidos:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      return [];
    }
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
          {orders.map(order => {
            if (!order || !order.id) return null;
            
            try {
              const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
              const formattedDate = isNaN(orderDate.getTime()) 
                ? 'Data inválida' 
                : orderDate.toLocaleString('pt-BR');
              
              const orderId = order.id ? String(order.id).toUpperCase() : 'N/A';
              const customerName = order.customerName || 'Cliente não informado';
              const orderTotal = order.total || 0;
              const deliveryType = order.deliveryType || 'pickup';
              const orderItems = order.items || [];
              
              return (
                <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:border-orange-200 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Calendar size={14} />
                        {formattedDate}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Pedido #{orderId}</h3>
                      <p className="text-slate-500 font-medium">Cliente: {customerName}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 ${deliveryType === 'delivery' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {deliveryType === 'delivery' ? <MapPin size={12} /> : <StoreIcon size={12} />}
                        {deliveryType === 'delivery' ? 'DELIVERY' : 'RETIRADA'}
                      </div>
                      <div className="text-2xl font-black text-slate-800">
                        R$ {orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {orderItems.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Itens do Pedido</h4>
                      <div className="space-y-2">
                        {orderItems.map((item, idx) => {
                          if (!item) return null;
                          const itemQuantity = item.quantity || 0;
                          const itemPrice = item.price || 0;
                          const itemName = item.name || 'Item sem nome';
                          return (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-600">
                                <span className="font-bold text-slate-800">{itemQuantity}x</span> {itemName}
                              </span>
                              <span className="font-medium text-slate-800">R$ {(itemPrice * itemQuantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {deliveryType === 'delivery' && order.address && (
                    <div className="flex items-start gap-3 text-sm text-slate-500">
                      <MapPin size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <p><span className="font-bold text-slate-700">Endereço:</span> {order.address}</p>
                    </div>
                  )}
                </div>
              );
            } catch (error) {
              console.error('Erro ao renderizar pedido:', error, order);
              return null;
            }
          })}
        </div>
      )}
    </Layout>
  );
};

export default OrderHistory;
