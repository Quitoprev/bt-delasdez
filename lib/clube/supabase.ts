import { createClient } from '@supabase/supabase-js'

// Cliente exclusivo do Clube: storageKey próprio para a sessão da atleta
// não se misturar com o login do painel da organização no mesmo navegador.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'clube-btdelas-auth',
    },
  }
)

export const BUCKET_FOTOS = 'checkins'

export function fotoUrl(path: string) {
  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(path).data.publicUrl
}

/** Data de hoje em Maceió no formato YYYY-MM-DD */
export function hojeMaceio() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Maceio' }).format(new Date())
}

/** Primeiro dia do mês (YYYY-MM-01) deslocado em N meses a partir de hoje */
export function inicioDoMes(deslocamento = 0) {
  const [a, m] = hojeMaceio().split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1 + deslocamento, 1))
  return d.toISOString().slice(0, 10)
}

export function nomeDoMes(isoData: string) {
  const [a, m] = isoData.split('-').map(Number)
  const txt = new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return txt.charAt(0).toUpperCase() + txt.slice(1)
}

export function tempoRelativo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.floor(s / 3600)} h`
  const d = Math.floor(s / 86400)
  if (d < 7) return `${d} d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/** Traduz os erros mais comuns do Supabase Auth */
export function traduzErro(msg?: string) {
  if (!msg) return 'Algo deu errado. Tente de novo.'
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada e o spam).'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Esse e-mail já tem cadastro. Tente entrar ou recuperar a senha.'
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas seguidas. Espere alguns minutos.'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'E-mail inválido.'
  if (m.includes('limite de 3 check-ins')) return 'Você já fez 3 check-ins hoje. Volte amanhã! 💪'
  if (m.includes('new password should be different')) return 'A nova senha precisa ser diferente da anterior.'
  return msg
}

export const BUCKET_PARCEIROS = 'parceiros'

export function logoParceiroUrl(path: string) {
  return supabase.storage.from(BUCKET_PARCEIROS).getPublicUrl(path).data.publicUrl
}
