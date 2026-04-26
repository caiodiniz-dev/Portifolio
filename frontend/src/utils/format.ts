export function currency(v: number, curr: string = 'BRL') {
  const currencyMap: Record<string, string> = {
    'BRL': 'BRL',
    'USD': 'USD',
    'EUR': 'EUR',
    'GBP': 'GBP',
  };
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyMap[curr] || 'BRL' }).format(v || 0);
}

export function dateBR(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch { return iso; }
}

export function dateISOForInput(iso?: string) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return new Date(iso).toISOString().slice(0, 10);
}

export const CATEGORIES = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer',
  'Educação', 'Salário', 'Freelance', 'Investimento', 'Outros',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#F97316', 'Moradia': '#3B82F6', 'Transporte': '#8B5CF6',
  'Saúde': '#EF4444', 'Lazer': '#EC4899', 'Educação': '#06B6D4',
  'Salário': '#22C55E', 'Freelance': '#10B981', 'Investimento': '#EAB308',
  'Outros': '#64748B',
};
