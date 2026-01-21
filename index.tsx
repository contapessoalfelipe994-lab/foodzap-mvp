
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { db } from './db';

// Tratamento global de erros não capturados
window.addEventListener('error', (event) => {
  console.error('Erro global capturado:', event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejeitada não tratada:', event.reason);
  event.preventDefault();
});

// Inicializa o banco de dados local na primeira vez com proteção robusta
try {
  // Verifica se o localStorage está disponível
  if (typeof Storage === 'undefined') {
    throw new Error('localStorage não está disponível');
  }
  
  // Tenta inicializar
  db.initialize();
} catch (error) {
  console.error('❌ Erro ao inicializar banco de dados:', error);
  // Tenta limpar dados corrompidos
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('foodzap_')) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Erro ao remover ${key}:`, e);
        }
      }
    });
    // Tenta inicializar novamente
    setTimeout(() => {
      try {
        db.initialize();
      } catch (retryError) {
        console.error('❌ Erro ao reinicializar:', retryError);
      }
    }, 100);
  } catch (cleanError) {
    console.error('❌ Erro ao limpar dados corrompidos:', cleanError);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);

// Componente Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Erro capturado pelo Error Boundary:', error);
    console.error('📋 Detalhes do erro:', errorInfo);
    this.setState({ error, errorInfo });
    
    // Tenta limpar dados corrompidos automaticamente
    try {
      // Verifica se há dados corrompidos
      const stores = db.getStores();
      const users = db.getUsers();
      if (!Array.isArray(stores) || !Array.isArray(users)) {
        console.warn('⚠️ Dados corrompidos detectados, limpando...');
        localStorage.removeItem('foodzap_stores');
        localStorage.removeItem('foodzap_users');
        localStorage.removeItem('foodzap_products');
        localStorage.removeItem('foodzap_orders');
        localStorage.removeItem('foodzap_customers');
        localStorage.removeItem('foodzap_current_user');
        localStorage.removeItem('foodzap_initialized');
      }
    } catch (e) {
      console.error('Erro ao verificar dados:', e);
      // Se houver erro ao verificar, limpa tudo por segurança
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('foodzap_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (cleanError) {
        console.error('Erro ao limpar localStorage:', cleanError);
      }
    }
  }

  handleReset = () => {
    try {
      // Limpa TODOS os dados do localStorage
      console.log('🧹 Limpando todos os dados...');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('foodzap_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpa o estado do erro
      this.setState({ hasError: false, error: null, errorInfo: null });
      
      // Força recarregamento completo da página
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname;
      }, 100);
    } catch (error) {
      console.error('Erro ao resetar:', error);
      window.location.reload();
    }
  };

  handleClearAll = () => {
    try {
      // Limpa TUDO do localStorage
      console.log('🧹 Limpando TODO o localStorage...');
      localStorage.clear();
      
      // Recarrega a página
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname;
      }, 100);
    } catch (error) {
      console.error('Erro ao limpar tudo:', error);
      window.location.reload();
    }
  };

  handleReload = () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error('Erro ao recarregar:', error);
      // Fallback: tenta recarregar de outra forma
      window.location.href = window.location.href;
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem'
            }}>
              ⚠️
            </div>
            
            <h1 style={{ 
              color: '#ef4444', 
              marginBottom: '1rem',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              Ops! Algo deu errado
            </h1>
            
            <p style={{ 
              color: '#64748b', 
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>

            {this.state.error && (
              <details style={{
                marginBottom: '2rem',
                textAlign: 'left',
                backgroundColor: '#f1f5f9',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#475569'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Detalhes do erro (clique para expandir)
                </summary>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                width: '100%'
              }}>
                <button
                  onClick={this.handleReload}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s',
                    minWidth: '150px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
                >
                  🔄 Recarregar Página
                </button>
                
                <button
                  onClick={this.handleReset}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s',
                    minWidth: '150px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  🔁 Resetar Dados
                </button>
              </div>
              
              <button
                onClick={this.handleClearAll}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s',
                  minWidth: '150px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                🗑️ Limpar Tudo e Recarregar
              </button>
            </div>

            <p style={{
              marginTop: '2rem',
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Se o problema persistir, limpe o cache do navegador ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
