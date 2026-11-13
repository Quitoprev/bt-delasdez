'use client'

import { useState } from 'react'
import { fotoUrl, supabase, tempoRelativo } from '@/lib/clube/supabase'
import { Avatar } from './ui'

export type ItemFeed = {
  id: number
  atleta_id: string
  data: string
  pontos: number
  eh_beach: boolean
  foto_path: string
  legenda: string | null
  criado_em: string
  tipo_nome: string
  tipo_emoji: string | null
  nome: string
  apelido: string | null
  curtidas: number
  curti: boolean
}

export function FeedCard({ item, meuId }: { item: ItemFeed; meuId: string }) {
  const [curti, setCurti] = useState(item.curti)
  const [total, setTotal] = useState(Number(item.curtidas))
  const [pulso, setPulso] = useState(false)

  async function alternarCurtida() {
    const novo = !curti
    setCurti(novo)
    setTotal((t) => t + (novo ? 1 : -1))
    if (novo) {
      setPulso(true)
      setTimeout(() => setPulso(false), 400)
    }
    const { error } = novo
      ? await supabase.from('curtidas').insert({ checkin_id: item.id, atleta_id: meuId })
      : await supabase.from('curtidas').delete().eq('checkin_id', item.id).eq('atleta_id', meuId)
    if (error && !error.message.includes('duplicate')) {
      setCurti(!novo)
      setTotal((t) => t + (novo ? -1 : 1))
    }
  }

  const nome = item.apelido || item.nome.split(' ')[0]

  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-lg">
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar nome={item.nome} tamanho={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-black text-[#2A2A9E]">{nome}</div>
          <div className="text-xs text-gray-500">
            {item.tipo_emoji} {item.tipo_nome} · {tempoRelativo(item.criado_em)}
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-black ${
            item.eh_beach ? 'bg-[#FBF0C9] text-[#2A2A9E]' : 'bg-gray-100 text-gray-600'
          }`}
        >
          +{item.pontos}
        </span>
      </header>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fotoUrl(item.foto_path)}
        alt={`Check-in de ${nome}`}
        loading="lazy"
        onDoubleClick={() => !curti && alternarCurtida()}
        className="aspect-square w-full bg-gray-100 object-cover"
      />

      <footer className="px-4 py-3">
        <button onClick={alternarCurtida} className="flex items-center gap-2 font-bold text-[#2A2A9E]" aria-label="Curtir">
          <span className={`text-2xl transition-transform ${pulso ? 'scale-125' : ''}`}>{curti ? '💖' : '🤍'}</span>
          <span className="text-sm">{total > 0 ? total : ''}</span>
        </button>
        {item.legenda && (
          <p className="mt-1 text-sm text-gray-800">
            <b className="text-[#2A2A9E]">{nome}</b> {item.legenda}
          </p>
        )}
      </footer>
    </article>
  )
}
