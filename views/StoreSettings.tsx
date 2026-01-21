
import React, { useState, useContext, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../db';
import { Store, StoreCustomization } from '../types';
import { Save, Info, Camera, Upload, Image as ImageIcon, Palette, Sparkles, Wand2, Loader, Clock } from 'lucide-react';

const StoreSettings: React.FC = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return <Layout title="Erro">Erro ao carregar dados</Layout>;
  }
  const { user, store, refreshStore } = context;
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const colorExtractInputRef = useRef<HTMLInputElement>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  // Tenta recarregar a loja se não estiver disponível - VERSÃO SIMPLIFICADA E AGRESSIVA
  useEffect(() => {
    const tryLoadStore = async () => {
      try {
        if (!store && user?.id) {
          console.log('🔧 CORREÇÃO AUTOMÁTICA - User ID:', user.id, 'Store ID:', user.storeId);
          
          const stores = db.getStores();
          console.log('📦 Total de lojas:', stores.length);
          
          let foundStore: Store | null = null;
          
          // ESTRATÉGIA 1: Busca por ownerId
          foundStore = stores.find(s => s.ownerId === user.id) || null;
          
          // ESTRATÉGIA 2: Busca por storeId
          if (!foundStore && user.storeId) {
            foundStore = stores.find(s => s.id === user.storeId) || null;
            if (foundStore && foundStore.ownerId !== user.id) {
              // CORRIGE ownerId
              const updated = stores.map(s => 
                s.id === user.storeId ? { ...s, ownerId: user.id } : s
              );
              db.saveStores(updated);
              foundStore = { ...foundStore, ownerId: user.id };
            }
          }
          
          // ESTRATÉGIA 3: Se há apenas 1 loja, usa e corrige
          if (!foundStore && stores.length === 1) {
            foundStore = stores[0];
            const updated = stores.map(s => ({ ...s, ownerId: user.id }));
            db.saveStores(updated);
            const users = db.getUsers();
            const updatedUsers = users.map(u => 
              u.id === user.id ? { ...u, storeId: foundStore!.id } : u
            );
            db.saveUsers(updatedUsers);
            foundStore = { ...foundStore, ownerId: user.id };
          }
          
          // ESTRATÉGIA 4: Se há múltiplas e usuário tem storeId, corrige
          if (!foundStore && stores.length > 1 && user.storeId) {
            const storeById = stores.find(s => s.id === user.storeId);
            if (storeById) {
              const updated = stores.map(s => 
                s.id === user.storeId ? { ...s, ownerId: user.id } : s
              );
              db.saveStores(updated);
              foundStore = { ...storeById, ownerId: user.id };
            }
          }
          
          // ESTRATÉGIA 5: Usa primeira loja disponível
          if (!foundStore && stores.length > 0) {
            foundStore = stores[0];
            const updated = stores.map(s => 
              s.id === foundStore!.id ? { ...s, ownerId: user.id } : s
            );
            db.saveStores(updated);
            const users = db.getUsers();
            const updatedUsers = users.map(u => 
              u.id === user.id ? { ...u, storeId: foundStore!.id } : u
            );
            db.saveUsers(updatedUsers);
            foundStore = { ...foundStore, ownerId: user.id };
          }
          
          if (foundStore) {
            console.log('✅ Loja encontrada/corrigida:', foundStore.id);
            refreshStore();
            await new Promise(resolve => setTimeout(resolve, 500));
            refreshStore();
          } else {
            console.error('❌ Nenhuma loja encontrada');
            setIsLoading(false);
          }
        } else if (store && store.id) {
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Erro:', error);
        setIsLoading(false);
      }
    };

    tryLoadStore();
  }, [store, user?.id, refreshStore]);

  useEffect(() => {
    try {
      if (store && store.id) {
        setIsLoading(false);
        // Garante que todos os campos necessários estão presentes
        const completeStoreData: Partial<Store> = {
          ...store,
          name: store.name || '',
          whatsapp: store.whatsapp || '',
          description: store.description || '',
          address: store.address || '',
          logo: store.logo || 'https://picsum.photos/200',
          banner: store.banner || 'https://picsum.photos/800/200',
          deliveryType: store.deliveryType || 'both',
          deliveryFee: store.deliveryFee ?? 0,
          isDeliveryFree: store.isDeliveryFree ?? false,
          appDiscountEnabled: store.appDiscountEnabled ?? false,
          appDiscountValue: store.appDiscountValue ?? 0,
          hours: store.hours || {
            open: '08:00',
            close: '22:00',
            isOpenAlways: false
          },
          customization: store.customization || {
            primaryColor: '#f97316',
            secondaryColor: '#fb923c',
            backgroundColor: '#fdfcfb',
            textColor: '#1e293b',
            accentColor: '#22c55e',
            buttonStyle: 'rounded',
            cardStyle: 'elevated',
            fontSize: 'medium',
            theme: 'light'
          }
        };
        setFormData(completeStoreData);
      } else {
        setFormData({});
      }
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
      setFormData({});
      setIsLoading(false);
    }
  }, [store?.id]); // Usa store.id como dependência para evitar loops

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
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
            setFormData(prev => ({ ...prev, [field]: reader.result as string }));
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

  // Função para extrair cores dominantes de uma imagem
  const extractColorsFromImage = (imageSrc: string): Promise<{ primary: string; secondary: string; background: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas não disponível'));
            return;
          }

          // Redimensiona a imagem para processamento mais rápido
          const maxSize = 200;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Extrai dados dos pixels
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Conta frequência de cores (agrupando cores similares)
          const colorMap = new Map<string, number>();
          const colorGroups: { r: number; g: number; b: number; count: number }[] = [];

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Ignora pixels transparentes e muito escuros/claros
            if (a < 128) continue;
            
            const brightness = (r + g + b) / 3;
            if (brightness < 30 || brightness > 240) continue; // Ignora preto puro e branco puro

            // Agrupa cores similares (tolerância de 30)
            let found = false;
            for (const group of colorGroups) {
              const distance = Math.sqrt(
                Math.pow(r - group.r, 2) + 
                Math.pow(g - group.g, 2) + 
                Math.pow(b - group.b, 2)
              );
              if (distance < 30) {
                group.r = Math.round((group.r * group.count + r) / (group.count + 1));
                group.g = Math.round((group.g * group.count + g) / (group.count + 1));
                group.b = Math.round((group.b * group.count + b) / (group.count + 1));
                group.count++;
                found = true;
                break;
              }
            }

            if (!found) {
              colorGroups.push({ r, g, b, count: 1 });
            }
          }

          // Ordena por frequência e seleciona as duas cores mais dominantes
          colorGroups.sort((a, b) => b.count - a.count);

          // Função para converter RGB para HEX
          const rgbToHex = (r: number, g: number, b: number) => {
            return '#' + [r, g, b].map(x => {
              const hex = x.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            }).join('');
          };

          // Seleciona cores vibrantes (não muito escuras ou claras)
          const vibrantColors = colorGroups.filter(c => {
            const brightness = (c.r + c.g + c.b) / 3;
            return brightness > 50 && brightness < 220;
          });

          // Procura cores claras para fundo
          const lightColors = colorGroups.filter(c => {
            const brightness = (c.r + c.g + c.b) / 3;
            return brightness > 200 && brightness < 255;
          });

          let primary = '#f97316';
          let secondary = '#fb923c';
          let background = '#fdfcfb';

          if (vibrantColors.length >= 2) {
            primary = rgbToHex(vibrantColors[0].r, vibrantColors[0].g, vibrantColors[0].b);
            secondary = rgbToHex(vibrantColors[1].r, vibrantColors[1].g, vibrantColors[1].b);
          } else if (vibrantColors.length === 1) {
            primary = rgbToHex(vibrantColors[0].r, vibrantColors[0].g, vibrantColors[0].b);
            // Cria uma cor secundária mais clara
            const r = Math.min(255, vibrantColors[0].r + 40);
            const g = Math.min(255, vibrantColors[0].g + 40);
            const b = Math.min(255, vibrantColors[0].b + 40);
            secondary = rgbToHex(r, g, b);
          } else if (colorGroups.length > 0) {
            // Se não encontrou cores vibrantes, usa as mais frequentes
            primary = rgbToHex(colorGroups[0].r, colorGroups[0].g, colorGroups[0].b);
            if (colorGroups.length > 1) {
              secondary = rgbToHex(colorGroups[1].r, colorGroups[1].g, colorGroups[1].b);
            }
          }

          // Define cor de fundo baseada nas cores extraídas
          if (lightColors.length > 0) {
            // Usa uma cor clara encontrada na logo
            const lightColor = lightColors[0];
            background = rgbToHex(lightColor.r, lightColor.g, lightColor.b);
          } else if (vibrantColors.length > 0) {
            // Cria uma cor de fundo clara baseada na cor primária
            const primaryColor = vibrantColors[0];
            const r = Math.min(255, Math.round(primaryColor.r * 0.15 + 245));
            const g = Math.min(255, Math.round(primaryColor.g * 0.15 + 245));
            const b = Math.min(255, Math.round(primaryColor.b * 0.15 + 245));
            background = rgbToHex(r, g, b);
          } else if (colorGroups.length > 0) {
            // Cria uma cor de fundo clara baseada na cor mais frequente
            const baseColor = colorGroups[0];
            const r = Math.min(255, Math.round(baseColor.r * 0.1 + 250));
            const g = Math.min(255, Math.round(baseColor.g * 0.1 + 250));
            const b = Math.min(255, Math.round(baseColor.b * 0.1 + 250));
            background = rgbToHex(r, g, b);
          }

          resolve({ primary, secondary, background });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = imageSrc;
    });
  };

  // Função para processar logo e extrair cores
  const handleExtractColorsFromLogo = async () => {
    if (!formData.logo) {
      alert('Por favor, faça upload de uma logo primeiro na seção "Identidade Visual"');
      return;
    }

    setIsExtractingColors(true);
    try {
      const colors = await extractColorsFromImage(formData.logo);
      
      setFormData(prev => ({
        ...prev,
        customization: {
          ...(prev.customization || {} as StoreCustomization),
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          backgroundColor: colors.background
        } as StoreCustomization
      }));

      alert('Cores extraídas com sucesso! Cores primária, secundária e de fundo foram aplicadas automaticamente.');
    } catch (error) {
      console.error('Erro ao extrair cores:', error);
      alert('Erro ao extrair cores da logo. Tente novamente.');
    } finally {
      setIsExtractingColors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) {
      console.log('Já está salvando, ignorando clique duplo');
      return; // Previne múltiplos cliques
    }
    
    console.log('Iniciando salvamento das configurações...');
    setIsSaving(true);
    
    try {
      if (!store || !store.id) {
        console.error('Erro: Loja não encontrada', { store });
        alert('Erro: Loja não encontrada. Por favor, recarregue a página.');
        setIsSaving(false);
        return;
      }

      // Valida dados obrigatórios
      const name = formData.name?.trim() || store.name?.trim();
      if (!name) {
        console.error('Erro: Nome da loja vazio');
        alert('Por favor, preencha o nome da loja.');
        setIsSaving(false);
        return;
      }

      const whatsapp = formData.whatsapp?.trim() || store.whatsapp?.trim();
      if (!whatsapp) {
        console.error('Erro: WhatsApp vazio');
        alert('Por favor, preencha o WhatsApp.');
        setIsSaving(false);
        return;
      }

      console.log('Buscando todas as lojas...');
      const allStores = db.getStores();
      if (!Array.isArray(allStores)) {
        console.error('Erro: allStores não é um array', { allStores });
        alert('Erro ao carregar lojas. Por favor, recarregue a página.');
        setIsSaving(false);
        return;
      }

      console.log(`Encontradas ${allStores.length} lojas. Atualizando loja ${store.id}...`);

      // Garante que todos os campos necessários estão presentes
      const updatedStore: Store = {
        ...store,
        name: name,
        description: formData.description?.trim() || store.description || '',
        whatsapp: whatsapp,
        address: formData.address?.trim() || store.address || '',
        logo: formData.logo || store.logo || 'https://picsum.photos/200',
        banner: formData.banner || store.banner || 'https://picsum.photos/800/200',
        deliveryType: formData.deliveryType || store.deliveryType || 'both',
        deliveryFee: formData.deliveryFee !== undefined ? Number(formData.deliveryFee) : (store.deliveryFee ?? 0),
        isDeliveryFree: formData.isDeliveryFree !== undefined ? Boolean(formData.isDeliveryFree) : (store.isDeliveryFree ?? false),
        appDiscountEnabled: formData.appDiscountEnabled !== undefined ? Boolean(formData.appDiscountEnabled) : (store.appDiscountEnabled ?? false),
        appDiscountValue: formData.appDiscountValue !== undefined ? Number(formData.appDiscountValue) : (store.appDiscountValue ?? 0),
        id: store.id,
        ownerId: store.ownerId,
        code: store.code ? store.code.trim().toUpperCase() : store.code, // Garante que o código está em maiúsculas
        slug: store.slug || (name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || 'loja'),
        hours: formData.hours && formData.hours.open && formData.hours.close ? formData.hours : (store.hours || {
          open: '08:00',
          close: '22:00',
          isOpenAlways: false
        }),
        customization: formData.customization && formData.customization.primaryColor ? formData.customization : (store.customization || {
          primaryColor: '#f97316',
          secondaryColor: '#fb923c',
          backgroundColor: '#fdfcfb',
          textColor: '#1e293b',
          accentColor: '#22c55e',
          buttonStyle: 'rounded',
          cardStyle: 'elevated',
          fontSize: 'medium',
          theme: 'light'
        })
      } as Store;

      console.log('Loja atualizada criada:', { 
        id: updatedStore.id, 
        name: updatedStore.name, 
        whatsapp: updatedStore.whatsapp 
      });

      const updated = allStores.map(s => {
        if (s.id === store.id) {
          return updatedStore;
        }
        return s;
      });
      
      // Valida se a atualização foi bem-sucedida
      const savedStore = updated.find(s => s.id === store.id);
      if (!savedStore) {
        throw new Error('Erro ao salvar: loja não encontrada após atualização');
      }
      
      console.log('💾 Salvando lojas no banco de dados...');
      db.saveStores(updated);
      console.log('✅ Lojas salvas com sucesso no localStorage!');
      
      // Verifica se realmente salvou
      const verifyStores = db.getStores();
      const verifiedStore = verifyStores.find(s => s.id === store.id);
      if (!verifiedStore) {
        throw new Error('Erro: Loja não foi encontrada após salvar');
      }
      
      // Compara se os dados foram salvos corretamente
      if (verifiedStore.name !== updatedStore.name || 
          verifiedStore.whatsapp !== updatedStore.whatsapp) {
        console.warn('⚠️ Dados salvos podem estar diferentes do esperado');
      }
      
      console.log('🔄 Atualizando contexto da loja...');
      // Atualiza o contexto múltiplas vezes para garantir
      refreshStore();
      
      // Aguarda e atualiza novamente
      await new Promise(resolve => setTimeout(resolve, 300));
      refreshStore();
      
      // Aguarda mais um pouco para garantir que o contexto foi atualizado
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Força atualização do formData com os dados salvos
      setFormData(savedStore);
      
      // Dispara um evento customizado para notificar outras abas/janelas
      window.dispatchEvent(new Event('store-updated'));
      
      // Mostra mensagem de sucesso
      alert('✅ Configurações salvas com sucesso! A visualização do cliente será atualizada automaticamente.');
      console.log('✅ Configurações salvas e formulário atualizado!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao salvar configurações: ${errorMessage}. Por favor, tente novamente.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Se ainda está carregando, mostra loading
  if (isLoading) {
    return (
      <Layout title="Minha Loja">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-center gap-3">
            <Loader className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-blue-800 font-medium">Carregando dados da loja...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Se não tem loja após carregar, mostra erro com opção de recarregar
  if (!store || !store.id) {
    // Tenta buscar a loja diretamente uma última vez
    const attemptDirectLoad = () => {
      if (!user?.id) {
        return null;
      }
      
      try {
        const stores = db.getStores();
        console.log('🔍 attemptDirectLoad - buscando loja...');
        console.log('👤 User ID:', user.id);
        console.log('🏪 User storeId:', user.storeId);
        console.log('📦 Total de lojas:', stores.length);
        
        // Tenta por ownerId
        let foundStore = stores.find(s => s.ownerId === user.id);
        console.log('🔍 Busca por ownerId:', foundStore ? '✅ Encontrada' : '❌ Não encontrada');
        
        // Se não encontrou, tenta por storeId
        if (!foundStore && user.storeId) {
          console.log('🔍 Tentando buscar pelo storeId:', user.storeId);
          foundStore = stores.find(s => s.id === user.storeId);
          console.log('🔍 Busca por storeId:', foundStore ? '✅ Encontrada' : '❌ Não encontrada');
          
          // Se encontrou mas o ownerId não corresponde, corrige
          if (foundStore && foundStore.ownerId !== user.id) {
            console.log('⚠️ Loja encontrada mas ownerId não corresponde. Corrigindo...');
            const updatedStores = stores.map(s => {
              if (s.id === user.storeId) {
                return { ...s, ownerId: user.id };
              }
              return s;
            });
            db.saveStores(updatedStores);
            foundStore = { ...foundStore, ownerId: user.id };
            console.log('✅ Relacionamento corrigido');
          }
        }
        
        // Se há múltiplas lojas e o usuário tem storeId, tenta usar a loja com esse ID
        if (!foundStore && stores.length > 1 && user.storeId) {
          console.log('🔍 Múltiplas lojas, tentando usar a loja com o storeId...');
          const storeById = stores.find(s => s.id === user.storeId);
          if (storeById) {
            console.log('✅ Loja encontrada pelo storeId em múltiplas lojas');
            const updatedStores = stores.map(s => {
              if (s.id === user.storeId) {
                return { ...s, ownerId: user.id };
              }
              return s;
            });
            db.saveStores(updatedStores);
            foundStore = { ...storeById, ownerId: user.id };
            console.log('✅ Relacionamento corrigido');
          }
        }
        
        // Se há apenas 1 loja, usa essa loja
        if (!foundStore && stores.length === 1) {
          console.log('🔍 Apenas 1 loja, usando essa loja...');
          foundStore = stores[0];
          const updatedStores = stores.map(s => ({
            ...s,
            ownerId: user.id
          }));
          db.saveStores(updatedStores);
          const users = db.getUsers();
          const updatedUsers = users.map(u => {
            if (u.id === user.id) {
              return { ...u, storeId: foundStore!.id };
            }
            return u;
          });
          db.saveUsers(updatedUsers);
          foundStore = { ...foundStore, ownerId: user.id };
          console.log('✅ Relacionamento corrigido');
        }
        
        return foundStore || null;
      } catch (error) {
        console.error('Erro ao buscar loja diretamente:', error);
        return null;
      }
    };

    const directStore = attemptDirectLoad();

    return (
      <Layout title="Minha Loja">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-red-800 font-bold text-lg mb-2">Erro ao carregar loja</h3>
              <p className="text-red-700 mb-2">
                Não foi possível carregar os dados da sua loja.
              </p>
              {user?.id && (
                <div className="text-sm text-red-600 bg-red-100 p-3 rounded mt-2">
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Store ID (do usuário):</strong> {user.storeId || 'Não definido'}</p>
                  <p><strong>Total de lojas no banco:</strong> {db.getStores().length}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setIsLoading(true);
                  if (user?.id) {
                    // Tenta corrigir o relacionamento automaticamente
                    try {
                      const stores = db.getStores();
                      const users = db.getUsers();
                      
                      console.log('🔧 Tentando corrigir relacionamento...');
                      console.log('👤 User ID:', user.id);
                      console.log('🏪 User storeId:', user.storeId);
                      console.log('📦 Total de lojas:', stores.length);
                      
                      // Se o usuário tem storeId, tenta encontrar e corrigir
                      if (user.storeId) {
                        const storeById = stores.find(s => s.id === user.storeId);
                        if (storeById) {
                          console.log('✅ Loja encontrada pelo storeId, corrigindo ownerId...');
                          const updatedStores = stores.map(s => {
                            if (s.id === user.storeId) {
                              return { ...s, ownerId: user.id };
                            }
                            return s;
                          });
                          db.saveStores(updatedStores);
                          console.log('✅ Relacionamento corrigido');
                        } else if (stores.length === 1) {
                          // Se há apenas 1 loja, usa essa loja
                          console.log('✅ Apenas 1 loja, usando essa loja...');
                          const updatedStores = stores.map(s => ({
                            ...s,
                            ownerId: user.id
                          }));
                          db.saveStores(updatedStores);
                          const updatedUsers = users.map(u => {
                            if (u.id === user.id) {
                              return { ...u, storeId: stores[0].id };
                            }
                            return u;
                          });
                          db.saveUsers(updatedUsers);
                          console.log('✅ Relacionamento corrigido');
                        }
                      } else if (stores.length === 1) {
                        // Se não tem storeId mas há apenas 1 loja, usa essa loja
                        console.log('✅ Apenas 1 loja, usando essa loja...');
                        const updatedStores = stores.map(s => ({
                          ...s,
                          ownerId: user.id
                        }));
                        db.saveStores(updatedStores);
                        const updatedUsers = users.map(u => {
                          if (u.id === user.id) {
                            return { ...u, storeId: stores[0].id };
                          }
                          return u;
                        });
                        db.saveUsers(updatedUsers);
                        console.log('✅ Relacionamento corrigido');
                      }
                    } catch (error) {
                      console.error('Erro ao corrigir relacionamento:', error);
                    }
                    
                    refreshStore();
                    setTimeout(() => {
                      const found = attemptDirectLoad();
                      if (found) {
                        // Se encontrou, força atualização do contexto
                        refreshStore();
                      }
                      setIsLoading(false);
                    }, 1500);
                  } else {
                    alert('Você precisa estar logado para acessar as configurações.');
                    setIsLoading(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
              
              {directStore && (
                <button
                  onClick={() => {
                    // Tenta usar a loja encontrada diretamente e corrige o relacionamento
                    console.log('Usando loja encontrada diretamente:', directStore.id);
                    try {
                      // Corrige o relacionamento
                      const stores = db.getStores();
                      const updatedStores = stores.map(s => {
                        if (s.id === directStore.id) {
                          return { ...s, ownerId: user?.id || s.ownerId };
                        }
                        return s;
                      });
                      db.saveStores(updatedStores);
                      
                      if (user?.id) {
                        const users = db.getUsers();
                        const updatedUsers = users.map(u => {
                          if (u.id === user.id) {
                            return { ...u, storeId: directStore.id };
                          }
                          return u;
                        });
                        db.saveUsers(updatedUsers);
                      }
                      
                      console.log('✅ Relacionamento corrigido');
                    } catch (error) {
                      console.error('Erro ao corrigir relacionamento:', error);
                    }
                    
                    refreshStore();
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Corrigir e Usar Loja
                </button>
              )}
            </div>
            
            <div className="text-xs text-red-600 mt-4 p-3 bg-red-100 rounded">
              <p><strong>Dica:</strong> Abra o console do navegador (F12) para ver mais detalhes sobre o erro.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Minha Loja">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8 max-w-4xl pb-12">
        {/* Visual Identity */}
        <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
            <ImageIcon size={18} className="sm:w-5 sm:h-5 text-orange-500" />
            Identidade Visual
          </h2>
          
          <div className="space-y-6 sm:space-y-8">
            {/* Banner Upload */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 sm:mb-3">Banner da Loja (Horizontal)</label>
              <div 
                onClick={() => bannerInputRef.current?.click()}
                className="w-full h-32 sm:h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all overflow-hidden relative group min-h-[120px]"
              >
                {formData.banner ? (
                  <>
                    <img src={formData.banner} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">
                      Alterar Banner
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-300 mb-2" />
                    <span className="text-sm font-medium text-slate-400">Enviar Banner</span>
                  </>
                )}
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
            </div>

            {/* Logo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all overflow-hidden relative group shrink-0"
              >
                {formData.logo ? (
                  <>
                    <img src={formData.logo} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                      Trocar Logo
                    </div>
                  </>
                ) : (
                  <>
                    <Camera size={24} className="text-slate-300 mb-1" />
                    <span className="text-[10px] font-medium text-slate-400">Logo</span>
                  </>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="font-bold text-slate-700">Logo da Marca</h4>
                <p className="text-sm text-slate-400 mt-1">Recomendamos uma imagem quadrada com fundo limpo para melhor visualização no perfil.</p>
                <button 
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-3 text-orange-600 font-bold text-sm hover:underline"
                >
                  Selecionar Imagem
                </button>
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
            </div>
          </div>
        </section>

        {/* Basic Info */}
        <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Nome da Loja</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-base min-h-[48px]"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Descrição da Loja
                <span className="text-slate-300 font-normal ml-2">(O que o cliente verá)</span>
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 resize-none text-base"
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva sua loja, produtos, história... Esta descrição aparecerá na página pública da sua loja."
              />
              <p className="text-xs text-slate-400 mt-2">Esta descrição aparece na página pública da loja que seus clientes veem.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">WhatsApp (ex: 5511999998888)</label>
              <input
                type="tel"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-base min-h-[48px]"
                value={formData.whatsapp || ''}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Endereço da Loja (Para Retirada)</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-base min-h-[48px]"
                value={formData.address || ''}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Delivery & Fees */}
        <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Entrega e Frete</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Tipo de Atendimento</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.deliveryType}
                onChange={e => setFormData({...formData, deliveryType: e.target.value as any})}
              >
                <option value="delivery">Somente Entrega (Delivery)</option>
                <option value="pickup">Somente Retirada</option>
                <option value="both">Ambos (Entrega e Retirada)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Taxa de Frete Fixa (R$)</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.deliveryFee || 0}
                onChange={e => setFormData({...formData, deliveryFee: parseFloat(e.target.value)})}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="freeFee"
                className="w-5 h-5 accent-orange-500"
                checked={formData.isDeliveryFree || false}
                onChange={e => setFormData({...formData, isDeliveryFree: e.target.checked})}
              />
              <label htmlFor="freeFee" className="text-sm font-bold text-slate-700">Oferecer Frete Grátis</label>
            </div>
          </div>
        </section>

        {/* Discounts & Promos */}
        <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Promoção no App</h2>
            <div className="group relative">
              <Info size={16} className="text-slate-400 cursor-help" />
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-lg mb-2 shadow-xl z-10">
                Ofereça um incentivo para clientes que pedirem diretamente pelo seu link do FoodZap.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="discount"
                className="w-5 h-5 accent-orange-500"
                checked={formData.appDiscountEnabled || false}
                onChange={e => setFormData({...formData, appDiscountEnabled: e.target.checked})}
              />
              <label htmlFor="discount" className="text-sm font-bold text-slate-700">Ativar Desconto por Pedido via Link</label>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Porcentagem do Desconto (%)</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.appDiscountValue || 0}
                onChange={e => setFormData({...formData, appDiscountValue: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </section>

        {/* Hours */}
        <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Clock size={20} className="sm:w-6 sm:h-6 text-orange-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Horário de Funcionamento</h2>
          </div>
          
          <div className="space-y-4">
            {/* Checkbox 24 horas */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 hover:border-orange-300 transition-colors">
              <input
                type="checkbox"
                id="alwaysOpen"
                className="w-6 h-6 accent-orange-500 cursor-pointer"
                checked={formData.hours?.isOpenAlways || false}
                onChange={e => setFormData({
                  ...formData, 
                  hours: { 
                    ...(formData.hours || { open: '08:00', close: '22:00', isOpenAlways: false }), 
                    isOpenAlways: e.target.checked 
                  }
                })}
              />
              <label htmlFor="alwaysOpen" className="text-sm sm:text-base font-bold text-slate-700 cursor-pointer flex-1">
                Aberta 24 Horas (sempre aberta)
              </label>
            </div>

            {/* Horários de abertura e fechamento */}
            {!formData.hours?.isOpenAlways && (
              <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border-2 border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Horário de Abertura */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-orange-500">⏰</span>
                      Horário de Abertura
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3.5 sm:py-4 bg-white border-2 border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 text-lg min-h-[56px] transition-all"
                      value={formData.hours?.open || '08:00'}
                      onChange={e => setFormData({
                        ...formData, 
                        hours: { 
                          ...(formData.hours || { open: '08:00', close: '22:00', isOpenAlways: false }), 
                          open: e.target.value 
                        }
                      })}
                      step="300"
                    />
                    <p className="text-xs text-slate-500 font-medium">
                      Atual: <span className="font-bold text-slate-700">{formData.hours?.open || '08:00'}</span>
                    </p>
                  </div>

                  {/* Horário de Fechamento */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-orange-500">🚪</span>
                      Horário de Fechamento
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3.5 sm:py-4 bg-white border-2 border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700 text-lg min-h-[56px] transition-all"
                      value={formData.hours?.close || '22:00'}
                      onChange={e => setFormData({
                        ...formData, 
                        hours: { 
                          ...(formData.hours || { open: '08:00', close: '22:00', isOpenAlways: false }), 
                          close: e.target.value 
                        }
                      })}
                      step="300"
                    />
                    <p className="text-xs text-slate-500 font-medium">
                      Atual: <span className="font-bold text-slate-700">{formData.hours?.close || '22:00'}</span>
                    </p>
                  </div>
                </div>

                {/* Preview do horário */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">
                    📋 Resumo do Horário
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-700">
                    {formData.hours?.isOpenAlways 
                      ? '✅ Loja aberta 24 horas por dia' 
                      : `🕐 Funciona das ${formData.hours?.open || '08:00'} às ${formData.hours?.close || '22:00'}`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Personalização da Página */}
        <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Palette size={20} className="sm:w-6 sm:h-6 text-orange-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Personalização da Página</h2>
            <div className="group relative">
              <Info size={16} className="text-slate-400 cursor-help" />
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-lg mb-2 shadow-xl z-10">
                Personalize as cores e estilos da página que seus clientes veem
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Extração Automática de Cores */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-purple-100">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wand2 size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-slate-800 mb-2">Extração Automática de Cores</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Envie sua logo e o app extrairá automaticamente as cores principais para personalizar sua página.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleExtractColorsFromLogo}
                      disabled={!formData.logo || isExtractingColors}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] text-sm sm:text-base"
                    >
                      {isExtractingColors ? (
                        <>
                          <Loader size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                          <span>Extraindo cores...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          <span className="hidden sm:inline">Extrair Cores da Logo</span>
                          <span className="sm:hidden">Extrair Cores</span>
                        </>
                      )}
                    </button>
                    {!formData.logo && (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-purple-200 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all min-h-[44px] text-sm sm:text-base"
                      >
                        <span className="hidden sm:inline">Fazer Upload da Logo Primeiro</span>
                        <span className="sm:hidden">Upload da Logo</span>
                      </button>
                    )}
                  </div>
                  {formData.logo && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                      <img src={formData.logo} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700">Logo carregada</p>
                        <p className="text-xs text-slate-500">Clique em "Extrair Cores" para aplicar automaticamente</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cores */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" />
                Cores da Página
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Cor Primária</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-16 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                      value={formData.customization?.primaryColor || '#f97316'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          primaryColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.customization?.primaryColor || '#f97316'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          primaryColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cor dos botões e destaques principais</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Cor Secundária</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-16 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                      value={formData.customization?.secondaryColor || '#fb923c'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          secondaryColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.customization?.secondaryColor || '#fb923c'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          secondaryColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cor de acentos e elementos secundários</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Cor de Fundo</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-16 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                      value={formData.customization?.backgroundColor || '#fdfcfb'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          backgroundColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.customization?.backgroundColor || '#fdfcfb'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          backgroundColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cor de fundo da página</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Cor do Texto</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-16 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                      value={formData.customization?.textColor || '#1e293b'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          textColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.customization?.textColor || '#1e293b'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          textColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cor do texto principal</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Cor de Destaque</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-16 h-12 rounded-xl border-2 border-slate-200 cursor-pointer"
                      value={formData.customization?.accentColor || '#22c55e'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          accentColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.customization?.accentColor || '#22c55e'}
                      onChange={e => setFormData({
                        ...formData,
                        customization: {
                          ...(formData.customization || {} as StoreCustomization),
                          accentColor: e.target.value
                        } as StoreCustomization
                      })}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cor para promoções e badges</p>
                </div>
              </div>
            </div>

            {/* Estilos */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-4">Estilos Visuais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Estilo dos Botões</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.customization?.buttonStyle || 'rounded'}
                    onChange={e => setFormData({
                      ...formData,
                      customization: {
                        ...(formData.customization || {} as StoreCustomization),
                        buttonStyle: e.target.value as 'rounded' | 'square' | 'pill'
                      } as StoreCustomization
                    })}
                  >
                    <option value="rounded">Arredondado</option>
                    <option value="square">Quadrado</option>
                    <option value="pill">Pílula</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Estilo dos Cards</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.customization?.cardStyle || 'elevated'}
                    onChange={e => setFormData({
                      ...formData,
                      customization: {
                        ...(formData.customization || {} as StoreCustomization),
                        cardStyle: e.target.value as 'flat' | 'elevated' | 'outlined'
                      } as StoreCustomization
                    })}
                  >
                    <option value="flat">Plano</option>
                    <option value="elevated">Elevado (Sombra)</option>
                    <option value="outlined">Com Borda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Tamanho da Fonte</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.customization?.fontSize || 'medium'}
                    onChange={e => setFormData({
                      ...formData,
                      customization: {
                        ...(formData.customization || {} as StoreCustomization),
                        fontSize: e.target.value as 'small' | 'medium' | 'large'
                      } as StoreCustomization
                    })}
                  >
                    <option value="small">Pequeno</option>
                    <option value="medium">Médio</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Presets de Cores */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-4">Temas Prontos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Laranja', primary: '#f97316', secondary: '#fb923c' },
                  { name: 'Verde', primary: '#22c55e', secondary: '#4ade80' },
                  { name: 'Azul', primary: '#3b82f6', secondary: '#60a5fa' },
                  { name: 'Roxo', primary: '#a855f7', secondary: '#c084fc' },
                  { name: 'Rosa', primary: '#ec4899', secondary: '#f472b6' },
                  { name: 'Vermelho', primary: '#ef4444', secondary: '#f87171' },
                  { name: 'Amarelo', primary: '#eab308', secondary: '#facc15' },
                  { name: 'Ciano', primary: '#06b6d4', secondary: '#22d3ee' }
                ].map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      customization: {
                        ...(formData.customization || {} as StoreCustomization),
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary
                      } as StoreCustomization
                    })}
                    className="p-4 rounded-2xl border-2 border-slate-200 hover:border-orange-500 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: preset.primary }}></div>
                      <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: preset.secondary }}></div>
                    </div>
                    <div className="text-sm font-bold text-slate-700">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold px-6 sm:px-10 py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-100 transition-all active:scale-95 min-h-[52px] text-sm sm:text-base"
        >
          {isSaving ? (
            <>
              <Loader size={18} className="sm:w-5 sm:h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={18} className="sm:w-5 sm:h-5" />
              Salvar Configurações
            </>
          )}
        </button>
      </form>
    </Layout>
  );
};

export default StoreSettings;
