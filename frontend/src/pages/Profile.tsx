import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Lock, Save, Loader2, Shield, Calendar, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { dateBR } from '../utils/format';

const nameSchema = yup.object({ name: yup.string().min(2).required() });
const pwSchema = yup.object({
  currentPassword: yup.string().required('Informe a senha atual'),
  newPassword: yup.string().min(6, 'Mínimo 6 caracteres').required(),
});

export default function Profile() {
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesSaving, setCategoriesSaving] = useState(false);

  const nameForm = useForm<{ name: string }>({
    resolver: yupResolver(nameSchema) as any,
    defaultValues: { name: user?.name || '' },
  });
  const pwForm = useForm<{ currentPassword: string; newPassword: string }>({
    resolver: yupResolver(pwSchema) as any,
  });

  if (!user) return null;

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const onSaveName = async (data: { name: string }) => {
    try {
      await api.put('/api/profile', { name: data.name });
      toast.success('Nome atualizado! Recarregando...');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const onChangePw = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      await api.put('/api/profile', data);
      toast.success('Senha alterada!');
      pwForm.reset();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 5MB)');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem válida');
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const fetchCategories = async () => {
    if (!user || user.plan === 'FREE') return;
    setCategoriesLoading(true);
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.map((category: any) => category.name));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const addCategory = () => {
    const next = categoryInput.trim();
    if (!next || categories.includes(next)) return;
    setCategories((current) => [...current, next]);
    setCategoryInput('');
  };

  const removeCategory = (index: number) => {
    setCategories((current) => current.filter((_, i) => i !== index));
  };

  const onSaveCategories = async () => {
    setCategoriesSaving(true);
    try {
      await api.put('/api/categories', { categories });
      toast.success('Categorias atualizadas!');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setCategoriesSaving(false);
    }
  };

  const onUploadPhoto = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await api.put('/api/profile', { photo: base64 });
        toast.success('Foto atualizada! Recarregando...');
        setTimeout(() => window.location.reload(), 800);
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="profile-page">
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Perfil</h1>
        <p className="text-slate-500 mt-1">Gerencie sua conta</p>
      </div>

      {/* Identity card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          {user.photo ? (
            <img src={user.photo} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-glow" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-display font-extrabold text-3xl shadow-glow">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-2xl">{user.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {user.role}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> desde {dateBR(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card">
          <h3 className="font-display font-bold text-lg flex items-center gap-2"><UserIcon className="w-5 h-5 text-brand-blue" /> Informações pessoais</h3>
          <form onSubmit={nameForm.handleSubmit(onSaveName)} className="mt-4 space-y-3" data-testid="name-form">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input {...nameForm.register('name')} className="input mt-1" data-testid="profile-name" />
              {nameForm.formState.errors.name && <p className="text-xs text-red-500 mt-1">{nameForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <input value={user.email} disabled className="input mt-1 bg-slate-50 dark:bg-slate-800 cursor-not-allowed" />
              <p className="text-xs text-slate-500 mt-1">O e-mail não pode ser alterado.</p>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={nameForm.formState.isSubmitting} data-testid="save-name">
              {nameForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar nome</>}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card">
          <h3 className="font-display font-bold text-lg flex items-center gap-2"><Camera className="w-5 h-5 text-green-500" /> Foto de perfil</h3>
          <div className="mt-4 space-y-4">
            {/* Preview */}
            {(preview || user.photo) && (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <img src={preview || user.photo} alt="Preview" className="w-full h-full object-cover" />
                {preview && selectedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* File input */}
            <div>
              <label className="text-sm font-medium">Selecionar foto</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="input mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF (máx 5MB)</p>
            </div>

            {/* Upload button */}
            <button
              type="button"
              onClick={onUploadPhoto}
              className="btn-primary w-full"
              disabled={!selectedFile || uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Enviar foto</>}
            </button>
          </div>
        </motion.div>
      </div>

      {user.plan !== 'FREE' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="card">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-lg">Categorias</h3>
                <p className="text-sm text-slate-500">Ajuste as categorias que serão usadas nas transações.</p>
              </div>
              <button
                type="button"
                onClick={onSaveCategories}
                className="btn-primary"
                disabled={categoriesSaving || categoriesLoading}
                data-testid="save-categories"
              >
                {categoriesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar categorias'}
              </button>
            </div>

            <div className="grid gap-3">
              <div className="flex gap-2">
                <input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  className="input flex-1"
                  placeholder="Nova categoria"
                  data-testid="new-category"
                />
                <button type="button" onClick={addCategory} className="btn-outline" data-testid="add-category">Adicionar</button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categoriesLoading ? (
                  <div className="text-sm text-slate-500">Carregando categorias...</div>
                ) : categories.length === 0 ? (
                  <div className="text-sm text-slate-500">Nenhuma categoria cadastrada ainda.</div>
                ) : (
                  categories.map((category, index) => (
                    <button
                      key={`${category}-${index}`}
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="chip bg-slate-100 text-slate-700 hover:bg-slate-200"
                      data-testid={`category-chip-${index}`}
                    >
                      {category} <X className="w-3 h-3 inline-block ml-1" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h3 className="font-display font-bold text-lg flex items-center gap-2"><Lock className="w-5 h-5 text-brand-purple" /> Alterar senha</h3>
        <form onSubmit={pwForm.handleSubmit(onChangePw)} className="mt-4 space-y-3" data-testid="password-form">
          <div>
            <label className="text-sm font-medium">Senha atual</label>
            <input type="password" {...pwForm.register('currentPassword')} className="input mt-1" data-testid="current-password" />
            {pwForm.formState.errors.currentPassword && <p className="text-xs text-red-500 mt-1">{pwForm.formState.errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Nova senha</label>
            <input type="password" {...pwForm.register('newPassword')} className="input mt-1" data-testid="new-password" />
            {pwForm.formState.errors.newPassword && <p className="text-xs text-red-500 mt-1">{pwForm.formState.errors.newPassword.message}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={pwForm.formState.isSubmitting} data-testid="change-password">
            {pwForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Alterar senha</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
