
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
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) || defaultValue;
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
    // Tenta limpar e salvar novamente se o storage estiver cheio
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (retryError) {
      console.error(`Erro ao tentar salvar novamente ${key}:`, retryError);
    }
  }
};

// Função para verificar se um registro já existe no SheetDB
// Para clientes, verifica por email dentro do campo JSON 'data'
const checkRecordExists = async (table: string, identifier: string, identifierField: string = 'record_id'): Promise<boolean> => {
  try {
    // Busca todos os registros da tabela
    const response = await fetch(`${SHEETDB_API}?table_type=${table}`);
    if (!response.ok) {
      return false;
    }
    
    const allRecords = await response.json();
    if (!Array.isArray(allRecords) || allRecords.length === 0) {
      return false;
    }
    
    // Para clientes, verifica o email dentro do campo 'data' (JSON)
    if (table === 'customers' && identifierField === 'email') {
      const normalizedIdentifier = identifier.toLowerCase().trim();
      return allRecords.some((record: any) => {
        try {
          if (record.data) {
            const data = JSON.parse(record.data);
            return data.email?.toLowerCase().trim() === normalizedIdentifier;
          }
        } catch {
          // Ignora erros de parsing
        }
        return false;
      });
    }
    
    // Para outros casos, verifica por record_id
    return allRecords.some((record: any) => {
      return record.record_id === identifier || record.id === identifier;
    });
  } catch (error) {
    return false; // Se falhar, assume que não existe para não bloquear
  }
};

// Funções para sincronizar com SheetDB
// SheetDB funciona como API REST - envia dados como linhas do Google Sheets
// Agora verifica duplicatas antes de salvar
const syncToSheetDB = async (table: string, data: any[]) => {
  try {
    let savedCount = 0;
    let skippedCount = 0;
    
    // Para cada item, verifica se já existe antes de salvar
    for (const item of data) {
      try {
        // Identificador único baseado no tipo de tabela
        let identifier: string;
        let identifierField: string = 'record_id';
        
        if (table === 'customers' && item.email) {
          // Para clientes, usa email como identificador
          identifier = item.email.toLowerCase().trim();
          identifierField = 'email';
        } else if (item.id) {
          // Para outros, usa ID
          identifier = item.id;
        } else {
          // Se não tiver ID, gera um
          identifier = Math.random().toString(36).substr(2, 9);
        }
        
        // Verifica se já existe
        const exists = await checkRecordExists(table, identifier, identifierField);
        
        if (exists) {
          skippedCount++;
          continue; // Pula se já existe
        }
        
        // Cria registro para o SheetDB com todos os dados serializados
        const record: any = {
          table_type: table,
          record_id: item.id || identifier,
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
        
        savedCount++;
      } catch (err) {
        // Continua mesmo se algum registro falhar - não bloqueia a aplicação
        console.warn(`Erro ao salvar item no SheetDB (${table}):`, err);
      }
    }
    
    if (savedCount > 0 || skippedCount > 0) {
      console.log(`✅ SheetDB (${table}): ${savedCount} novos registros salvos, ${skippedCount} duplicados ignorados`);
    }
  } catch (error) {
    // Silenciosamente falha - mantém funcionamento local sempre
    // Não mostra erro ao usuário para não interromper o uso
    console.warn(`Erro ao sincronizar ${table} com SheetDB:`, error);
  }
};

const getFromSheetDB = async <T,>(table: string, defaultValue: T): Promise<T> => {
  try {
    // Busca dados do SheetDB - pode filtrar por campo se necessário
    const url = `${SHEETDB_API}?table_type=${table}`;
    console.log(`🔍 Buscando dados do Sheets (${table}):`, url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ Resposta do Sheets não OK (${table}):`, response.status, response.statusText);
      return defaultValue;
    }
    
    const data = await response.json();
    console.log(`📦 Dados brutos recebidos do Sheets (${table}):`, data);
    
    if (Array.isArray(data) && data.length > 0) {
      // Converte dados do SheetDB de volta para o formato esperado
      const parsed = data
        .map((item: any) => {
          try {
            // Tenta parsear do campo 'data' ou usa o objeto diretamente
            if (item.data) {
              const parsedData = JSON.parse(item.data);
              console.log(`✅ Item parseado (${table}):`, parsedData);
              return parsedData;
            }
            // Se não tiver campo 'data', tenta usar o item diretamente
            console.log(`📋 Item sem campo 'data' (${table}):`, item);
            return item;
          } catch (parseError) {
            console.warn(`⚠️ Erro ao parsear item (${table}):`, parseError, item);
            return null;
          }
        })
        .filter((item: any) => item !== null);
      
      console.log(`✅ ${parsed.length} item(s) parseado(s) com sucesso (${table})`);
      return parsed as T;
    }
    
    console.log(`ℹ️ Nenhum dado encontrado no Sheets (${table})`);
    return defaultValue;
  } catch (error) {
    console.error(`❌ Erro ao buscar dados do Sheets (${table}):`, error);
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
    // Verifica se o email já existe no SheetDB antes de salvar
    try {
      const response = await fetch(`${SHEETDB_API}/search?E-mail=${encodeURIComponent(data.email)}`);
      const existing = await response.json();
      
      if (Array.isArray(existing) && existing.length > 0) {
        console.log('⚠️ Email já existe no SheetDB, não será duplicado:', data.email);
        return; // Não salva se já existe
      }
    } catch (checkError) {
      // Se a verificação falhar, continua e tenta salvar
      console.log('Não foi possível verificar duplicatas, continuando...');
    }

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

    const response = await fetch(`${SHEETDB_API}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    console.log('✅ Cadastro de lojista salvo no SheetDB:', data.email);
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
    try {
      initializeDatabase();
      // Tenta sincronizar com SheetDB em background
      db.syncFromSheetDB().catch(() => {
        // Se falhar, continua funcionando localmente
      });
    } catch (error) {
      console.error('❌ Erro crítico ao inicializar banco de dados:', error);
      // Tenta limpar e reinicializar
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('foodzap_') && key !== 'foodzap_initialized') {
            localStorage.removeItem(key);
          }
        });
        // Tenta novamente
        initializeDatabase();
      } catch (retryError) {
        console.error('❌ Erro ao tentar reinicializar:', retryError);
      }
    }
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

      // Mescla dados do Sheets com dados locais (evita duplicatas)
      // Para clientes, mescla por email
      if (sheetCustomers.length > 0) {
        const localCustomers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
        const localEmails = new Set(localCustomers.map(c => c.email?.toLowerCase().trim()).filter(Boolean));
        
        // Adiciona apenas clientes do Sheets que não existem localmente
        const newCustomers = sheetCustomers.filter(c => {
          const email = c.email?.toLowerCase().trim();
          return email && !localEmails.has(email);
        });
        
        if (newCustomers.length > 0) {
          const mergedCustomers = [...localCustomers, ...newCustomers];
          saveToStorage(STORAGE_KEYS.CUSTOMERS, mergedCustomers);
          console.log(`✅ ${newCustomers.length} cliente(s) sincronizado(s) do Sheets`);
        }
      }

      // Para lojas, mescla por ID
      if (sheetStores.length > 0) {
        const localStores = getFromStorage<Store[]>(STORAGE_KEYS.STORES, []);
        const localStoreIds = new Set(localStores.map(s => s.id).filter(Boolean));
        
        const newStores = sheetStores.filter(s => s.id && !localStoreIds.has(s.id));
        
        if (newStores.length > 0) {
          const mergedStores = [...localStores, ...newStores];
          saveToStorage(STORAGE_KEYS.STORES, mergedStores);
          console.log(`✅ ${newStores.length} loja(s) sincronizada(s) do Sheets`);
        }
      }

      // Para usuários, mescla por email
      if (sheetUsers.length > 0) {
        const localUsers = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
        const localUserEmails = new Set(localUsers.map(u => u.email?.toLowerCase().trim()).filter(Boolean));
        
        const newUsers = sheetUsers.filter(u => {
          const email = u.email?.toLowerCase().trim();
          return email && !localUserEmails.has(email);
        });
        
        if (newUsers.length > 0) {
          const mergedUsers = [...localUsers, ...newUsers];
          saveToStorage(STORAGE_KEYS.USERS, mergedUsers);
          console.log(`✅ ${newUsers.length} usuário(s) sincronizado(s) do Sheets`);
        }
      }

      // Para produtos, mescla por ID
      if (sheetProducts.length > 0) {
        const localProducts = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
        const localProductIds = new Set(localProducts.map(p => p.id).filter(Boolean));
        
        const newProducts = sheetProducts.filter(p => p.id && !localProductIds.has(p.id));
        
        if (newProducts.length > 0) {
          const mergedProducts = [...localProducts, ...newProducts];
          saveToStorage(STORAGE_KEYS.PRODUCTS, mergedProducts);
          console.log(`✅ ${newProducts.length} produto(s) sincronizado(s) do Sheets`);
        }
      }

      // Para pedidos, mescla por ID
      if (sheetOrders.length > 0) {
        const localOrders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
        const localOrderIds = new Set(localOrders.map(o => o.id).filter(Boolean));
        
        const newOrders = sheetOrders.filter(o => o.id && !localOrderIds.has(o.id));
        
        if (newOrders.length > 0) {
          const mergedOrders = [...localOrders, ...newOrders];
          saveToStorage(STORAGE_KEYS.ORDERS, mergedOrders);
          console.log(`✅ ${newOrders.length} pedido(s) sincronizado(s) do Sheets`);
        }
      }

      console.log('📊 Sincronização do SheetDB concluída');
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
    // NÃO sincroniza automaticamente com SheetDB para evitar duplicatas
    // A sincronização é feita apenas através de saveStoreOwnerRegistration
  },
  
  getStores: () => getFromStorage<Store[]>(STORAGE_KEYS.STORES, []),
  saveStores: (stores: Store[]) => {
    saveToStorage(STORAGE_KEYS.STORES, stores);
    // NÃO sincroniza automaticamente com SheetDB para evitar duplicatas
    // A sincronização é feita apenas através de saveStoreOwnerRegistration
  },
  getStoreByCode: (code: string) => {
    try {
      if (!code || !code.trim()) {
        console.warn('⚠️ getStoreByCode: código vazio');
        return null;
      }
      
      const stores = getFromStorage<Store[]>(STORAGE_KEYS.STORES, []);
      const normalizedCode = code.trim().toUpperCase();
      
      console.log('🔍 Buscando loja com código:', normalizedCode);
      console.log('📦 Total de lojas no banco:', stores.length);
      console.log('📋 Códigos disponíveis:', stores.map(s => s.code || '(sem código)'));
      
      // Busca case-insensitive e sem espaços
      const found = stores.find(s => {
        if (!s.code) return false;
        const storeCode = s.code.trim().toUpperCase();
        return storeCode === normalizedCode;
      });
      
      if (found) {
        console.log('✅ Loja encontrada:', found.id, found.name, 'Código:', found.code);
        return found;
      } else {
        console.warn('❌ Loja não encontrada com código:', normalizedCode);
        // Tenta buscar sem normalização também (caso o código tenha sido salvo de forma diferente)
        const foundAlt = stores.find(s => {
          if (!s.code) return false;
          return s.code.trim() === code.trim() || 
                 s.code.trim().toUpperCase() === code.trim().toUpperCase() ||
                 s.code.trim().toLowerCase() === code.trim().toLowerCase();
        });
        
        if (foundAlt) {
          console.log('✅ Loja encontrada (busca alternativa):', foundAlt.id, foundAlt.name);
          return foundAlt;
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar loja por código:', error);
      return null;
    }
  },
  
  getProducts: () => getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []),
  saveProducts: async (products: Product[]) => {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    // Sincroniza apenas produtos novos com SheetDB (verifica duplicatas por ID)
    try {
      const existingSheetProducts = await getFromSheetDB<Product[]>('products', []);
      const existingIds = new Set(existingSheetProducts.map(p => p.id).filter(Boolean));
      
      const newProducts = products.filter(p => p.id && !existingIds.has(p.id));
      
      if (newProducts.length > 0) {
        await syncToSheetDB('products', newProducts);
      }
    } catch (error) {
      console.warn('Erro ao verificar duplicatas de produtos no SheetDB:', error);
    }
  },
  
  getOrders: () => getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []),
  saveOrders: async (orders: Order[]) => {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    // Sincroniza apenas pedidos novos com SheetDB (verifica duplicatas por ID)
    try {
      const existingSheetOrders = await getFromSheetDB<Order[]>('orders', []);
      const existingIds = new Set(existingSheetOrders.map(o => o.id).filter(Boolean));
      
      const newOrders = orders.filter(o => o.id && !existingIds.has(o.id));
      
      if (newOrders.length > 0) {
        await syncToSheetDB('orders', newOrders);
      }
    } catch (error) {
      console.warn('Erro ao verificar duplicatas de pedidos no SheetDB:', error);
    }
  },

  getCurrentUser: () => getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null) => saveToStorage(STORAGE_KEYS.CURRENT_USER, user),

  // Clientes
  getCustomers: () => getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []),
  saveCustomers: async (customers: Customer[], skipSheetSync: boolean = false) => {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    
    // Se skipSheetSync for true, não sincroniza (útil para atualizações de clientes existentes)
    if (skipSheetSync) {
      return;
    }
    
    // Sincroniza apenas clientes novos com SheetDB (verifica duplicatas por email)
    try {
      // Busca clientes existentes no SheetDB
      const existingSheetCustomers = await getFromSheetDB<Customer[]>('customers', []);
      const existingEmails = new Set(existingSheetCustomers.map(c => c.email?.toLowerCase().trim()).filter(Boolean));
      
      // Filtra apenas clientes novos (que não existem no SheetDB)
      const newCustomers = customers.filter(c => {
        const email = c.email?.toLowerCase().trim();
        return email && !existingEmails.has(email);
      });
      
      if (newCustomers.length > 0) {
        // Sincroniza apenas os novos clientes
        await syncToSheetDB('customers', newCustomers);
        console.log(`✅ ${newCustomers.length} novo(s) cliente(s) salvo(s) no SheetDB`);
      }
    } catch (error) {
      console.warn('Erro ao verificar duplicatas de clientes no SheetDB:', error);
      // Continua funcionando localmente mesmo se falhar
    }
  },
  getCurrentCustomer: () => getFromStorage<Customer | null>(STORAGE_KEYS.CURRENT_CUSTOMER, null),
  setCurrentCustomer: (customer: Customer | null) => saveToStorage(STORAGE_KEYS.CURRENT_CUSTOMER, customer),

  // Função específica para salvar cadastro de lojista no SheetDB
  saveStoreOwnerRegistration: saveStoreOwnerToSheetDB
};
