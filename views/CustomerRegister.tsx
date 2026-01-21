
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../db';
import { Customer } from '../types';
import { ShoppingBag, User, Mail, Lock, CheckCircle, Store as StoreIcon } from 'lucide-react';

const CustomerRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeCode: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validações
      if (!formData.storeCode || !formData.storeCode.trim()) {
        setError('Por favor, insira o código da loja.');
        return;
      }

      if (!formData.name || !formData.name.trim()) {
        setError('Por favor, preencha seu nome completo.');
        return;
      }

      if (!formData.email || !formData.email.trim() || !formData.email.includes('@')) {
        setError('Por favor, insira um e-mail válido.');
        return;
      }

      if (!formData.password || formData.password.length < 4) {
        setError('A senha deve ter pelo menos 4 caracteres.');
        return;
      }

      const normalizedCode = formData.storeCode.toUpperCase().trim();
      console.log('🔍 [CustomerRegister] Validando código da loja:', normalizedCode);
      
      // Primeiro tenta buscar localmente (mais rápido)
      let store = await db.getStoreByCode(normalizedCode, false);
      
      // Se não encontrou localmente, sincroniza do Sheets e tenta novamente
      if (!store || !store.id) {
        try {
          console.log('🔄 [CustomerRegister] Loja não encontrada localmente, sincronizando do Sheets...');
          
          // Sincroniza com timeout para evitar travamento no mobile
          const syncPromise = db.syncFromSheetDB();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na sincronização')), 10000)
          );
          
          await Promise.race([syncPromise, timeoutPromise]);
          console.log('✅ [CustomerRegister] Sincronização concluída');
          
          // Tenta buscar novamente após sincronizar
          store = await db.getStoreByCode(normalizedCode, false);
        } catch (syncError) {
          console.warn('⚠️ [CustomerRegister] Erro ao sincronizar do Sheets:', syncError);
          // Tenta buscar novamente mesmo se a sincronização falhar (pode ter carregado parcialmente)
          if (!store || !store.id) {
            store = await db.getStoreByCode(normalizedCode, false);
          }
        }
      }
      
      // Lista todas as lojas disponíveis para debug
      const allStores = db.getStores();
      console.log('📋 [CustomerRegister] Total de lojas disponíveis:', allStores.length);
      console.log('📋 [CustomerRegister] Lojas disponíveis:', allStores.map(s => ({ 
        name: s.name, 
        code: s.code || '(sem código)',
        id: s.id 
      })));
      
      if (!store || !store.id) {
        // Lista todas as lojas disponíveis para debug
        const availableCodes = allStores.map(s => s.code || '(sem código)').filter(Boolean);
        console.error('❌ [CustomerRegister] Código não encontrado. Código digitado:', normalizedCode);
        console.error('❌ [CustomerRegister] Códigos disponíveis:', availableCodes);
        
        // Mensagem mais amigável para mobile
        if (availableCodes.length === 0) {
          setError('Nenhuma loja encontrada. Verifique sua conexão com a internet e tente novamente.');
        } else {
          setError(`Código "${normalizedCode}" não encontrado. Verifique o código que você recebeu do lojista.`);
        }
        return;
      }
      
      console.log('✅ [CustomerRegister] Código da loja válido:', store.name, store.code, store.id);

      // Verifica se já existe um cliente com este email
      const customers = db.getCustomers();
      const existingCustomer = customers.find(c => c.email?.toLowerCase().trim() === formData.email.toLowerCase().trim());
      if (existingCustomer) {
        setError('Este email já está cadastrado. Faça login ou use outro email.');
        return;
      }

      const customerId = Math.random().toString(36).substr(2, 9);

      const newCustomer: Customer = {
        id: customerId,
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password.trim(),
        storeCode: formData.storeCode.toUpperCase().trim(),
        storeId: store.id
      };

      // Salva o cliente (a função já verifica duplicatas no SheetDB)
      await db.saveCustomers([...customers, newCustomer]);
      db.setCurrentCustomer(newCustomer);
      navigate(`/loja/${store.code}`);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      setError('Erro ao cadastrar. Por favor, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center">
              <ShoppingBag size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-800">Cadastro de Cliente</h1>
          <p className="text-slate-500 mt-2">Insira o código da loja que você recebeu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100">
              <CheckCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <StoreIcon size={14} className="text-blue-500" /> Código da Loja
            </label>
            <input
              type="text"
              required
              maxLength={6}
              className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-black text-2xl text-center tracking-widest uppercase"
              placeholder="ABC123"
              value={formData.storeCode}
              onChange={e => setFormData({...formData, storeCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})}
            />
            <p className="text-xs text-slate-400 mt-2 text-center">Pegue este código com o lojista</p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <User size={14} className="text-blue-500" /> Nome Completo
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Mail size={14} className="text-blue-500" /> E-mail
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Lock size={14} className="text-blue-500" /> Senha
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1 accent-blue-500" />
              <span className="text-sm text-slate-500">
                Aceito os termos de uso e a política de privacidade.
              </span>
            </label>
            
            <button
              type="submit"
              className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Criar Conta
              <CheckCircle size={20} />
            </button>
            
            <p className="text-center mt-6 text-slate-500 text-sm">
              Já tem conta?{' '}
              <Link to="/cliente/login" className="text-blue-600 font-black hover:underline">Faça Login</Link>
            </p>
            <p className="text-center mt-4 text-slate-500 text-sm">
              <Link to="/login" className="text-blue-600 font-black hover:underline">
                ← Voltar para login de lojista
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegister;
