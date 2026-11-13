'use client'

import { logoParceiroUrl } from '@/lib/clube/supabase'

export type Parceiro = {
  id: number
  nome: string
  categoria: string
  resumo: string
  descricao: string | null
  cupom: string | null
  como_usar: string | null
  instagram: string | null
  whatsapp: string | null
  site: string | null
  endereco: string | null
  logo_path: string | null
  cor: string | null
  destaque: boolean
  valido_ate: string | null
}

export function LogoParceiro({ p, tamanho = 56 }: { p: Pick<Parceiro, 'nome' | 'logo_path' | 'cor'>; tamanho?: number }) {
  if (p.logo_path)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoParceiroUrl(p.logo_path)}
        alt={p.nome}
        style={{ width: tamanho, height: tamanho }}
        className="shrink-0 rounded-2xl bg-white object-contain p-1 ring-1 ring-black/5"
      />
    )
  return (
    <div
      style={{ width: tamanho, height: tamanho, background: p.cor || '#2A2A9E', fontSize: tamanho * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-2xl font-black text-white"
    >
      {p.nome.trim().charAt(0).toUpperCase()}
    </div>
  )
}

export function dataCurta(iso: string) {
  return iso.split('-').reverse().join('/')
}
