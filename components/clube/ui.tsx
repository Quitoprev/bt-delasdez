'use client'

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

// Paleta oficial BT Delas (mesma do site de inscrição)
export const COR = {
  laranja: '#FF6A1A',
  indigo: '#2A2A9E',
  amarelo: '#F7C948',
  amareloClaro: '#FBF0C9',
  pink: '#E8337A', // só a bolinha do logo; usado no coração do feed
}

/** Fundo laranja com o brilho suave atrás do logo, igual ao site */
export const FUNDO =
  'bg-[#FF6A1A] bg-[radial-gradient(circle_at_50%_8%,#ffffff22,transparent_35%),radial-gradient(circle_at_50%_100%,#c2410c55,transparent_55%)]'

export function Botao({
  variante = 'indigo',
  carregando,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'indigo' | 'laranja' | 'claro'; carregando?: boolean }) {
  const estilos = {
    indigo: 'bg-[#2A2A9E] text-white ring-[3px] ring-[#F7C948] shadow-lg active:scale-[0.98]',
    laranja: 'bg-[#FF6A1A] text-white shadow-lg active:scale-[0.98]',
    claro: 'bg-white/90 text-[#2A2A9E]',
  }[variante]
  return (
    <button
      {...props}
      disabled={props.disabled || carregando}
      className={`w-full rounded-2xl px-5 py-3.5 font-extrabold tracking-wide transition disabled:opacity-50 ${estilos} ${className}`}
    >
      {carregando ? 'Aguarde…' : children}
    </button>
  )
}

export function Campo({
  rotulo,
  dica,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; dica?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#2A2A9E]">{rotulo}</span>
      <input
        {...props}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-[#FF6A1A]"
      />
      {dica && <span className="mt-1 block text-xs text-gray-500">{dica}</span>}
    </label>
  )
}

export function Aviso({ tipo = 'erro', children }: { tipo?: 'erro' | 'ok' | 'info'; children: ReactNode }) {
  const estilos = {
    erro: 'bg-red-50 text-red-700 border-red-200',
    ok: 'bg-green-50 text-green-800 border-green-200',
    info: 'bg-[#FBF0C9] text-[#2A2A9E] border-[#F7C948]',
  }[tipo]
  return <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${estilos}`}>{children}</div>
}

/** Rótulo em caixa alta espaçada, amarelo (sobre laranja) ou índigo (sobre branco) */
export function Rotulo({ children, escuro, className = '' }: { children: ReactNode; escuro?: boolean; className?: string }) {
  return (
    <div className={`text-xs font-extrabold uppercase tracking-[0.25em] ${escuro ? 'text-[#2A2A9E]' : 'text-[#F7C948]'} ${className}`}>
      {children}
    </div>
  )
}

export function Avatar({ nome, tamanho = 40 }: { nome: string; tamanho?: number }) {
  const cores = [COR.indigo, COR.laranja, COR.pink, '#0f766e', '#7c3aed']
  const i = [...nome].reduce((s, c) => s + c.charCodeAt(0), 0) % cores.length
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-black text-white"
      style={{ width: tamanho, height: tamanho, background: cores[i], fontSize: tamanho * 0.42 }}
    >
      {nome.trim().charAt(0).toUpperCase()}
    </div>
  )
}

/** Logo oficial. Arquivo em /public/clube/logo-btdelas.png (troque pelo original em alta se tiver) */
export function Logo({ altura = 150 }: { altura?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/clube/logo-btdelas.png" alt="BT Delas" style={{ height: altura }} className="mx-auto w-auto drop-shadow-md" />
  )
}

export function Carregando({ claro }: { claro?: boolean }) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <div className={`h-10 w-10 animate-spin rounded-full border-4 border-t-transparent ${claro ? 'border-[#2A2A9E]' : 'border-white'}`} />
    </div>
  )
}
