
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
  const [user, setUser] = useState<User | null>(db.getCurrentUser());
  const [store, setStore] = useState<Store | null>(null);

  const fetchStore = (userId: string) => {
    const stores = db.getStores();
    const userStore = stores.find(s => s.ownerId === userId);
    setStore(userStore || null);
  };

  useEffect(() => {
    if (user) {
      fetchStore(user.id);
    }
  }, [user]);

  const login = (userData: User) => {
    db.setCurrentUser(userData);
    setUser(userData);
    fetchStore(userData.id);
  };

  const logout = () => {
    db.setCurrentUser(null);
    setUser(null);
    setStore(null);
  };

  const refreshStore = () => {
    if (user) fetchStore(user.id);
  };

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
