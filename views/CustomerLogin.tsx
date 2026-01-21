
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { db } from '../db';
import { Customer } from '../types';
import { ShoppingBag, Mail, Lock, ArrowRight, Star } from 'lucide-react';

const CustomerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!email || !email.trim()) {
        setError('Por favor, preencha o e-mail.');
        return;
      }

      if (!password || !password.trim()) {
        setError('Por favor, preencha a senha.');
        return;
      }

      const customers = db.getCustomers();
      const normalizedEmail = email.toLowerCase().trim();
      const customer = customers.find(c => c.email?.toLowerCase().trim() === normalizedEmail);

      if (customer && customer.password === password.trim()) {
        db.setCurrentCustomer(customer);
        // Redireciona para a loja do cliente
        if (customer.storeCode) {
          const store = db.getStoreByCode(customer.storeCode);
          if (store && store.code) {
            navigate(`/loja/${store.code}`);
          } else {
            setError('Loja não encontrada. Verifique o código da loja.');
          }
        } else {
          setError('Código da loja não encontrado. Entre em contato com o suporte.');
        }
      } else {
        setError('Credenciais inválidas. Tente novamente ou crie uma conta.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Erro ao fazer login. Por favor, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFCFB]">
      {/* Left Visual Side */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-20 -right-20 opacity-20 rotate-12">
          <ShoppingBag size={400} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShoppingBag size={28} />
            </div>
            <span className="text-3xl font-black tracking-tight">FoodZap</span>
          </div>
          <h2 className="text-6xl font-black leading-[1.1] mb-6">Peça com facilidade.</h2>
          <p className="text-blue-100 text-xl font-medium max-w-md">Acesse sua loja favorita e faça pedidos diretamente pelo WhatsApp.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/20">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/100?img=${i+20}`} className="w-10 h-10 rounded-full border-2 border-blue-400" />)}
          </div>
          <p className="text-sm font-bold">Milhares de clientes felizes!</p>
        </div>
      </div>

      {/* Right Login Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden flex justify-center mb-10">
             <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                  <ShoppingBag size={24} />
                </div>
                <span className="text-2xl font-black tracking-tight">Food<span className="text-blue-500">Zap</span></span>
             </div>
          </div>
          
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Entrar como Cliente</h1>
            <p className="text-slate-400 font-medium mt-2">Acesse sua loja favorita e faça pedidos.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100">
                <Star size={16} fill="currentColor" /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 px-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@exemplo.com"
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[22px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[22px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
            >
              Entrar
              <ArrowRight size={20} strokeWidth={3} />
            </button>
          </form>

          <div className="mt-12 text-center space-y-4">
            <p className="text-slate-400 font-medium">
              Ainda não tem conta?{' '}
              <Link to="/cliente/register" className="text-blue-600 font-black hover:underline underline-offset-4">
                Cadastre-se
              </Link>
            </p>
            <p className="text-slate-400 font-medium">
              <Link to="/login" className="text-blue-600 font-black hover:underline underline-offset-4">
                ← Voltar para login de lojista
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
