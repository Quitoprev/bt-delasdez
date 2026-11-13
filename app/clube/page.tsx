'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { inicioDoMes, nomeDoMes, supabase } from '@/lib/clube/supabase'
import { useSessao } from '@/lib/clube/sessao'
import { FeedCard, type ItemFeed } from '@/components/clube/FeedCard'
import { Carregando, Rotulo } from '@/components/clube/ui'

const POR_PAGINA = 15

type Placar = { pontos: number; posicao: number | null; dias_beach: number; total: number }

export default function Inicio() {
  const { sessao, perfil } = useSessao()
  const meuId = sessao!.user.id
  const [placar, setPlacar] = useState<Placar | null>(null)
  const [sequencia, setSequencia] = useState(0)
  const [feed, setFeed] = useState<ItemFeed[]>([])
  const [temMais, setTemMais] = useState(true)
  const [carregandoFeed, setCarregandoFeed] = useState(true)

  const carregarFeed = useCallback(async (de: number) => {
    setCarregandoFeed(true)
    const { data } = await supabase
      .from('feed_checkins')
      .select('*')
      .order('criado_em', { ascending: false })
      .range(de, de + POR_PAGINA - 1)
    const itens = (data as ItemFeed[]) ?? []
    setFeed((f) => (de === 0 ? itens : [...f, ...itens]))
    setTemMais(itens.length === POR_PAGINA)
    setCarregandoFeed(false)
  }, [])

  useEffect(() => {
    ;(async () => {
      const [{ data: rk }, { data: seq }] = await Promise.all([
        supabase.rpc('ranking_mes', { p_mes: inicioDoMes() }),
        supabase.rpc('minha_sequencia'),
      ])
      const lista = (rk as { atleta_id: string; pontos: number; posicao: number; dias_beach: number }[]) ?? []
      const eu = lista.find((r) => r.atleta_id === meuId)
      setPlacar({
        pontos: Number(eu?.pontos ?? 0),
        posicao: eu ? Number(eu.posicao) : null,
        dias_beach: Number(eu?.dias_beach ?? 0),
        total: lista.length,
      })
      setSequencia(Number(seq ?? 0))
    })()
    carregarFeed(0)
  }, [meuId, carregarFeed])

  const primeiroNome = perfil?.apelido || perfil?.nome?.split(' ')[0] || 'atleta'
  const faltaBonus = sequencia > 0 ? 4 - (sequencia % 4) : 4

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-[#2A2A9E] p-5 text-white shadow-xl ring-4 ring-[#F7C948]">
        <div className="flex items-baseline justify-between">
          <p className="font-extrabold">Oi, {primeiroNome}! 👋</p>
          <Rotulo>{nomeDoMes(inicioDoMes()).split(' ')[0]}</Rotulo>
        </div>

        {!placar ? (
          <div className="h-24" />
        ) : (
          <div className="mt-3 grid grid-cols-3 divide-x divide-white/25 text-center">
            <Numero valor={placar.pontos} rotulo="pontos" />
            <Numero valor={placar.posicao ? `${placar.posicao}º` : '—'} rotulo={placar.total ? `de ${placar.total}` : 'no ranking'} />
            <Numero valor={sequencia} sufixo="🔥" rotulo={sequencia === 1 ? 'semana' : 'semanas'} />
          </div>
        )}

        <p className="mt-4 rounded-xl bg-[#FBF0C9] px-3 py-2 text-center text-xs font-bold text-[#2A2A9E]">
          {sequencia === 0
            ? 'Faça um check-in de beach essa semana para começar sua sequência!'
            : `Mais ${faltaBonus} ${faltaBonus === 1 ? 'semana' : 'semanas'} seguidas com beach = +2 pts de bônus 🎁`}
        </p>
      </section>

      <Link
        href="/clube/checkin"
        className="flex items-center justify-between rounded-[28px] bg-white px-5 py-4 shadow-lg active:scale-[0.98]"
      >
        <span>
          <span className="block text-lg font-black text-[#2A2A9E]">Treinou hoje?</span>
          <span className="text-sm text-[#2A2A9E]/70">Faz o check-in e garante seus pontos</span>
        </span>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A1A] text-2xl">📸</span>
      </Link>

      <section className="space-y-4">
        <Rotulo className="pt-2 text-center">Na areia 🏝️</Rotulo>
        {feed.map((item) => (
          <FeedCard key={item.id} item={item} meuId={meuId} />
        ))}
        {carregandoFeed && <Carregando />}
        {!carregandoFeed && feed.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-white/50 p-8 text-center font-bold text-white">
            Ninguém fez check-in ainda. Seja a primeira! 👑
          </div>
        )}
        {!carregandoFeed && temMais && feed.length > 0 && (
          <button onClick={() => carregarFeed(feed.length)} className="w-full py-3 text-sm font-bold text-white underline">
            Ver mais
          </button>
        )}
      </section>
    </div>
  )
}

function Numero({ valor, rotulo, sufixo }: { valor: string | number; rotulo: string; sufixo?: string }) {
  return (
    <div className="px-1">
      <div className="text-4xl font-black leading-tight">
        {valor}
        {sufixo && <span className="text-2xl">{sufixo}</span>}
      </div>
      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#F7C948]">{rotulo}</div>
    </div>
  )
}
