
import React, { useState, useContext, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../db';
import { Product, Category } from '../types';
import { Plus, Search, Edit2, Trash2, Camera, Upload, X } from 'lucide-react';

const ProductManagement: React.FC = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return <Layout title="Erro">Erro ao carregar dados</Layout>;
  }
  const { store } = context;
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: Category.OUTROS,
    image: '',
    isActive: true
  });

  useEffect(() => {
    try {
      if (store?.id) {
        loadProducts();
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    }
  }, [store?.id]); // Recarrega quando a loja mudar

  const loadProducts = () => {
    try {
      if (!store?.id) {
        setProducts([]);
        return;
      }
      const allProducts = db.getProducts();
      // Filtra produtos da loja atual
      const storeProducts = allProducts.filter(p => p.storeId === store.id);
      setProducts(storeProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        // Valida tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('A imagem é muito grande. Por favor, escolha uma imagem menor que 5MB.');
          return;
        }

        // Valida tipo do arquivo
        if (!file.type.startsWith('image/')) {
          alert('Por favor, selecione um arquivo de imagem válido.');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData(prev => ({ ...prev, image: reader.result as string }));
          }
        };
        reader.onerror = () => {
          alert('Erro ao carregar a imagem. Tente novamente.');
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        image: product.image,
        isActive: product.isActive
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: Category.OUTROS,
        image: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!store?.id) {
        alert('Erro: Loja não encontrada. Por favor, recarregue a página.');
        return;
      }

      // Validações
      if (!formData.name || !formData.name.trim()) {
        alert('Por favor, preencha o nome do produto.');
        return;
      }

      if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
        alert('Por favor, insira um preço válido maior que zero.');
        return;
      }

      const allProducts = db.getProducts();
      
      if (editingProduct && editingProduct.id) {
        const updated = allProducts.map(p => {
          if (p.id === editingProduct.id) {
            const updatedProduct = {
              ...p,
              ...formData,
              price: parseFloat(formData.price),
              storeId: store.id,
              image: formData.image || p.image || '' // Garante que a imagem seja preservada
            } as Product;
            console.log('✅ Produto atualizado:', updatedProduct.name, 'Imagem:', updatedProduct.image ? 'Sim' : 'Não');
            return updatedProduct;
          }
          return p;
        });
        db.saveProducts(updated);
      } else {
        const newProduct: Product = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          price: parseFloat(formData.price),
          category: formData.category || Category.OUTROS,
          image: formData.image || '',
          isActive: formData.isActive !== undefined ? formData.isActive : true,
          storeId: store.id
        };
        console.log('✅ Novo produto criado:', newProduct.name, 'Imagem:', newProduct.image ? 'Sim' : 'Não');
        if (newProduct.image) {
          console.log('📷 Tamanho da imagem (primeiros 100 chars):', newProduct.image.substring(0, 100));
        }
        db.saveProducts([...allProducts, newProduct]);
      }
      
      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Por favor, tente novamente.');
    }
  };

  const handleDelete = (id: string) => {
    try {
      if (!id) {
        alert('Erro: ID do produto não encontrado.');
        return;
      }

      if (window.confirm('Tem certeza que deseja excluir este produto?')) {
        const allProducts = db.getProducts();
        const filtered = allProducts.filter(p => p.id !== id);
        db.saveProducts(filtered);
        loadProducts();
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Por favor, tente novamente.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Meus Produtos">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:w-5 sm:h-5" size={18} />
          <input
            type="text"
            placeholder="Buscar produto ou categoria..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-base min-h-[44px]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all active:scale-95 min-h-[44px] text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Novo Produto</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="h-48 overflow-hidden relative bg-slate-100">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Camera size={48} />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700">
                {product.category}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{product.name}</h3>
                <span className="font-bold text-orange-600">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-slate-500 text-sm line-clamp-2 mb-6">{product.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${product.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  {product.isActive ? 'Disponível' : 'Indisponível'}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center justify-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all overflow-hidden relative group"
                >
                  {formData.image ? (
                    <>
                      <img src={formData.image} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">
                        Alterar Foto
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={32} className="text-slate-300 mb-2" />
                      <span className="text-sm font-medium text-slate-400">Clique para enviar foto</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Produto</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  >
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 accent-orange-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Produto Ativo / Disponível</label>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductManagement;
