import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { User, Building, Users, Upload, Palette, ArrowRight, Loader2, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  usageType: yup.string().oneOf(['pessoal', 'empresarial', 'organizar']).required(),
  companyName: yup.string().when('usageType', {
    is: (val: string) => val !== 'pessoal',
    then: (schema) => schema.required('Nome da empresa é obrigatório'),
  }),
  companyLogo: yup.string().optional(),
  businessPurpose: yup.string().when('usageType', {
    is: (val: string) => val !== 'pessoal',
    then: (schema) => schema.required('Finalidade do negócio é obrigatória'),
  }),
  primaryColor: yup.string().optional(),
  categories: yup.array().of(yup.string().min(1).max(50)).min(1, 'Adicione pelo menos uma categoria').required(),
});

type Form = yup.InferType<typeof schema>;

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const onboardingChart = [
    { month: 'Jan', value: 380 },
    { month: 'Fev', value: 520 },
    { month: 'Mar', value: 640 },
    { month: 'Abr', value: 750 },
    { month: 'Mai', value: 880 },
    { month: 'Jun', value: 970 },
  ];

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: yupResolver(schema),
    defaultValues: { usageType: 'pessoal' },
  });

  const usageType = watch('usageType');

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      setCategories(updated);
      setValue('categories', updated);
      setNewCategory('');
    }
  };

  const removeCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
    setValue('categories', updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('logo', file);
      try {
        const { data } = await api.post('/api/upload-logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setLogoPreview(data.logoUrl);
        // Atualizar o form
        // Como é opcional, não precisa
      } catch (e) {
        toast.error('Erro ao fazer upload do logo');
      }
    }
  };

  const onSubmit = async (data: Form) => {
    try {
      const payload = {
        ...data,
        companyLogo: logoPreview,
        categories: categories,
      };

      const { data: res } = await api.post('/api/onboarding', payload);
      setUser(res.user);
      toast.success('Onboarding completado! 🎉');
      nav('/app/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Erro no onboarding');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue/5 via-white to-brand-green/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Logo className="mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-2">
              Personalize sua experiência Finix
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Configure logo, cores e categorias para o seu fluxo financeiro. Crie um workspace inteligente que reflita seu negócio.
            </p>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[1.45fr_0.95fr] items-start">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="space-y-10">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Como você vai usar o Finix?
                  </h2>
                  <div className="grid gap-4">
                    <label className="flex items-center p-4 border border-slate-200 rounded-3xl cursor-pointer hover:border-brand-blue transition-colors bg-slate-50/80">
                      <input
                        type="radio"
                        value="pessoal"
                        {...register('usageType')}
                        className="mr-3"
                      />
                      <User className="w-6 h-6 text-brand-blue mr-3" />
                      <div>
                        <div className="font-medium">Uso pessoal</div>
                        <div className="text-sm text-slate-600">Gerencie suas finanças individuais</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-slate-200 rounded-3xl cursor-pointer hover:border-brand-blue transition-colors bg-slate-50/80">
                      <input
                        type="radio"
                        value="empresarial"
                        {...register('usageType')}
                        className="mr-3"
                      />
                      <Building className="w-6 h-6 text-brand-blue mr-3" />
                      <div>
                        <div className="font-medium">Uso empresarial</div>
                        <div className="text-sm text-slate-600">Personalize o Finix para sua empresa</div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-slate-200 rounded-3xl cursor-pointer hover:border-brand-blue transition-colors bg-slate-50/80">
                      <input
                        type="radio"
                        value="organizar"
                        {...register('usageType')}
                        className="mr-3"
                      />
                      <Users className="w-6 h-6 text-brand-blue mr-3" />
                      <div>
                        <div className="font-medium">Organizar para outra pessoa</div>
                        <div className="text-sm text-slate-600">Controle financeiro para clientes ou família</div>
                      </div>
                    </label>
                  </div>
                  {errors.usageType && <p className="text-red-500 text-sm mt-1">{errors.usageType.message}</p>}
                </div>

                {/* Step 2: Detalhes da empresa (se não pessoal) */}
                {usageType !== 'pessoal' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da empresa *
                      </label>
                      <input
                        type="text"
                        {...register('companyName')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        placeholder="Digite o nome da empresa"
                      />
                      {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo da empresa (opcional)
                      </label>
                      <div className="flex flex-wrap items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <Upload className="w-4 h-4" />
                          Escolher arquivo
                        </label>
                        {logoPreview && (
                          <div className="flex items-center gap-3">
                            <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover" />
                            <button
                              type="button"
                              onClick={() => setLogoPreview(null)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remover logo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Finalidade do negócio *
                      </label>
                      <input
                        type="text"
                        {...register('businessPurpose')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                        placeholder="Ex: Loja de velas, Mercado, Restaurante..."
                      />
                      {errors.businessPurpose && <p className="text-red-500 text-sm mt-1">{errors.businessPurpose.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor principal (opcional)
                      </label>
                      <input
                        type="color"
                        {...register('primaryColor')}
                        className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Categorias personalizadas */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Categorias personalizadas
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Adicione as categorias que você quer usar para organizar suas transações
                  </p>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite uma categoria..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      className="px-4 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{cat}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-blue text-white py-4 px-6 rounded-xl font-semibold hover:bg-brand-blue/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Começar a usar <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-brand-blue font-semibold mb-2">Visão rápida</div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Seu onboarding com cores e progresso</h2>
                </div>
                <span className="chip bg-brand-green/10 text-brand-green">Fácil</span>
              </div>

              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={onboardingChart} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="onboardGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} opacity={0.4} />
                    <XAxis dataKey="month" stroke="#475569" tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
                    <Area type="monotone" dataKey="value" stroke="#2563EB" fill="url(#onboardGradient)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-brand-blue/10 bg-white/80 p-4">
                  <p className="text-sm text-slate-500">Categorias padrão para todos os planos básicos:</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                    {['Alimentação', 'Transporte', 'Saúde', 'Salário', 'Investimento', 'Pagamento'].map((cat) => (
                      <span key={cat} className="chip bg-slate-100 text-slate-700">{cat}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
                  <div className="font-semibold mb-2">Suporte direto</div>
                  <p>Fale com a gente pelo WhatsApp ou envie uma mensagem para o nosso e-mail.</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>WhatsApp: <a href="https://wa.me/5519994737425?text=Olá%20Finix" target="_blank" rel="noreferrer" className="font-semibold text-brand-blue">(19) 99473-7425</a></p>
                    <p>Email: <a href="mailto:cvdinizramos@gmail.com" className="font-semibold text-brand-blue">cvdinizramos@gmail.com</a></p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="mt-10">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Suporte Finix</div>
                  <p className="text-sm text-slate-600">Fale conosco se precisar de ajuda ao configurar sua conta.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="https://wa.me/5519994737425?text=Olá%20Finix" target="_blank" rel="noreferrer" className="btn-outline text-brand-blue">WhatsApp</a>
                  <a href="mailto:cvdinizramos@gmail.com" className="btn-outline text-brand-blue">cvdinizramos@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
