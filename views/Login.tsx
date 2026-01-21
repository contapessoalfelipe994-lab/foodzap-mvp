
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { db } from '../db';
import { ChefHat, Mail, Lock, ArrowRight, Star, ShoppingBag } from 'lucide-react';

const Login: React.FC = () => {
  const [tab, setTab] = useState<'lojista' | 'cliente'>('lojista');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (tab === 'lojista') {
        // Validações
        if (!email || !email.trim()) {
          setError('Por favor, preencha o e-mail.');
          return;
        }

        if (!password || !password.trim()) {
          setError('Por favor, preencha a senha.');
          return;
        }

        // Normaliza email e senha (remove espaços e converte para lowercase)
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPassword = password.trim();

        const users = db.getUsers();
        const user = users.find(u => u.email?.toLowerCase().trim() === normalizedEmail);

        if (!user) {
          setError('E-mail não encontrado. Verifique o e-mail ou crie uma conta.');
          return;
        }

        if (!user.password) {
          setError('Este usuário não possui senha cadastrada. Entre em contato com o suporte.');
          return;
        }

        if (user.password.trim() === normalizedPassword) {
          login(user);
          navigate('/dashboard');
        } else {
          setError('Senha incorreta. Verifique sua senha e tente novamente.');
        }
      } else {
        // Redirecionar para login de cliente
        navigate('/cliente/login');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError('Erro ao fazer login. Por favor, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFCFB]">
      {/* Left Visual Side */}
      <div className="hidden md:flex md:w-1/2 food-gradient p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-20 -right-20 opacity-20 rotate-12">
          <ChefHat size={400} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white text-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat size={28} />
            </div>
            <span className="text-3xl font-black tracking-tight">FoodZap</span>
          </div>
          <h2 className="text-6xl font-black leading-[1.1] mb-6">Sua comida merece uma vitrine premium.</h2>
          <p className="text-orange-100 text-xl font-medium max-w-md">Gerencie cardápios, receba pedidos no WhatsApp e encante seus clientes em poucos cliques.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-6 rounded-[32px] border border-white/20">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-orange-400" />)}
          </div>
          <p className="text-sm font-bold">+500 cozinheiros já estão usando!</p>
        </div>
      </div>

      {/* Right Login Side */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden flex justify-center mb-6 sm:mb-10">
             <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center">
                  <ChefHat size={24} />
                </div>
                <span className="text-2xl font-black tracking-tight">Food<span className="text-orange-500">Zap</span></span>
             </div>
          </div>
          
          <div className="mb-6 sm:mb-10 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">Entrar no Painel</h1>
            <p className="text-slate-400 font-medium mt-2 text-sm sm:text-base">Acesse sua cozinha digital e gerencie seus pedidos.</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 sm:mb-8 flex gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTab('lojista');
                setError('');
              }}
              className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[48px] ${
                tab === 'lojista'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <ChefHat size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Sou Lojista</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('cliente');
                setError('');
                navigate('/cliente/login');
              }}
              className={`flex-1 py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[48px] ${
                tab === 'cliente'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Sou Cliente</span>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-red-100">
                <Star size={14} className="sm:w-4 sm:h-4" fill="currentColor" /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 px-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} className="sm:w-5 sm:h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chef@exemplo.com"
                  className="w-full pl-11 sm:pl-12 pr-4 sm:pr-6 py-3.5 sm:py-4 bg-white border-2 border-slate-100 rounded-2xl sm:rounded-[22px] focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all font-bold text-slate-700 text-base min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} className="sm:w-5 sm:h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-11 sm:pl-12 pr-4 sm:pr-6 py-3.5 sm:py-4 bg-white border-2 border-slate-100 rounded-2xl sm:rounded-[22px] focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all font-bold text-slate-700 text-base min-h-[48px]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 sm:py-5 rounded-2xl sm:rounded-[24px] shadow-xl shadow-orange-100 flex items-center justify-center gap-2 sm:gap-3 transition-all hover:scale-[1.02] active:scale-95 min-h-[52px] text-sm sm:text-base"
            >
              Começar agora
              <ArrowRight size={18} className="sm:w-5 sm:h-5" strokeWidth={3} />
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-400 font-medium">
              Ainda não tem vitrine?{' '}
              <Link to="/register" className="text-orange-600 font-black hover:underline underline-offset-4">
                Criar Grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
