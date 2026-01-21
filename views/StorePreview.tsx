
import React, { useContext } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, ArrowLeft } from 'lucide-react';

const StorePreview: React.FC = () => {
  const { store } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!store) {
    return (
      <Layout title="Preview da Loja">
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold">Loja não encontrada</p>
        </div>
      </Layout>
    );
  }

  const storeUrl = `/#/loja/${store.code}`;

  return (
    <Layout title="Preview da Loja">
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Eye size={24} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Visualização do Cliente</h2>
              <p className="text-sm text-slate-400 mt-1">Esta é exatamente como seus clientes veem sua loja</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
            >
              <ExternalLink size={18} />
              Abrir em Nova Aba
            </a>
          </div>
        </div>

        {/* Preview Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                <Eye size={16} className="text-orange-500" />
                <span>Preview:</span>
                <span className="text-orange-500">{store.name}</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-bold">
              /loja/{store.code}
            </div>
          </div>

          {/* Iframe com a loja pública - Responsivo */}
          <div className="relative bg-slate-100">
            <div className="aspect-[9/16] md:aspect-video w-full" style={{ minHeight: '600px' }}>
              <iframe
                src={storeUrl}
                className="w-full h-full border-0"
                title="Preview da Loja"
                style={{ minHeight: '600px' }}
                allow="clipboard-write"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-blue-900 mb-2">Sobre o Preview</h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Esta visualização mostra exatamente como sua loja aparece para os clientes. 
                Use este preview para verificar como os produtos, descrição e configurações estão sendo exibidos. 
                Para fazer alterações, acesse a aba "Minha Loja" no menu lateral.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StorePreview;
