
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db';
import { Store, Product, Category, Order } from '../types';
import { ShoppingBag, Plus, Minus, Trash2, X, ChevronRight, Truck, Store as StoreIcon, Info, Clock, MapPin } from 'lucide-react';

const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const PublicStore: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Array<{ product: Product, quantity: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'delivery' | 'address'>('cart');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [addressData, setAddressData] = useState({
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    number: '',
    complement: ''
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false); // Checkbox para salvar endereço
  const [currentCustomer, setCurrentCustomer] = useState<any>(null); // Cliente logado

  // Função para carregar a loja
  const loadStore = React.useCallback(() => {
    if (!code) {
      console.warn('⚠️ Código da loja não fornecido');
      setTimeout(() => {
        setNotFound(true);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const normalizedCode = code.trim().toUpperCase();
      console.log('🔍 Carregando loja com código:', normalizedCode);
      
      const found = db.getStoreByCode(normalizedCode);
      
      if (found && found.id) {
        console.log('✅ Loja carregada com sucesso:', found.name, found.id);
        setStore(found);
        const allProducts = db.getProducts();
        const storeProducts = allProducts.filter(p => p.storeId === found.id && p.isActive);
        console.log('📦 Produtos encontrados:', storeProducts.length);
        setProducts(storeProducts);
        setIsLoading(false);
        setNotFound(false);
      } else {
        console.error('❌ Loja não encontrada com código:', normalizedCode);
        // Tenta buscar todas as lojas para debug
        const allStores = db.getStores();
        console.log('📋 Todas as lojas no banco:', allStores.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code
        })));
        
        setTimeout(() => {
          setNotFound(true);
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar loja:', error);
      setTimeout(() => {
        setNotFound(true);
        setIsLoading(false);
      }, 1000);
    }
  }, [code]);

  // Carrega dados do cliente logado (se houver)
  useEffect(() => {
    try {
      const customer = db.getCurrentCustomer();
      if (customer) {
        setCurrentCustomer(customer);
        setCustomerName(customer.name || '');
        
        // Carrega endereço salvo se existir
        if (customer.savedAddress) {
          setAddressData(customer.savedAddress);
        }
        
        // Carrega preferência de entrega
        if (customer.preferredDeliveryType) {
          setDeliveryType(customer.preferredDeliveryType);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    }
  }, []);

  // Carrega a loja quando o código muda
  useEffect(() => {
    setIsLoading(true);
    setNotFound(false);
    setStore(null);
    setProducts([]);
    loadStore();
  }, [code, loadStore]);

  // Recarrega a loja quando o localStorage muda (quando configurações são salvas)
  useEffect(() => {
    if (!code) return;

    // Listener para mudanças no localStorage (quando configurações são salvas em outra aba)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'foodzap_stores' && e.newValue) {
        console.log('🔄 Configurações da loja foram atualizadas (outra aba), recarregando...');
        loadStore();
      }
    };

    // Listener para evento customizado (quando configurações são salvas na mesma aba)
    const handleStoreUpdated = () => {
      console.log('🔄 Evento de atualização da loja recebido, recarregando...');
      loadStore();
    };

    // Recarrega quando a janela ganha foco
    const handleFocus = () => {
      console.log('🔄 Janela ganhou foco, recarregando loja...');
      loadStore();
    };

    // Recarrega a cada 3 segundos para pegar atualizações
    const interval = setInterval(() => {
      loadStore();
    }, 3000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('store-updated', handleStoreUpdated);
    window.addEventListener('focus', handleFocus);

    // Também escuta mudanças no mesmo contexto (não dispara storage event)
    const checkInterval = setInterval(() => {
      try {
        const currentStore = db.getStoreByCode(code.toUpperCase());
        if (currentStore && store) {
          // Compara se houve mudanças
          const storeChanged = 
            currentStore.name !== store.name ||
            currentStore.logo !== store.logo ||
            currentStore.banner !== store.banner ||
            JSON.stringify(currentStore.customization) !== JSON.stringify(store.customization) ||
            currentStore.description !== store.description ||
            currentStore.whatsapp !== store.whatsapp ||
            currentStore.address !== store.address;
          
          if (storeChanged) {
            console.log('🔄 Loja foi atualizada (detectado por comparação), recarregando...');
            loadStore();
          }
        } else if (currentStore && !store) {
          // Se não tinha loja mas agora tem, carrega
          loadStore();
        }
      } catch (error) {
        console.error('Erro ao verificar mudanças na loja:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(checkInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('store-updated', handleStoreUpdated);
      window.removeEventListener('focus', handleFocus);
    };
  }, [code, loadStore, store]);

  const addToCart = (product: Product) => {
    try {
      if (!product || !product.id) {
        console.error('Produto inválido:', product);
        return;
      }
      setCart(prev => {
        const existing = prev.find(item => item.product?.id === product.id);
        if (existing) {
          return prev.map(item => 
            item.product?.id === product.id 
              ? { ...item, quantity: (item.quantity || 0) + 1 } 
              : item
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      alert('Erro ao adicionar produto ao carrinho. Tente novamente.');
    }
  };

  const removeFromCart = (productId: string) => {
    try {
      if (!productId) return;
      setCart(prev => prev.filter(item => item.product?.id !== productId));
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    try {
      if (!productId) return;
      setCart(prev => prev.map(item => {
        if (item.product?.id === productId) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }));
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
    }
  };

  const subtotal = useMemo(() => {
    try {
      return cart.reduce((sum, item) => {
        if (!item || !item.product || !item.product.price) return sum;
        return sum + (item.product.price * (item.quantity || 1));
      }, 0);
    } catch (error) {
      console.error('Erro ao calcular subtotal:', error);
      return 0;
    }
  }, [cart]);
  
  const discount = useMemo(() => {
    try {
      if (!store?.appDiscountEnabled) return 0;
      const discountValue = store.appDiscountValue || 0;
      return (subtotal * discountValue) / 100;
    } catch (error) {
      console.error('Erro ao calcular desconto:', error);
      return 0;
    }
  }, [subtotal, store?.appDiscountEnabled, store?.appDiscountValue]);

  const deliveryFee = useMemo(() => {
    try {
      if (deliveryType === 'pickup' || (store?.isDeliveryFree)) return 0;
      return store?.deliveryFee || 0;
    } catch (error) {
      console.error('Erro ao calcular taxa de entrega:', error);
      return 0;
    }
  }, [deliveryType, store?.isDeliveryFree, store?.deliveryFee]);

  const total = subtotal - discount + deliveryFee;

  const isStoreOpen = useMemo(() => {
    try {
      if (!store || !store.hours) return false;
      if (store.hours.isOpenAlways) return true;
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const openTime = store.hours.open || '08:00';
      const closeTime = store.hours.close || '22:00';
      return currentTime >= openTime && currentTime <= closeTime;
    } catch (error) {
      console.error('Erro ao verificar horário:', error);
      return false;
    }
  }, [store?.hours]);

  // Função para buscar CEP
  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setAddressData(prev => ({
          ...prev,
          cep: cleanCep,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
      } else {
        alert('CEP não encontrado. Verifique o CEP digitado.');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Formata o endereço completo para salvar
  const getFullAddress = () => {
    const parts = [
      addressData.street,
      addressData.number && `Nº ${addressData.number}`,
      addressData.complement && addressData.complement,
      addressData.neighborhood,
      addressData.city && `${addressData.city} - ${addressData.state}`,
      addressData.cep && `CEP: ${addressData.cep}`
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleFinalizeOrder = () => {
    try {
      if (!store || !store.id) {
        alert('Erro: Loja não encontrada. Por favor, recarregue a página.');
        return;
      }

      if (!customerName || !customerName.trim()) {
        alert('Por favor, preencha seu nome.');
        return;
      }

      if (cart.length === 0) {
        alert('Seu carrinho está vazio. Adicione produtos antes de finalizar o pedido.');
        return;
      }

      if (deliveryType === 'delivery') {
        if (!addressData.street || !addressData.street.trim()) {
          alert('Por favor, preencha o endereço completo.');
          return;
        }
        if (!addressData.number || !addressData.number.trim()) {
          alert('Por favor, preencha o número do endereço.');
          return;
        }
        if (!addressData.neighborhood || !addressData.neighborhood.trim()) {
          alert('Por favor, preencha o bairro.');
          return;
        }
      }

      if (!store.whatsapp || !store.whatsapp.trim()) {
        alert('Erro: WhatsApp da loja não configurado. Entre em contato com o lojista.');
        return;
      }
    
      const fullAddress = deliveryType === 'delivery' ? getFullAddress() : undefined;
      
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        storeId: store.id,
        customerName: customerName.trim(),
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        subtotal,
        deliveryFee,
        discount,
        total,
        deliveryType,
        address: fullAddress,
        createdAt: new Date().toISOString()
      };
      
      const allOrders = db.getOrders();
      db.saveOrders([...allOrders, newOrder]);

      // Salva endereço e preferências do cliente se solicitado
      if (saveAddress && currentCustomer) {
        try {
          const customers = db.getCustomers();
          const updatedCustomers = customers.map(c => {
            if (c.id === currentCustomer.id) {
              return {
                ...c,
                savedAddress: deliveryType === 'delivery' && fullAddress ? addressData : undefined,
                preferredDeliveryType: deliveryType
              };
            }
            return c;
          });
          db.saveCustomers(updatedCustomers);
          
          // Atualiza o cliente atual
          const updatedCustomer = {
            ...currentCustomer,
            savedAddress: deliveryType === 'delivery' && fullAddress ? addressData : undefined,
            preferredDeliveryType: deliveryType
          };
          db.setCurrentCustomer(updatedCustomer);
          setCurrentCustomer(updatedCustomer);
        } catch (error) {
          console.error('Erro ao salvar endereço do cliente:', error);
        }
      }

    // Formata a data e hora do pedido
    const orderDate = new Date();
    const formattedDate = orderDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Cria lista de itens compacta
    const itemsList = cart.map((item) => {
      return `${item.quantity}x ${item.product.name}`;
    }).join(', ');

    // Mensagem curta e objetiva
    let message = `*${store.name}*\n`;
    message += `*NOVO PEDIDO*\n\n`;
    message += `Cliente: ${customerName}\n`;
    message += `${formattedDate} - ${formattedTime}\n\n`;
    message += `*Itens:* ${itemsList}\n\n`;
    
    if (deliveryType === 'delivery' && fullAddress) {
      message += `*Endereco:* ${fullAddress}\n`;
      if (deliveryFee > 0) {
        message += `Frete: R$ ${deliveryFee.toFixed(2)}\n`;
      }
    } else {
      message += `*Retirada na Loja*\n`;
    }
    
    if (discount > 0) {
      message += `Desconto: R$ ${discount.toFixed(2)}\n`;
    }
    
    message += `\n*TOTAL: R$ ${total.toFixed(2)}*`;

      // Salva endereço e preferências do cliente se solicitado
      if (saveAddress && currentCustomer) {
        try {
          const customers = db.getCustomers();
          const updatedCustomers = customers.map(c => {
            if (c.id === currentCustomer.id) {
              return {
                ...c,
                savedAddress: deliveryType === 'delivery' && fullAddress ? addressData : undefined,
                preferredDeliveryType: deliveryType
              };
            }
            return c;
          });
          db.saveCustomers(updatedCustomers);
          
          // Atualiza o cliente atual
          const updatedCustomer = {
            ...currentCustomer,
            savedAddress: deliveryType === 'delivery' && fullAddress ? addressData : undefined,
            preferredDeliveryType: deliveryType
          };
          db.setCurrentCustomer(updatedCustomer);
          setCurrentCustomer(updatedCustomer);
          console.log('✅ Endereço e preferências salvos com sucesso');
        } catch (error) {
          console.error('Erro ao salvar endereço do cliente:', error);
        }
      }

      // Codifica a mensagem corretamente para WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${store.whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`;
      
      // Fecha o carrinho
      setIsCartOpen(false);
      setCart([]);
      setCheckoutStep('cart');
      setSaveAddress(false);
      
      // Não limpa o nome e endereço se o cliente estiver logado e salvou
      if (!saveAddress || !currentCustomer) {
        setCustomerName('');
        setAddressData({
          cep: '',
          street: '',
          neighborhood: '',
          city: '',
          state: '',
          number: '',
          complement: ''
        });
      }
      
      // Abre WhatsApp
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar pedido. Por favor, tente novamente.');
    }
  };

  // Mostra loading apenas enquanto está carregando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold animate-pulse">Preparando a vitrine...</p>
        </div>
      </div>
    );
  }

  // Mostra erro se loja não foi encontrada
  if (notFound || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <StoreIcon size={40} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4">Loja não encontrada</h1>
          <p className="text-slate-500 font-medium mb-2">
            O código da loja <span className="font-black text-slate-700">{code?.toUpperCase()}</span> não foi encontrado.
            <br />
            <span className="text-sm text-slate-500 mt-2 block">
              Verifique se o código está correto ou entre em contato com o lojista.
            </span>
          </p>
          <p className="text-slate-400 text-sm mb-8">
            Verifique se o código está correto ou entre em contato com o lojista.
          </p>
          <a
            href="#/login"
            className="inline-block px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  // Aplica personalizações da loja
  const customization = store?.customization || {
    primaryColor: '#f97316',
    secondaryColor: '#fb923c',
    backgroundColor: '#fdfcfb',
    textColor: '#1e293b',
    accentColor: '#22c55e',
    buttonStyle: 'rounded',
    cardStyle: 'elevated',
    fontSize: 'medium',
    theme: 'light'
  };

  // Funções auxiliares para aplicar estilos
  const getButtonStyle = () => {
    const base = `background-color: ${customization.primaryColor};`;
    switch (customization.buttonStyle) {
      case 'square':
        return base + ' border-radius: 0.5rem;';
      case 'pill':
        return base + ' border-radius: 9999px;';
      default:
        return base + ' border-radius: 1.5rem;';
    }
  };

  const getCardStyle = () => {
    switch (customization.cardStyle) {
      case 'flat':
        return 'shadow-none border border-slate-200';
      case 'outlined':
        return 'shadow-none border-2 border-slate-300';
      default:
        return 'shadow-xl shadow-orange-50/50 border border-orange-50';
    }
  };

  const getFontSize = () => {
    switch (customization.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <div 
      className="min-h-screen pb-40 md:pb-32"
      style={{ backgroundColor: customization.backgroundColor, color: customization.textColor }}
    >
      {/* Professional Header */}
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <img src={store.banner} alt={store.name} className="w-full h-full object-cover" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="relative">
                <img 
                  src={store.logo} 
                  alt={store.name} 
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl border-4 border-white/20 shadow-2xl object-cover bg-white/10 backdrop-blur-sm" 
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-2 sm:border-4 border-white flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-2 sm:mb-3">
                {store.name}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base md:text-lg font-medium mb-3 sm:mb-4 max-w-2xl">
                {store.description}
              </p>
              
              {/* Status & Info Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${
                  isStoreOpen 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  <Clock size={14} className="sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">{isStoreOpen ? 'Aberto agora' : 'Fechado'}</span>
                  {!store.hours.isOpenAlways && <span className="hidden sm:inline"> • {store.hours.open} - {store.hours.close}</span>}
                </div>
                
                <div 
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border"
                  style={{ 
                    backgroundColor: `${customization.primaryColor}20`,
                    color: customization.primaryColor,
                    borderColor: `${customization.primaryColor}30`
                  }}
                >
                  <Truck size={14} className="sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">{store.deliveryType === 'pickup' 
                    ? 'Retirada' 
                    : store.isDeliveryFree 
                      ? 'Frete Grátis' 
                      : `Frete R$ ${store.deliveryFee.toFixed(2)}`}</span>
                </div>
                
                {store.appDiscountEnabled && (
                  <div 
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border"
                    style={{ 
                      backgroundColor: `${customization.accentColor}20`,
                      color: customization.accentColor,
                      borderColor: `${customization.accentColor}30`
                    }}
                  >
                    <span>🎁</span>
                    <span className="whitespace-nowrap">{store.appDiscountValue}% de desconto</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">

        {/* Menu Sections - Professional Grid */}
        <div className="space-y-20">
          {Object.values(Category).map(cat => {
            const catProds = products.filter(p => p.category === cat);
            if (catProds.length === 0) return null;
            return (
              <section key={cat} className="scroll-mt-8">
                {/* Section Header */}
                <div className="mb-6 sm:mb-10">
                  <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                    <div 
                      className="h-1 w-8 sm:w-12 rounded-full"
                      style={{ backgroundColor: customization.primaryColor }}
                    ></div>
                    <h2 
                      className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight"
                      style={{ color: customization.textColor }}
                    >
                      {cat}
                    </h2>
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium ml-11 sm:ml-16">
                    {catProds.length} {catProds.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
                  </p>
                </div>
                
                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {catProds.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => addToCart(product)}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 hover:border-slate-200"
                    >
                      {/* Product Image */}
                      <div className="relative h-48 overflow-hidden bg-slate-50">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* Add Button Overlay */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white"
                            style={{ backgroundColor: customization.primaryColor }}
                          >
                            <Plus size={24} strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 sm:p-5">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight mb-2 group-hover:text-slate-700 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-3 sm:mb-4 min-h-[2.5rem]">
                          {product.description}
                        </p>
                        
                        {/* Price & Action */}
                        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 gap-3">
                          <div className="flex-1 min-w-0">
                            <span 
                              className="text-xl sm:text-2xl font-black block truncate"
                              style={{ color: customization.primaryColor }}
                            >
                              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div 
                            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white transition-all group-hover:scale-105 whitespace-nowrap min-h-[44px] flex items-center justify-center"
                            style={{ backgroundColor: customization.primaryColor }}
                          >
                            Adicionar
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Professional Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 sm:px-6 z-50">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 flex items-center justify-between shadow-2xl transition-all hover:scale-[1.02] active:scale-98 rounded-2xl backdrop-blur-sm border border-white/20 min-h-[60px]"
            style={{
              backgroundColor: customization.primaryColor,
              borderRadius: customization.buttonStyle === 'pill' ? '9999px' : customization.buttonStyle === 'square' ? '0.75rem' : '1rem',
              boxShadow: `0 20px 25px -5px ${customization.primaryColor}40, 0 0 0 1px rgba(0,0,0,0.05)`
            }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
                <span className="absolute -top-2 -right-2 bg-white text-slate-900 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black shadow-md">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold">Ver Pedido</div>
                <div className="text-[10px] sm:text-xs opacity-90">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] sm:text-xs opacity-90 font-medium">Total</div>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer (Modern & Juicy) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-4 sm:p-6 md:p-8 border-b border-orange-50 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Cesta</h2>
                <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">{store.name}</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2.5 sm:p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={22} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 custom-scrollbar pb-safe">
              {checkoutStep === 'cart' && (
                <div className="space-y-6 sm:space-y-8">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 sm:gap-5">
                      <img src={item.product.image} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[20px] object-cover shadow-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-sm sm:text-base truncate">{item.product.name}</h4>
                        <p className="text-orange-500 font-black text-xs sm:text-sm mt-1">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 bg-orange-50 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 flex-shrink-0">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-2 sm:p-2.5 bg-white text-orange-500 rounded-lg sm:rounded-xl shadow-sm hover:scale-105 active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <Minus size={16} strokeWidth={3} />
                        </button>
                        <span className="text-sm sm:text-base font-black w-6 sm:w-8 text-center text-orange-600">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-2 sm:p-2.5 bg-white text-orange-500 rounded-lg sm:rounded-xl shadow-sm hover:scale-105 active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-20">
                      <ShoppingBag size={64} className="mx-auto text-slate-100 mb-4" />
                      <p className="text-slate-400 font-bold">Sua cesta está vazia</p>
                    </div>
                  )}
                </div>
              )}

              {checkoutStep === 'delivery' && (
                <div className="space-y-6 sm:space-y-10">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-4 sm:mb-6">Como vai ser?</h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {(store.deliveryType === 'both' || store.deliveryType === 'delivery') && (
                        <button 
                          onClick={() => setDeliveryType('delivery')}
                          className={`p-4 sm:p-6 rounded-2xl sm:rounded-[28px] border-2 transition-all flex items-center gap-4 sm:gap-6 min-h-[80px] ${deliveryType === 'delivery' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-300'}`}
                        >
                          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl flex-shrink-0 ${deliveryType === 'delivery' ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-300'}`}>
                            <Truck size={24} className="sm:w-8 sm:h-8" />
                          </div>
                          <div className="text-left">
                            <span className="font-black text-base sm:text-lg block">Delivery</span>
                            <span className="text-xs font-bold opacity-70">Levamos até você</span>
                          </div>
                        </button>
                      )}
                      {(store.deliveryType === 'both' || store.deliveryType === 'pickup') && (
                        <button 
                          onClick={() => setDeliveryType('pickup')}
                          className={`p-4 sm:p-6 rounded-2xl sm:rounded-[28px] border-2 transition-all flex items-center gap-4 sm:gap-6 min-h-[80px] ${deliveryType === 'pickup' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-300'}`}
                        >
                          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl flex-shrink-0 ${deliveryType === 'pickup' ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-300'}`}>
                            <StoreIcon size={24} className="sm:w-8 sm:h-8" />
                          </div>
                          <div className="text-left">
                            <span className="font-black text-base sm:text-lg block">Retirada</span>
                            <span className="text-xs font-bold opacity-70">Você retira na loja</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {deliveryType === 'pickup' && (
                    <>
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Seu Nome</label>
                        <input 
                          type="text"
                          className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                          placeholder="Ex: João Silva"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl">
                        <p className="font-black text-xs uppercase text-orange-400 mb-2 flex items-center gap-2">
                          <StoreIcon size={14} /> Endereço de Retirada
                        </p>
                        <p className="font-medium text-sm leading-relaxed">
                          {store.address || 'Será informado após o pedido no WhatsApp.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {checkoutStep === 'address' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Seu Nome</label>
                    <input 
                      type="text"
                      className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                      placeholder="Ex: João Silva"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                  
                  {/* Opção de usar endereço salvo */}
                  {currentCustomer && currentCustomer.savedAddress && deliveryType === 'delivery' && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                            <MapPin size={16} className="text-orange-500" />
                            Endereço Salvo
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {currentCustomer.savedAddress.street}, {currentCustomer.savedAddress.number}
                            {currentCustomer.savedAddress.complement && ` - ${currentCustomer.savedAddress.complement}`}
                            <br />
                            {currentCustomer.savedAddress.neighborhood} - {currentCustomer.savedAddress.city}/{currentCustomer.savedAddress.state}
                            <br />
                            CEP: {currentCustomer.savedAddress.cep}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setAddressData(currentCustomer.savedAddress);
                            setSaveAddress(true);
                          }}
                          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-500 text-white font-bold rounded-lg text-sm hover:bg-orange-600 transition-colors whitespace-nowrap min-h-[44px]"
                        >
                          Usar Este
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {deliveryType === 'delivery' && (
                    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3 flex items-center gap-2">
                          <MapPin size={14} />
                          CEP
                        </label>
                        <div className="flex gap-2 sm:gap-3">
                          <input 
                            type="text"
                            className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                            placeholder="00000-000"
                            value={addressData.cep}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 8) {
                                const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                                setAddressData(prev => ({ ...prev, cep: formatted || value }));
                                
                                // Busca automaticamente quando o CEP tiver 8 dígitos
                                if (value.length === 8) {
                                  fetchCep(value);
                                }
                              }
                            }}
                            maxLength={9}
                          />
                          {isLoadingCep && (
                            <div className="flex items-center px-3 sm:px-4 text-orange-500">
                              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Digite o CEP e o endereço será preenchido automaticamente</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Rua / Avenida</label>
                          <input 
                            type="text"
                            className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                            placeholder="Nome da rua ou avenida"
                            value={addressData.street}
                            onChange={e => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Número</label>
                          <input 
                            type="text"
                            className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                            placeholder="Nº"
                            value={addressData.number}
                            onChange={e => setAddressData(prev => ({ ...prev, number: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Complemento</label>
                          <input 
                            type="text"
                            className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                            placeholder="Apt, Bloco, etc (opcional)"
                            value={addressData.complement}
                            onChange={e => setAddressData(prev => ({ ...prev, complement: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Bairro</label>
                          <input 
                            type="text"
                            className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                            placeholder="Bairro"
                            value={addressData.neighborhood}
                            onChange={e => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Cidade</label>
                          <input 
                            type="text"
                            className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base min-h-[48px]"
                            placeholder="Cidade"
                            value={addressData.city}
                            onChange={e => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3">Estado (UF)</label>
                          <input 
                            type="text"
                            className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl sm:rounded-[20px] outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700 text-base uppercase min-h-[48px]"
                            placeholder="SP"
                            maxLength={2}
                            value={addressData.state}
                            onChange={e => setAddressData(prev => ({ ...prev, state: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') }))}
                          />
                        </div>
                      </div>
                      
                      {/* Checkbox para salvar endereço */}
                      {currentCustomer && (
                        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-slate-200">
                          <input
                            type="checkbox"
                            id="saveAddress"
                            checked={saveAddress}
                            onChange={(e) => setSaveAddress(e.target.checked)}
                            className="w-5 h-5 accent-orange-500 cursor-pointer"
                          />
                          <label htmlFor="saveAddress" className="text-sm font-bold text-slate-700 cursor-pointer flex-1">
                            Salvar este endereço para próximas compras
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 backdrop-blur-sm border-t border-orange-50 space-y-4 sm:space-y-6 sticky bottom-0">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600 font-black bg-green-50 px-3 py-1 rounded-lg">
                    <span>🎁 Desconto App</span>
                    <span>-R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-500">
                    <span>Taxa de Entrega</span>
                    <span>{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis ✨'}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl sm:text-3xl font-black pt-3 sm:pt-4" style={{ color: customization.textColor }}>
                  <span>Total</span>
                  <span style={{ color: customization.primaryColor }}>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {checkoutStep === 'cart' && (
                  <button 
                    disabled={cart.length === 0}
                    onClick={() => setCheckoutStep('delivery')}
                    className="w-full bg-slate-900 text-white font-black py-4 sm:py-5 rounded-2xl sm:rounded-[24px] flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-xl shadow-slate-100 disabled:opacity-30 disabled:grayscale min-h-[52px]"
                  >
                    Próximo: Entrega
                    <ChevronRight size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={3} />
                  </button>
                )}

                {checkoutStep === 'delivery' && (
                  <div className="space-y-3 sm:space-y-4">
                    {deliveryType === 'pickup' ? (
                      <div className="flex gap-3 sm:gap-4">
                        <button 
                          onClick={() => setCheckoutStep('cart')} 
                          className="flex-1 bg-white border-2 border-slate-100 text-slate-400 font-black py-4 sm:py-5 transition-all hover:border-slate-200 min-h-[52px] rounded-2xl sm:rounded-[24px]"
                        >
                          Voltar
                        </button>
                        <button 
                          disabled={!isStoreOpen || !customerName}
                          onClick={handleFinalizeOrder}
                          className="flex-[3] bg-[#25D366] text-white font-black py-4 sm:py-5 rounded-2xl sm:rounded-[24px] flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 transition-all shadow-xl shadow-green-100 disabled:opacity-40 disabled:bg-slate-300 min-h-[52px] text-sm sm:text-base"
                        >
                          <WhatsAppIcon size={20} className="sm:w-6 sm:h-6 fill-current" />
                          <span className="hidden sm:inline">Pedir no WhatsApp</span>
                          <span className="sm:hidden">Pedir</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3 sm:gap-4">
                        <button 
                          onClick={() => setCheckoutStep('cart')} 
                          className="flex-1 bg-white border-2 border-slate-100 text-slate-400 font-black py-4 sm:py-5 transition-all hover:border-slate-200 min-h-[52px] rounded-2xl sm:rounded-[24px]"
                        >
                          Voltar
                        </button>
                        <button 
                          onClick={() => setCheckoutStep('address')} 
                          className="flex-[2] text-white font-black py-4 sm:py-5 transition-all shadow-xl min-h-[52px] rounded-2xl sm:rounded-[24px]"
                          style={{
                            backgroundColor: customization.primaryColor
                          }}
                        >
                          Próximo
                        </button>
                      </div>
                    )}
                    {!isStoreOpen && (
                      <div className="bg-red-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-red-500 text-center font-black text-[10px] uppercase tracking-widest">
                        A loja está fechada agora. Volte em breve! 🥯
                      </div>
                    )}
                  </div>
                )}

                {checkoutStep === 'address' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex gap-3 sm:gap-4">
                      <button onClick={() => setCheckoutStep('delivery')} className="flex-1 bg-white border-2 border-slate-100 text-slate-400 font-black py-4 sm:py-5 rounded-2xl sm:rounded-[24px] min-h-[52px]">Voltar</button>
                      <button 
                        disabled={!isStoreOpen || !customerName || (deliveryType === 'delivery' && (!addressData.street || !addressData.number || !addressData.neighborhood))}
                        onClick={handleFinalizeOrder}
                        className="flex-[3] bg-[#25D366] text-white font-black py-4 sm:py-5 rounded-2xl sm:rounded-[24px] flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 transition-all shadow-xl shadow-green-100 disabled:opacity-40 disabled:bg-slate-300 min-h-[52px] text-sm sm:text-base"
                      >
                        <WhatsAppIcon size={20} className="sm:w-6 sm:h-6 fill-current" />
                        <span className="hidden sm:inline">Pedir no WhatsApp</span>
                        <span className="sm:hidden">Pedir</span>
                      </button>
                    </div>
                    {!isStoreOpen && (
                      <div className="bg-red-50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-red-500 text-center font-black text-[10px] uppercase tracking-widest">
                        A loja está fechada agora. Volte em breve! 🥯
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default PublicStore;
