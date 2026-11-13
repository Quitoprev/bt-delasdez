'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/clube/supabase'
import { useSessao } from '@/lib/clube/sessao'
import { Botao, Carregando, Rotulo } from '@/components/clube/ui'
import { LogoParceiro, dataCurta, type Parceiro } from '@/components/clube/parceiro'

export default function DetalheParceiro() {
  const { id } = useParams<{ id: string }>()
  const { perfil } = useSessao()
  const [p, setP] = useState<Parceiro | null | undefined>(undefined)
  const [cartao, setCartao] = useState(false)

  useEffect(() => {
    supabase
      .from('parceiros')
      .select('*')
      .eq('id', Number(id))
      .maybeSingle()
      .then(({ data }) => setP((data as Parceiro) ?? null))
  }, [id])

  async function abrirCartao() {
    setCartao(true)
    if (p) await supabase.from('resgates').insert({ parceiro_id: p.id, atleta_id: perfil?.id })
  }

  if (p === undefined) return <Carregando />
  if (p === null)
    return (
      <div className="rounded-[28px] bg-white p-8 text-center">
        <p className="font-bold text-[#2A2A9E]">Essa parceria não está mais disponível.</p>
        <Link href="/clube/parcerias" className="mt-3 block font-bold text-[#FF6A1A] underline">Ver parcerias</Link>
      </div>
    )

  const zap = p.whatsapp?.replace(/\D/g, '')
  const contatos = [
    zap && {
      icone: '💬',
      rotulo: 'WhatsApp',
      href: `https://wa.me/55${zap.replace(/^55/, '')}?text=${encodeURIComponent('Oi! Sou do Clube BT Delas e vim pelo desconto 🎾')}`,
    },
    p.instagram && { icone: '📷', rotulo: `@${p.instagram.replace('@', '')}`, href: `https://instagram.com/${p.instagram.replace('@', '')}` },
    p.site && { icone: '🌐', rotulo: 'Site', href: p.site.startsWith('http') ? p.site : `https://${p.site}` },
    p.endereco && { icone: '📍', rotulo: p.endereco, href: `https://maps.google.com/?q=${encodeURIComponent(p.endereco)}` },
  ].filter(Boolean) as { icone: string; rotulo: string; href: string }[]

  return (
    <div className="space-y-4">
      <Link href="/clube/parcerias" className="inline-block text-sm font-bold text-white">‹ Parcerias</Link>

      <section className="rounded-[28px] bg-white p-5 shadow-xl">
        <div className="flex items-center gap-4">
          <LogoParceiro p={p} tamanho={72} />
          <div className="min-w-0">
            <h1 className="text-xl font-black leading-tight text-[#2A2A9E]">{p.nome}</h1>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{p.categoria}</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#FBF0C9] p-4 text-center">
          <Rotulo escuro>Exclusivo Clube</Rotulo>
          <div className="mt-1 text-2xl font-black leading-tight text-[#FF6A1A]">{p.resumo}</div>
          {p.valido_ate && <div className="mt-1 text-xs font-bold text-[#2A2A9E]/70">Válido até {dataCurta(p.valido_ate)}</div>}
        </div>

        {p.descricao && <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{p.descricao}</p>}
        {p.como_usar && (
          <p className="mt-3 text-sm text-gray-700">
            <b className="text-[#2A2A9E]">Como usar:</b> {p.como_usar}
          </p>
        )}

        <Botao className="mt-5" onClick={abrirCartao}>🎟️ Usar meu desconto</Botao>
      </section>

      {contatos.length > 0 && (
        <section className="overflow-hidden rounded-[28px] bg-white shadow-lg">
          {contatos.map((c) => (
            <a
              key={c.href}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 font-bold text-[#2A2A9E] last:border-0"
            >
              <span className="text-xl">{c.icone}</span>
              <span className="min-w-0 flex-1 truncate">{c.rotulo}</span>
              <span className="text-[#2A2A9E]/40">›</span>
            </a>
          ))}
        </section>
      )}

      {cartao && <CartaoClube parceiro={p} nome={perfil?.nome ?? ''} onFechar={() => setCartao(false)} />}
    </div>
  )
}

/** Cartão para mostrar no balcão. O relógio ao vivo mostra que não é print antigo. */
function CartaoClube({ parceiro, nome, onFechar }: { parceiro: Parceiro; nome: string; onFechar: () => void }) {
  const [agora, setAgora] = useState(new Date())
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function copiar() {
    if (!parceiro.cupom) return
    try {
      await navigator.clipboard.writeText(parceiro.cupom)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* navegador sem permissão: a atleta copia na mão */
    }
  }

  const hora = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Maceio' })
  const data = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Maceio', day: '2-digit', month: 'long' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={onFechar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-[32px] bg-[#FF6A1A] shadow-2xl ring-4 ring-[#F7C948]"
      >
        <div className="px-6 pb-4 pt-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clube/logo-btdelas.png" alt="BT Delas" className="mx-auto h-20 w-auto" />
          <Rotulo className="mt-2">Membro do Clube</Rotulo>
          <div className="mt-2 text-2xl font-black leading-tight text-white">{nome}</div>
        </div>

        <div className="mx-4 rounded-[24px] bg-[#2A2A9E] p-5 text-center text-white">
          <div className="text-sm font-bold text-white/80">{parceiro.nome}</div>
          <div className="mt-1 text-xl font-black leading-tight text-[#F7C948]">{parceiro.resumo}</div>
          {parceiro.cupom && (
            <button
              onClick={copiar}
              className="mt-4 w-full rounded-2xl border-2 border-dashed border-[#F7C948] bg-white/10 py-3"
            >
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                {copiado ? 'Copiado! ✅' : 'Cupom · toque para copiar'}
              </div>
              <div className="text-2xl font-black tracking-widest">{parceiro.cupom}</div>
            </button>
          )}
        </div>

        <div className="px-6 py-4 text-center text-white">
          <div className="flex items-center justify-center gap-2 font-black tabular-nums">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-300" />
            <span className="text-3xl">{hora}</span>
          </div>
          <div className="text-xs font-bold text-white/85">{data} · cartão válido ao vivo</div>
          <button onClick={onFechar} className="mt-4 w-full rounded-2xl bg-white py-3 font-black text-[#2A2A9E]">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
