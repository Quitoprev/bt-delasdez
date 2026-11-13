'use client'

import { useEffect, useState } from 'react'
import { inicioDoMes, nomeDoMes, supabase } from '@/lib/clube/supabase'
import { useSessao } from '@/lib/clube/sessao'
import { Avatar, Carregando, Rotulo } from '@/components/clube/ui'

type Linha = {
  atleta_id: string
  nome: string
  apelido: string | null
  categoria: string | null
  pontos: number
  dias_ativos: number
  dias_beach: number
  bonus: number
  posicao: number
}

const MEDALHA: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Ranking() {
  const { sessao } = useSessao()
  const meuId = sessao!.user.id
  const [desloc, setDesloc] = useState(0)
  const [categoria, setCategoria] = useState<'Todas' | 'C' | 'D'>('Todas')
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const mes = inicioDoMes(desloc)

  useEffect(() => {
    setLinhas(null)
    supabase.rpc('ranking_mes', { p_mes: mes }).then(({ data }) => setLinhas((data as Linha[]) ?? []))
  }, [mes])

  const filtradas = (linhas ?? []).filter((l) => categoria === 'Todas' || l.categoria === categoria)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[28px] bg-[#2A2A9E] p-2 text-white ring-4 ring-[#F7C948]">
        <button onClick={() => setDesloc(desloc - 1)} className="h-10 w-10 rounded-full text-xl font-black hover:bg-white/10" aria-label="Mês anterior">‹</button>
        <div className="text-center">
          <Rotulo>🏆 Ranking</Rotulo>
          <div className="font-black">{nomeDoMes(mes)}</div>
        </div>
        <button
          onClick={() => setDesloc(desloc + 1)}
          disabled={desloc >= 0}
          className="h-10 w-10 rounded-full text-xl font-black hover:bg-white/10 disabled:opacity-30"
          aria-label="Próximo mês"
        >›</button>
      </div>

      <div className="flex gap-2">
        {(['Todas', 'C', 'D'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`flex-1 rounded-full py-2 text-sm font-black ${categoria === c ? 'bg-[#2A2A9E] text-[#F7C948]' : 'bg-white/90 text-[#2A2A9E]'}`}
          >
            {c === 'Todas' ? 'Todas' : `Cat. ${c}`}
          </button>
        ))}
      </div>

      {!linhas ? (
        <Carregando />
      ) : filtradas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-white/50 p-8 text-center font-bold text-white">
          Ninguém pontuou {desloc === 0 ? 'ainda esse mês' : 'nesse mês'}.
        </div>
      ) : (
        <ol className="space-y-2">
          {filtradas.map((l, i) => {
            // com filtro de categoria, a posição exibida é dentro da categoria
            const pos = categoria === 'Todas' ? Number(l.posicao) : posicaoFiltrada(filtradas, i)
            const eu = l.atleta_id === meuId
            return (
              <li
                key={l.atleta_id}
                className={`flex items-center gap-3 rounded-2xl p-3 ${eu ? 'bg-[#FBF0C9] ring-4 ring-[#F7C948]' : 'bg-white'} shadow-sm`}
              >
                <span className="w-8 text-center text-lg font-black text-[#2A2A9E]">{MEDALHA[pos] ?? `${pos}º`}</span>
                <Avatar nome={l.nome} tamanho={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black text-[#2A2A9E]">
                    {l.apelido || l.nome} {eu && <span className="text-xs">(você)</span>}
                  </div>
                  <div className="text-xs text-gray-600">
                    {l.dias_beach} {Number(l.dias_beach) === 1 ? 'dia' : 'dias'} de beach
                    {Number(l.bonus) > 0 && ` · 🔥 +${l.bonus} bônus`}
                  </div>
                </div>
                <span className="text-xl font-black text-[#FF6A1A]">{l.pontos}</span>
              </li>
            )
          })}
        </ol>
      )}

      <details className="rounded-2xl bg-white/95 p-4 text-sm text-gray-700">
        <summary className="cursor-pointer font-black text-[#2A2A9E]">Como funciona a pontuação</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Torneio BT Delas: 5 pts (lançado pela organização)</li>
          <li>Jogo, treino ou aula de beach: 3 pts</li>
          <li>Outra atividade física: 1 pt</li>
          <li>Vale 1 check-in por dia (o de maior pontuação)</li>
          <li>A cada 4 semanas seguidas com beach: +2 pts</li>
          <li>Empate: fica na frente quem tem mais dias de beach</li>
        </ul>
      </details>
    </div>
  )
}

function posicaoFiltrada(lista: Linha[], i: number) {
  // mesma regra do rank(): empatadas em pontos e dias de beach dividem a posição
  let p = i
  while (p > 0 && lista[p - 1].pontos === lista[i].pontos && lista[p - 1].dias_beach === lista[i].dias_beach) p--
  return p + 1
}
