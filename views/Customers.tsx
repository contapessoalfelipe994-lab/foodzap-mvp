
import React, { useContext, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../db';
import { Order, Product, Category } from '../types';
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  MapPin, 
  Calendar,
  DollarSign,
  Award,
  Heart,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

interface CustomerStats {
  name: string;
  email?: string;
  totalSpent: number;
  orderCount: number;
  favoriteProduct: { name: string; count: number } | null;
  favoriteCategory: { category: string; count: number } | null;
  lastOrderDate: string;
  addresses: string[];
  deliveryPreference: { delivery: number; pickup: number };
  averageOrderValue: number;
  orders: Order[];
}

const Customers: React.FC = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return <Layout title="Erro">Erro ao carregar dados</Layout>;
  }
  const { store } = context;
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const customersStats = useMemo(() => {
    try {
      if (!store?.id) return [];

      const orders = db.getOrders().filter(o => o && o.storeId === store.id);
      const products = db.getProducts();
    
    // Agrupa pedidos por nome do cliente
    const customerMap = new Map<string, Order[]>();
    
    orders.forEach(order => {
      if (!order || !order.customerName) return;
      try {
        const customerName = order.customerName.toLowerCase().trim();
        if (!customerName) return;
        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, []);
        }
        customerMap.get(customerName)!.push(order);
      } catch (error) {
        console.error('Erro ao processar pedido:', error, order);
      }
    });

    // Calcula estatísticas para cada cliente
    const stats: CustomerStats[] = [];

    customerMap.forEach((customerOrders, customerName) => {
      try {
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const orderCount = customerOrders.length;
        const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

        // Conta produtos mais pedidos
        const productCount = new Map<string, number>();
        const categoryCount = new Map<Category, number>();
        
        customerOrders.forEach(order => {
          if (!order || !order.items) return;
          try {
            order.items.forEach(item => {
              if (!item || !item.name) return;
              // Conta produto
              const itemName = item.name;
              const itemQuantity = item.quantity || 0;
              const current = productCount.get(itemName) || 0;
              productCount.set(itemName, current + itemQuantity);

              // Conta categoria
              if (item.productId) {
                const product = products.find(p => p && p.id === item.productId);
                if (product && product.category) {
                  const catCurrent = categoryCount.get(product.category) || 0;
                  categoryCount.set(product.category, catCurrent + itemQuantity);
                }
              }
            });
          } catch (error) {
            console.error('Erro ao processar itens do pedido:', error, order);
          }
        });

        // Produto favorito
        let favoriteProduct: { name: string; count: number } | null = null;
        productCount.forEach((count, name) => {
          if (!favoriteProduct || count > favoriteProduct.count) {
            favoriteProduct = { name, count };
          }
        });

        // Categoria favorita
        let favoriteCategory: { category: string; count: number } | null = null;
        categoryCount.forEach((count, category) => {
          if (!favoriteCategory || count > favoriteCategory.count) {
            favoriteCategory = { category, count };
          }
        });

        // Endereços únicos
        const addresses = Array.from(
          new Set(customerOrders.filter(o => o && o.address).map(o => o.address!))
        );

        // Preferência de entrega
        const deliveryPreference = customerOrders.reduce(
          (acc, o) => {
            if (o && o.deliveryType) {
              const type = o.deliveryType === 'delivery' ? 'delivery' : 'pickup';
              acc[type] = (acc[type] || 0) + 1;
            }
            return acc;
          },
          { delivery: 0, pickup: 0 }
        );

        // Última data de pedido
        const sortedOrders = [...customerOrders].sort((a, b) => {
          try {
            const dateA = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          } catch {
            return 0;
          }
        });
        const lastOrderDate = sortedOrders[0]?.createdAt || new Date().toISOString();

      // Busca email do cliente cadastrado
      const registeredCustomer = db.getCustomers().find(
        c => c.name.toLowerCase().trim() === customerName && c.storeId === store.id
      );

        stats.push({
          name: customerOrders[0]?.customerName || customerName, // Usa o nome original do primeiro pedido
          email: registeredCustomer?.email,
          totalSpent,
          orderCount,
          favoriteProduct,
          favoriteCategory,
          lastOrderDate,
          addresses,
          deliveryPreference,
          averageOrderValue,
          orders: sortedOrders
        } as CustomerStats);
      } catch (error) {
        console.error('Erro ao processar cliente:', error, customerName);
      }
    });

      // Ordena por total gasto (maior primeiro)
      return stats.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } catch (error) {
      console.error('Erro ao calcular estatísticas de clientes:', error);
      return [];
    }
  }, [store]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customersStats;
    const term = searchTerm.toLowerCase();
    return customersStats.filter(
      c => 
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.favoriteProduct?.name.toLowerCase().includes(term)
    );
  }, [customersStats, searchTerm]);

  if (!store) {
    return (
      <Layout title="Clientes">
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Loja não encontrada</h3>
          <p className="text-slate-500 mt-2">Configure sua loja primeiro na aba "Minha Loja"</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Clientes">
      <div className="space-y-6">
        {/* Header com estatísticas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl shadow-orange-100">
            <div className="flex items-center justify-between mb-4">
              <Users size={32} className="opacity-80" />
              <div className="text-3xl font-black">{customersStats.length}</div>
            </div>
            <p className="text-orange-100 font-bold text-sm uppercase tracking-wider">Total de Clientes</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-3xl text-white shadow-xl shadow-green-100">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={32} className="opacity-80" />
              <div className="text-3xl font-black">
                R$ {customersStats.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-green-100 font-bold text-sm uppercase tracking-wider">Receita Total</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag size={32} className="opacity-80" />
              <div className="text-3xl font-black">
                {customersStats.reduce((sum, c) => sum + (c.orderCount || 0), 0)}
              </div>
            </div>
            <p className="text-blue-100 font-bold text-sm uppercase tracking-wider">Total de Pedidos</p>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou produto favorito..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Nenhum cliente encontrado</h3>
            <p className="text-slate-500 mt-2">
              {searchTerm ? 'Tente buscar por outro termo.' : 'Seus clientes aparecerão aqui quando fizerem pedidos!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header do Cliente */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={(e) => {
                    try {
                      e.preventDefault();
                      e.stopPropagation();
                      if (customer && customer.name) {
                        setExpandedCustomer(expandedCustomer === customer.name ? null : customer.name);
                      }
                    } catch (error) {
                      console.error('Erro ao expandir cliente:', error);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800">{customer.name}</h3>
                          {customer.email && (
                            <p className="text-sm text-slate-400 font-medium">{customer.email}</p>
                          )}
                        </div>
                        {idx === 0 && (
                          <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                            <Award size={14} />
                            Top Cliente
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-black text-green-600">
                          R$ {(customer.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-slate-400 font-bold uppercase">
                          Total Gasto
                        </div>
                      </div>
                      {expandedCustomer === customer.name ? (
                        <ChevronUp size={24} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={24} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Estatísticas Rápidas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-orange-50 p-4 rounded-2xl">
                      <div className="text-xs font-black text-orange-600 uppercase tracking-wider mb-1">Pedidos</div>
                      <div className="text-2xl font-black text-slate-800">{customer.orderCount || 0}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl">
                      <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1">Ticket Médio</div>
                      <div className="text-2xl font-black text-slate-800">
                        R$ {(customer.averageOrderValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    {customer.favoriteProduct && (
                      <div className="bg-purple-50 p-4 rounded-2xl">
                        <div className="text-xs font-black text-purple-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Heart size={12} fill="currentColor" />
                          Favorito
                        </div>
                        <div className="text-sm font-bold text-slate-800 truncate" title={customer.favoriteProduct.name}>
                          {customer.favoriteProduct.name}
                        </div>
                        <div className="text-xs text-slate-500">{customer.favoriteProduct.count}x pedido(s)</div>
                      </div>
                    )}
                    {customer.favoriteCategory && (
                      <div className="bg-green-50 p-4 rounded-2xl">
                        <div className="text-xs font-black text-green-600 uppercase tracking-wider mb-1">Categoria</div>
                        <div className="text-sm font-bold text-slate-800">{customer.favoriteCategory.category}</div>
                        <div className="text-xs text-slate-500">{customer.favoriteCategory.count} itens</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {expandedCustomer === customer.name && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50 space-y-6">
                    {/* Último Pedido */}
                    <div className="bg-white p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                        <Calendar size={14} />
                        Último Pedido
                      </div>
                      <div className="text-sm font-medium text-slate-600">
                        {(() => {
                          try {
                            const date = new Date(customer.lastOrderDate);
                            if (isNaN(date.getTime())) {
                              return 'Data inválida';
                            }
                            return date.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          } catch (error) {
                            console.error('Erro ao formatar data:', error);
                            return 'Data não disponível';
                          }
                        })()}
                      </div>
                    </div>

                    {/* Preferência de Entrega */}
                    <div className="bg-white p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                        <MapPin size={14} />
                        Preferência de Entrega
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${(customer.deliveryPreference?.delivery || 0) > (customer.deliveryPreference?.pickup || 0) ? 'bg-blue-500' : 'bg-blue-200'}`}></div>
                          <span className="text-sm font-medium text-slate-700">
                            Delivery: {customer.deliveryPreference?.delivery || 0}x
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${(customer.deliveryPreference?.pickup || 0) > (customer.deliveryPreference?.delivery || 0) ? 'bg-purple-500' : 'bg-purple-200'}`}></div>
                          <span className="text-sm font-medium text-slate-700">
                            Retirada: {customer.deliveryPreference?.pickup || 0}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Endereços */}
                    {customer.addresses.length > 0 && (
                      <div className="bg-white p-4 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                          <MapPin size={14} />
                          Endereços Registrados
                        </div>
                        <div className="space-y-2">
                          {customer.addresses.map((address, idx) => (
                            <div key={idx} className="text-sm text-slate-600 font-medium">
                              {address}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Histórico de Pedidos */}
                    <div className="bg-white p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                        <ShoppingBag size={14} />
                        Histórico de Pedidos ({(customer.orders?.length || 0)})
                      </div>
                      <div className="space-y-3 max-h-60 overflow-auto">
                        {customer.orders.map(order => {
                          if (!order || !order.id) return null;
                          try {
                            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
                            const formattedDate = isNaN(orderDate.getTime()) 
                              ? 'Data inválida' 
                              : orderDate.toLocaleDateString('pt-BR');
                            const orderTotal = order.total || 0;
                            const itemsCount = order.items?.length || 0;
                            const deliveryType = order.deliveryType || 'pickup';
                            
                            return (
                              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div>
                                  <div className="text-xs font-bold text-slate-400">
                                    {formattedDate}
                                  </div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {itemsCount} item(s)
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-black text-slate-800">
                                    R$ {orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {deliveryType === 'delivery' ? 'Delivery' : 'Retirada'}
                                  </div>
                                </div>
                              </div>
                            );
                          } catch (error) {
                            console.error('Erro ao renderizar pedido:', error, order);
                            return null;
                          }
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Customers;
