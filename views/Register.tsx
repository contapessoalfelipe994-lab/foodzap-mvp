
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { db } from '../db';
import { User, Store } from '../types';
import { Store as StoreIcon, User as UserIcon, Mail, Phone, Lock, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    whatsapp: '',
    foodType: 'both'
  });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validações
      if (!formData.name || !formData.name.trim()) {
        alert('Por favor, preencha seu nome completo.');
        return;
      }

      if (!formData.email || !formData.email.trim() || !formData.email.includes('@')) {
        alert('Por favor, insira um e-mail válido.');
        return;
      }

      if (!formData.password || formData.password.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres.');
        return;
      }

      if (!formData.storeName || !formData.storeName.trim()) {
        alert('Por favor, preencha o nome da loja.');
        return;
      }

      if (!formData.whatsapp || !formData.whatsapp.trim()) {
        alert('Por favor, preencha o WhatsApp.');
        return;
      }

      // Verifica se email já existe
      const existingUsers = db.getUsers();
      const emailExists = existingUsers.some(u => u.email?.toLowerCase().trim() === formData.email.toLowerCase().trim());
      if (emailExists) {
        alert('Este e-mail já está cadastrado. Por favor, faça login ou use outro e-mail.');
        return;
      }

      const userId = Math.random().toString(36).substr(2, 9);
      const storeId = Math.random().toString(36).substr(2, 9);
      const slug = formData.storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      // Gera código único de 6 caracteres alfanuméricos em maiúsculas
      let storeCode = Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Garante que o código tenha exatamente 6 caracteres
      while (storeCode.length < 6) {
        storeCode = (storeCode + Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')).substring(0, 6);
      }
      storeCode = storeCode.substring(0, 6);
      
      // Garante que o código seja único (case-insensitive)
      const existingStores = db.getStores();
      while (existingStores.some(s => s.code && s.code.toUpperCase().trim() === storeCode)) {
        storeCode = Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
        while (storeCode.length < 6) {
          storeCode = (storeCode + Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, '')).substring(0, 6);
        }
        storeCode = storeCode.substring(0, 6);
      }
      
      console.log('✅ Código da loja gerado:', storeCode);

      const newUser: User = {
        id: userId,
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password.trim(),
        storeId: storeId
      };

      const newStore: Store = {
        id: storeId,
        ownerId: userId,
        name: formData.storeName.trim(),
        slug: slug,
        code: storeCode,
        logo: 'https://picsum.photos/200',
        banner: 'https://picsum.photos/800/200',
        description: `Seja bem-vindo à ${formData.storeName.trim()}!`,
        whatsapp: formData.whatsapp.trim(),
        address: '',
        deliveryType: 'both',
        deliveryFee: 5.0,
        isDeliveryFree: false,
        appDiscountEnabled: true,
        appDiscountValue: 10,
        hours: {
          open: '08:00',
          close: '22:00',
          isOpenAlways: false
        },
        customization: {
          primaryColor: '#f97316',
          secondaryColor: '#fb923c',
          backgroundColor: '#fdfcfb',
          textColor: '#1e293b',
          accentColor: '#22c55e',
          buttonStyle: 'rounded',
          cardStyle: 'elevated',
          fontSize: 'medium',
          theme: 'light'
        }
      };

      db.saveUsers([...existingUsers, newUser]);
      db.saveStores([...existingStores, newStore]);
      
      // Salva dados do cadastro no SheetDB com as colunas específicas (não bloqueia se falhar)
      db.saveStoreOwnerRegistration({
        email: formData.email.toLowerCase().trim(),
        password: formData.password.trim(),
        storeName: formData.storeName.trim(),
        whatsapp: formData.whatsapp.trim(),
        foodType: formData.foodType,
        fullName: formData.name.trim()
      }).catch(() => {
        // Continua mesmo se falhar - não bloqueia o cadastro
      });
      
      login(newUser);
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      alert('Erro ao criar conta. Por favor, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">Criar sua Loja</h1>
          <p className="text-slate-500 mt-2">Comece a vender pelo WhatsApp em minutos</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <UserIcon size={18} className="text-orange-500" /> Seus Dados
            </h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Senha</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <StoreIcon size={18} className="text-orange-500" /> Dados da Loja
            </h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nome da Loja</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.storeName}
                onChange={e => setFormData({...formData, storeName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">WhatsApp (com DDD)</label>
              <input
                type="tel"
                required
                placeholder="5511999999999"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.whatsapp}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Especialidade</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.foodType}
                onChange={e => setFormData({...formData, foodType: e.target.value})}
              >
                <option value="both">Doces e Salgados</option>
                <option value="sweet">Doces / Confeitaria</option>
                <option value="savory">Salgados / Lanches</option>
                <option value="lunch">Marmitas / Almoço</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1 accent-orange-500" />
              <span className="text-sm text-slate-500">
                Aceito os termos de uso e a política de privacidade. Entendo que o faturamento dos pedidos é de minha total responsabilidade via WhatsApp.
              </span>
            </label>
            
            <button
              type="submit"
              className="w-full mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Criar minha Loja Grátis
              <CheckCircle size={20} />
            </button>
            
            <p className="text-center mt-6 text-slate-500 text-sm">
              Já tem conta?{' '}
              <Link to="/login" className="text-orange-600 font-bold hover:underline">Faça Login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
