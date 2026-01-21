
import React, { useState, useContext, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../App';
import { db } from '../db';
import { Store, StoreCustomization } from '../types';
import { Save, Info, Camera, Upload, Image as ImageIcon, Palette, Sparkles, Wand2, Loader } from 'lucide-react';

const StoreSettings: React.FC = () => {
  const { store, refreshStore } = useContext(AuthContext);
  const [formData, setFormData] = useState<Partial<Store>>({});
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const colorExtractInputRef = useRef<HTMLInputElement>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  useEffect(() => {
    if (store) {
      setFormData(store);
    }
  }, [store]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    const allStores = db.getStores();
    const updated = allStores.map(s => s.id === store.id ? { ...s, ...formData } as Store : s);
    db.saveStores(updated);
    refreshStore();
    alert('Configurações salvas com sucesso!');
  };

  if (!store) return null;

  return (
    <Layout title="Minha Loja">
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-12">
        {/* Visual Identity */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ImageIcon size={20} className="text-orange-500" />
            Identidade Visual
          </h2>
          
          <div className="space-y-8">
            {/* Banner Upload */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-3">Banner da Loja (Horizontal)</label>
              <div 
                onClick={() => bannerInputRef.current?.click()}
                className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all overflow-hidden relative group"
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
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all overflow-hidden relative group shrink-0"
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
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Nome da Loja</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 resize-none"
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.whatsapp || ''}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Endereço da Loja (Para Retirada)</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.address || ''}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Delivery & Fees */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Entrega e Frete</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Promoção no App</h2>
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
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Horário de Funcionamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id="alwaysOpen"
                className="w-5 h-5 accent-orange-500"
                checked={formData.hours?.isOpenAlways || false}
                onChange={e => setFormData({
                  ...formData, 
                  hours: { ...formData.hours!, isOpenAlways: e.target.checked }
                })}
              />
              <label htmlFor="alwaysOpen" className="text-sm font-bold text-slate-700">Aberta 24 Horas</label>
            </div>
            {!formData.hours?.isOpenAlways && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Abre às</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.hours?.open || '08:00'}
                    onChange={e => setFormData({
                      ...formData, 
                      hours: { ...formData.hours!, open: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Fecha às</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.hours?.close || '22:00'}
                    onChange={e => setFormData({
                      ...formData, 
                      hours: { ...formData.hours!, close: e.target.value }
                    })}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Personalização da Página */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <Palette size={24} className="text-orange-500" />
            <h2 className="text-lg font-bold text-slate-800">Personalização da Página</h2>
            <div className="group relative">
              <Info size={16} className="text-slate-400 cursor-help" />
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-lg mb-2 shadow-xl z-10">
                Personalize as cores e estilos da página que seus clientes veem
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Extração Automática de Cores */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border-2 border-purple-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wand2 size={24} className="text-white" />
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
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isExtractingColors ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Extraindo cores...
                        </>
                      ) : (
                        <>
                          <Wand2 size={18} />
                          Extrair Cores da Logo
                        </>
                      )}
                    </button>
                    {!formData.logo && (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all"
                      >
                        Fazer Upload da Logo Primeiro
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
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-orange-100 transition-all active:scale-95"
        >
          <Save size={20} />
          Salvar Configurações
        </button>
      </form>
    </Layout>
  );
};

export default StoreSettings;
