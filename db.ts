
import { Store, User, Product, Order, Customer, Category } from './types';

// SheetDB API URL
const SHEETDB_API = 'https://sheetdb.io/api/v1/zrfkrm8qm5r3s';

const STORAGE_KEYS = {
  USERS: 'foodzap_users',
  STORES: 'foodzap_stores',
  PRODUCTS: 'foodzap_products',
  ORDERS: 'foodzap_orders',
  CURRENT_USER: 'foodzap_current_user',
  CUSTOMERS: 'foodzap_customers',
  CURRENT_CUSTOMER: 'foodzap_current_customer',
  INITIALIZED: 'foodzap_initialized' // Flag para saber se já inicializou
};

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Funções para sincronizar com SheetDB
// SheetDB funciona como API REST - envia dados como linhas do Google Sheets
const syncToSheetDB = async (table: string, data: any[]) => {
  try {
    // Para cada item, envia como uma linha no SheetDB
    // SheetDB espera um objeto com campos que correspondem às colunas do sheet
    for (const item of data) {
      try {
        // Cria registro para o SheetDB com todos os dados serializados
        const record: any = {
          table_type: table,
          record_id: item.id || Math.random().toString(36).substr(2, 9),
          data: JSON.stringify(item),
          updated_at: new Date().toISOString()
        };

        await fetch(`${SHEETDB_API}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record)
        });
      } catch (err) {
        // Continua mesmo se algum registro falhar - não bloqueia a aplicação
      }
    }
    
    console.log(`✅ ${data.length} registros sincronizados com SheetDB (${table})`);
  } catch (error) {
    // Silenciosamente falha - mantém funcionamento local sempre
    // Não mostra erro ao usuário para não interromper o uso
  }
};

const getFromSheetDB = async <T,>(table: string, defaultValue: T): Promise<T> => {
  try {
    // Busca dados do SheetDB - pode filtrar por campo se necessário
    const response = await fetch(`${SHEETDB_API}?table_type=${table}`);
    if (!response.ok) {
      return defaultValue;
    }
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      // Converte dados do SheetDB de volta para o formato esperado
      const parsed = data
        .map((item: any) => {
          try {
            // Tenta parsear do campo 'data' ou usa o objeto diretamente
            if (item.data) {
              return JSON.parse(item.data);
            }
            return item;
          } catch {
            return null;
          }
        })
        .filter((item: any) => item !== null);
      
      return parsed as T;
    }
    return defaultValue;
  } catch (error) {
    // Se falhar, retorna o valor padrão (dados locais)
    return defaultValue;
  }
};

// Função específica para salvar cadastro de lojista no SheetDB com as colunas específicas
const saveStoreOwnerToSheetDB = async (data: {
  email: string;
  password: string;
  storeName: string;
  whatsapp: string;
  foodType: string;
  fullName: string;
}) => {
  try {
    // Mapeia o foodType para texto legível
    const especialidadeMap: Record<string, string> = {
      'both': 'Doces e Salgados',
      'sweet': 'Doces / Confeitaria',
      'savory': 'Salgados / Lanches',
      'lunch': 'Marmitas / Almoço'
    };

    const record = {
      'E-mail': data.email,
      'Senha': data.password,
      'Nome da Loja': data.storeName,
      'WhatsApp (com DDD)': data.whatsapp,
      'Especialidade': especialidadeMap[data.foodType] || data.foodType,
      'Nome Completo': data.fullName,
      'Data Cadastro': new Date().toISOString().split('T')[0]
    };

    await fetch(`${SHEETDB_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record)
    });

    console.log('✅ Cadastro de lojista salvo no SheetDB');
  } catch (error) {
    console.warn('Erro ao salvar cadastro no SheetDB:', error);
    // Não interrompe o fluxo - continua funcionando localmente
  }
};

// Função para inicializar o banco com dados de exemplo
const initializeDatabase = () => {
  // Verifica se já foi inicializado
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized === 'true') {
    return; // Já foi inicializado, não precisa fazer nada
  }

  // IDs fixos para garantir consistência
  const demoUserId = 'demo_user_001';
  const demoStoreId = 'demo_store_001';
  const demoStoreCode = 'FOOD01'; // Código fixo para teste

  // Cria usuário lojista de exemplo
  const demoUser: User = {
    id: demoUserId,
    name: 'João Silva',
    email: 'joao@exemplo.com',
    password: '123456', // Senha padrão para facilitar
    storeId: demoStoreId
  };

  // Cria loja de exemplo
  const demoStore: Store = {
    id: demoStoreId,
    ownerId: demoUserId,
    name: 'Delícias da Casa',
    slug: 'delicias-da-casa',
    code: demoStoreCode,
    logo: 'https://picsum.photos/200?random=1',
    banner: 'https://picsum.photos/800/200?random=2',
    description: 'As melhores receitas caseiras com ingredientes selecionados. Faça seu pedido e receba em casa!',
    whatsapp: '5511999999999',
    address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
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
      primaryColor: '#f97316', // laranja
      secondaryColor: '#fb923c', // laranja claro
      backgroundColor: '#fdfcfb', // branco suave
      textColor: '#1e293b', // slate escuro
      accentColor: '#22c55e', // verde
      buttonStyle: 'rounded',
      cardStyle: 'elevated',
      fontSize: 'medium',
      theme: 'light'
    }
  };

  // Cria produtos de exemplo
  const demoProducts: Product[] = [
    {
      id: 'prod_001',
      name: 'Hambúrguer Artesanal',
      description: 'Pão brioche, carne 180g, queijo cheddar, bacon, alface e tomate',
      price: 24.90,
      image: 'https://picsum.photos/400/300?random=10',
      category: Category.SALGADO,
      isActive: true,
      storeId: demoStoreId
    },
    {
      id: 'prod_002',
      name: 'Brownie com Sorvete',
      description: 'Brownie quentinho acompanhado de sorvete de creme',
      price: 18.50,
      image: 'https://picsum.photos/400/300?random=11',
      category: Category.DOCE,
      isActive: true,
      storeId: demoStoreId
    },
    {
      id: 'prod_003',
      name: 'Pizza Margherita',
      description: 'Massa fina, molho de tomate, mussarela e manjericão',
      price: 32.00,
      image: 'https://picsum.photos/400/300?random=12',
      category: Category.SALGADO,
      isActive: true,
      storeId: demoStoreId
    },
    {
      id: 'prod_004',
      name: 'Suco Natural de Laranja',
      description: 'Suco fresco feito na hora, 500ml',
      price: 8.00,
      image: 'https://picsum.photos/400/300?random=13',
      category: Category.BEBIDA,
      isActive: true,
      storeId: demoStoreId
    },
    {
      id: 'prod_005',
      name: 'Coxinha de Frango',
      description: 'Coxinha caseira recheada com frango desfiado',
      price: 6.50,
      image: 'https://picsum.photos/400/300?random=14',
      category: Category.SALGADO,
      isActive: true,
      storeId: demoStoreId
    },
    {
      id: 'prod_006',
      name: 'Brigadeiro Gourmet',
      description: 'Brigadeiro artesanal com chocolate belga',
      price: 4.50,
      image: 'https://picsum.photos/400/300?random=15',
      category: Category.DOCE,
      isActive: true,
      storeId: demoStoreId
    }
  ];

  // Salva todos os dados
  saveToStorage(STORAGE_KEYS.USERS, [demoUser]);
  saveToStorage(STORAGE_KEYS.STORES, [demoStore]);
  saveToStorage(STORAGE_KEYS.PRODUCTS, demoProducts);
  saveToStorage(STORAGE_KEYS.ORDERS, []);
  saveToStorage(STORAGE_KEYS.CUSTOMERS, []);
  
  // Marca como inicializado
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

  console.log('✅ Banco de dados inicializado com sucesso!');
  console.log(`📧 Login: ${demoUser.email} | Senha: ${demoUser.password}`);
  console.log(`🏪 Código da Loja: ${demoStoreCode}`);
};

export const db = {
  // Inicializa o banco de dados (chamar uma vez no início do app)
  initialize: () => {
    initializeDatabase();
    // Tenta sincronizar com SheetDB em background
    db.syncFromSheetDB().catch(() => {
      // Se falhar, continua funcionando localmente
    });
  },

  // Sincroniza dados do SheetDB para localStorage (opcional)
  syncFromSheetDB: async () => {
    try {
      // Tenta buscar dados do SheetDB e mesclar com local
      const [sheetUsers, sheetStores, sheetProducts, sheetOrders, sheetCustomers] = await Promise.all([
        getFromSheetDB<User[]>('users', []),
        getFromSheetDB<Store[]>('stores', []),
        getFromSheetDB<Product[]>('products', []),
        getFromSheetDB<Order[]>('orders', []),
        getFromSheetDB<Customer[]>('customers', [])
      ]);

      // Se encontrar dados no SheetDB, mescla com local (SheetDB tem prioridade)
      if (sheetStores.length > 0) {
        saveToStorage(STORAGE_KEYS.STORES, sheetStores);
      }
      if (sheetUsers.length > 0) {
        saveToStorage(STORAGE_KEYS.USERS, sheetUsers);
      }
      if (sheetProducts.length > 0) {
        saveToStorage(STORAGE_KEYS.PRODUCTS, sheetProducts);
      }
      if (sheetOrders.length > 0) {
        saveToStorage(STORAGE_KEYS.ORDERS, sheetOrders);
      }
      if (sheetCustomers.length > 0) {
        saveToStorage(STORAGE_KEYS.CUSTOMERS, sheetCustomers);
      }

      console.log('📊 SheetDB conectado - dados sincronizados');
    } catch (error) {
      console.warn('SheetDB sync error:', error);
      // Continua funcionando localmente mesmo se falhar
    }
  },

  // Limpa todos os dados e reinicializa (útil para testes)
  reset: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.INITIALIZED) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    initializeDatabase();
  },

  getUsers: () => getFromStorage<User[]>(STORAGE_KEYS.USERS, []),
  saveUsers: (users: User[]) => {
    saveToStorage(STORAGE_KEYS.USERS, users);
    // Sincroniza com SheetDB em background (não bloqueia)
    syncToSheetDB('users', users).catch(() => {});
  },
  
  getStores: () => getFromStorage<Store[]>(STORAGE_KEYS.STORES, []),
  saveStores: (stores: Store[]) => {
    saveToStorage(STORAGE_KEYS.STORES, stores);
    // Sincroniza com SheetDB em background (não bloqueia)
    syncToSheetDB('stores', stores).catch(() => {});
  },
  getStoreByCode: (code: string) => {
    const stores = getFromStorage<Store[]>(STORAGE_KEYS.STORES, []);
    return stores.find(s => s.code === code) || null;
  },
  
  getProducts: () => getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []),
  saveProducts: (products: Product[]) => {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    // Sincroniza com SheetDB em background (não bloqueia)
    syncToSheetDB('products', products).catch(() => {});
  },
  
  getOrders: () => getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []),
  saveOrders: (orders: Order[]) => {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    // Sincroniza com SheetDB em background (não bloqueia)
    syncToSheetDB('orders', orders).catch(() => {});
  },

  getCurrentUser: () => getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null) => saveToStorage(STORAGE_KEYS.CURRENT_USER, user),

  // Clientes
  getCustomers: () => getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []),
  saveCustomers: (customers: Customer[]) => {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    // Sincroniza com SheetDB em background (não bloqueia)
    syncToSheetDB('customers', customers).catch(() => {});
  },
  getCurrentCustomer: () => getFromStorage<Customer | null>(STORAGE_KEYS.CURRENT_CUSTOMER, null),
  setCurrentCustomer: (customer: Customer | null) => saveToStorage(STORAGE_KEYS.CURRENT_CUSTOMER, customer),

  // Função específica para salvar cadastro de lojista no SheetDB
  saveStoreOwnerRegistration: saveStoreOwnerToSheetDB
};
