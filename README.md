# 🍕 FoodZap MVP

Sistema completo de gestão de pedidos online para restaurantes e lanchonetes, com integração direta via WhatsApp.

## 🚀 Funcionalidades

### Para Lojistas:
- ✅ Dashboard completo de gestão
- ✅ Cadastro e gerenciamento de produtos
- ✅ Categorização de produtos (Doces, Salgados, Bebidas, Combos)
- ✅ Visualização e gestão de pedidos
- ✅ Sistema de clientes com analytics detalhados
- ✅ Preview da loja (como o cliente vê)
- ✅ Personalização completa da página de vendas:
  - Cores personalizadas
  - Extração automática de cores da logo
  - Temas e estilos customizáveis
- ✅ Integração com SheetDB para backup de dados

### Para Clientes:
- ✅ Login e cadastro com código da loja
- ✅ Visualização do cardápio online
- ✅ Carrinho de compras intuitivo
- ✅ Sistema de checkout com endereço
- ✅ Integração com ViaCEP para busca automática de endereço
- ✅ Envio automático de pedidos via WhatsApp

## 🛠️ Tecnologias

- **React 19** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **LocalStorage** - Banco de dados local
- **SheetDB** - Sincronização com Google Sheets

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/foodzap-mvp.git
cd foodzap-mvp
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

## 🔧 Configuração

### Dados Iniciais

O sistema vem com dados de exemplo pré-configurados:

**Login de Lojista:**
- Email: `joao@exemplo.com`
- Senha: `123456`

**Código da Loja de Exemplo:**
- Código: `FOOD01`

### Integração SheetDB

Para usar a integração com SheetDB, configure a API URL no arquivo `db.ts`:

```typescript
const SHEETDB_API = 'https://sheetdb.io/api/v1/seu-id-aqui';
```

## 📱 Como Usar

### Cadastro de Lojista

1. Acesse `/register`
2. Preencha os dados:
   - Nome Completo
   - E-mail
   - Senha
   - Nome da Loja
   - WhatsApp (com DDD)
   - Especialidade
3. O sistema gera automaticamente um código único para sua loja

### Visualização da Loja

A loja pública está disponível em:
```
/loja/:code
```
Onde `:code` é o código único da loja.

### Sistema de Pedidos

1. Cliente acessa a loja pública
2. Adiciona produtos ao carrinho
3. Seleciona tipo de entrega (Delivery ou Retirada)
4. Preenche dados de endereço (com busca automática por CEP)
5. Finaliza pedido que é enviado automaticamente via WhatsApp

## 📊 Estrutura do Projeto

```
foodzap-mvp/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── views/           # Páginas principais
│   ├── types.ts         # Definições de tipos TypeScript
│   ├── db.ts           # Gerenciamento de dados
│   ├── App.tsx         # Componente principal
│   └── index.tsx       # Ponto de entrada
├── public/             # Arquivos estáticos
└── package.json        # Dependências e scripts
```

## 🎨 Personalização

### Cores Automáticas da Logo

O sistema extrai automaticamente cores dominantes da logo da loja e aplica na página pública:
- Cor primária (botões principais)
- Cor secundária (destaques)
- Cor de fundo

### Opções de Personalização

- Cores customizáveis (primária, secundária, fundo, texto)
- Estilos de botões (arredondado, quadrado, pílula)
- Estilos de cards (flat, elevado, com borda)
- Tamanhos de fonte
- Temas (claro, escuro, automático)

## 📝 Licença

Este projeto é um MVP (Minimum Viable Product) desenvolvido para demonstração de conceitos.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

Desenvolvido com ❤️ para facilitar vendas online de restaurantes e lanchonetes.
