
export enum Category {
  DOCE = 'Doce',
  SALGADO = 'Salgado',
  BEBIDA = 'Bebida',
  COMBO = 'Combo',
  OUTROS = 'Outros'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  isActive: boolean;
  storeId: string; // ID da loja que possui este produto
}

export interface OperatingHours {
  open: string; // HH:mm
  close: string; // HH:mm
  isOpenAlways: boolean;
}

export interface StoreCustomization {
  primaryColor: string; // Cor primária (botões, destaques)
  secondaryColor: string; // Cor secundária (acentos)
  backgroundColor: string; // Cor de fundo da página
  textColor: string; // Cor do texto principal
  accentColor: string; // Cor de destaque para promoções
  buttonStyle: 'rounded' | 'square' | 'pill'; // Estilo dos botões
  cardStyle: 'flat' | 'elevated' | 'outlined'; // Estilo dos cards
  fontSize: 'small' | 'medium' | 'large'; // Tamanho da fonte
  theme: 'light' | 'dark' | 'auto'; // Tema da página
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  code: string; // Código único da loja
  logo: string;
  banner: string;
  description: string;
  whatsapp: string;
  address: string;
  deliveryType: 'pickup' | 'delivery' | 'both';
  deliveryFee: number;
  isDeliveryFree: boolean;
  appDiscountEnabled: boolean;
  appDiscountValue: number; // Percentage
  hours: OperatingHours;
  customization?: StoreCustomization; // Personalização da página
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Senha para lojistas
  storeId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  password: string;
  storeCode: string; // Código da loja associada
  storeId: string; // ID da loja
}

export interface Order {
  id: string;
  storeId: string;
  customerName: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryType: 'pickup' | 'delivery';
  address?: string;
  createdAt: string;
}
