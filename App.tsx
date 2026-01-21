
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, Store } from './types';
import { db } from './db';

// Views
import Login from './views/Login';
import Register from './views/Register';
import CustomerLogin from './views/CustomerLogin';
import CustomerRegister from './views/CustomerRegister';
import Dashboard from './views/Dashboard';
import StoreSettings from './views/StoreSettings';
import StorePreview from './views/StorePreview';
import ProductManagement from './views/ProductManagement';
import OrderHistory from './views/OrderHistory';
import Customers from './views/Customers';
import PublicStore from './views/PublicStore';

export const AuthContext = React.createContext<{
  user: User | null;
  store: Store | null;
  login: (user: User) => void;
  logout: () => void;
  refreshStore: () => void;
}>({
  user: null,
  store: null,
  login: () => {},
  logout: () => {},
  refreshStore: () => {}
});

const App: React.FC = () => {
  // Proteção contra erros ao carregar usuário
  const getInitialUser = (): User | null => {
    try {
      return db.getCurrentUser();
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getInitialUser());
  const [store, setStore] = useState<Store | null>(null);

  const fetchStore = (userId: string, userStoreId?: string) => {
    try {
      if (!userId) {
        console.warn('⚠️ fetchStore chamado sem userId');
        setStore(null);
        return;
      }
      
      console.log('🔍 fetchStore chamado para userId:', userId, 'storeId:', userStoreId);
      
      let stores: Store[] = [];
      try {
        stores = db.getStores();
        if (!Array.isArray(stores)) {
          console.warn('⚠️ getStores não retornou um array, usando array vazio');
          stores = [];
        }
      } catch (dbError) {
        console.error('❌ Erro ao buscar lojas:', dbError);
        stores = [];
      }
      
      console.log('📦 Total de lojas:', stores.length);
      
      let userStore: Store | null = null;
      
      // ESTRATÉGIA 1: Busca por ownerId
      userStore = stores.find(s => s.ownerId === userId) || null;
      if (userStore) {
        console.log('✅ Loja encontrada por ownerId:', userStore.id);
        setStore(userStore);
        return;
      }
      
      // ESTRATÉGIA 2: Busca por storeId do usuário
      if (userStoreId) {
        userStore = stores.find(s => s.id === userStoreId) || null;
        if (userStore) {
          console.log('✅ Loja encontrada por storeId:', userStore.id);
          // CORRIGE o ownerId se não corresponder
          if (userStore.ownerId !== userId) {
            console.log('⚠️ Corrigindo ownerId da loja...');
            const updatedStores = stores.map(s => 
              s.id === userStoreId ? { ...s, ownerId: userId } : s
            );
            db.saveStores(updatedStores);
            userStore = { ...userStore, ownerId: userId };
          }
          setStore(userStore);
          return;
        }
      }
      
      // ESTRATÉGIA 3: Se há apenas 1 loja, usa essa loja e corrige tudo
      if (stores.length === 1) {
        try {
          console.log('🔧 Apenas 1 loja - corrigindo relacionamento automaticamente');
          userStore = stores[0];
          if (userStore && userStore.id) {
            const updatedStores = stores.map(s => ({ ...s, ownerId: userId }));
            db.saveStores(updatedStores);
            
            try {
              const users = db.getUsers();
              const updatedUsers = users.map(u => 
                u.id === userId ? { ...u, storeId: userStore!.id } : u
              );
              db.saveUsers(updatedUsers);
            } catch (userError) {
              console.error('Erro ao atualizar usuários:', userError);
            }
            
            userStore = { ...userStore, ownerId: userId };
            console.log('✅ Relacionamento corrigido - loja:', userStore.id);
            setStore(userStore);
            return;
          }
        } catch (error) {
          console.error('Erro na estratégia 3:', error);
        }
      }
      
      // ESTRATÉGIA 4: Se há múltiplas lojas e usuário tem storeId, tenta corrigir
      if (stores.length > 1 && userStoreId) {
        const storeById = stores.find(s => s.id === userStoreId);
        if (storeById) {
          console.log('🔧 Múltiplas lojas - corrigindo relacionamento para storeId:', userStoreId);
          const updatedStores = stores.map(s => 
            s.id === userStoreId ? { ...s, ownerId: userId } : s
          );
          db.saveStores(updatedStores);
          userStore = { ...storeById, ownerId: userId };
          console.log('✅ Relacionamento corrigido - loja:', userStore.id);
          setStore(userStore);
          return;
        }
      }
      
      // ESTRATÉGIA 5: Se nada funcionou, tenta usar a primeira loja sem ownerId ou com ownerId diferente
      const availableStore = stores.find(s => !s.ownerId || s.ownerId !== userId);
      if (availableStore) {
        console.log('🔧 Usando loja disponível e corrigindo relacionamento');
        const updatedStores = stores.map(s => 
          s.id === availableStore.id ? { ...s, ownerId: userId } : s
        );
        db.saveStores(updatedStores);
        
        const users = db.getUsers();
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, storeId: availableStore.id } : u
        );
        db.saveUsers(updatedUsers);
        
        userStore = { ...availableStore, ownerId: userId };
        console.log('✅ Relacionamento corrigido - loja:', userStore.id);
        setStore(userStore);
        return;
      }
      
      // Se chegou aqui, não encontrou nada
      console.error('❌ Nenhuma loja encontrada após todas as tentativas');
      console.error('📋 Lojas disponíveis:', stores.map(s => ({ 
        id: s.id, 
        ownerId: s.ownerId, 
        name: s.name 
      })));
      setStore(null);
    } catch (error) {
      console.error('❌ Erro ao buscar loja:', error);
      setStore(null);
    }
  };

  useEffect(() => {
    try {
      if (user?.id) {
        fetchStore(user.id, user.storeId);
      } else {
        setStore(null);
      }
    } catch (error) {
      console.error('Erro no useEffect:', error);
      setStore(null);
    }
  }, [user?.id, user?.storeId]);

  const login = (userData: User) => {
    try {
      db.setCurrentUser(userData);
      setUser(userData);
      if (userData?.id) {
        fetchStore(userData.id, userData.storeId);
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  const logout = () => {
    try {
      db.setCurrentUser(null);
      setUser(null);
      setStore(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const refreshStore = () => {
    try {
      if (user?.id) {
        console.log('🔄 refreshStore chamado para user:', user.id, 'storeId:', user.storeId);
        // Busca imediatamente
        fetchStore(user.id, user.storeId);
        // Força uma nova busca após um delay para garantir
        setTimeout(() => {
          fetchStore(user.id, user.storeId);
        }, 200);
        // Mais uma tentativa após um delay maior
        setTimeout(() => {
          fetchStore(user.id, user.storeId);
        }, 500);
      } else {
        console.warn('⚠️ refreshStore chamado mas user não está disponível');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar loja:', error);
    }
  };

  // Renderização protegida
  return (
    <AuthContext.Provider value={{ user, store, login, logout, refreshStore }}>
      <Router>
        <Routes>
          {/* Public Store Route - Agora usa código */}
          <Route path="/loja/:code" element={<PublicStore />} />

          {/* Auth Routes - Lojistas */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

          {/* Auth Routes - Clientes */}
          <Route path="/cliente/login" element={<CustomerLogin />} />
          <Route path="/cliente/register" element={<CustomerRegister />} />

          {/* Protected Routes - Lojistas */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/preview" element={user ? <StorePreview /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <StoreSettings /> : <Navigate to="/login" />} />
          <Route path="/products" element={user ? <ProductManagement /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <OrderHistory /> : <Navigate to="/login" />} />
          <Route path="/customers" element={user ? <Customers /> : <Navigate to="/login" />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
