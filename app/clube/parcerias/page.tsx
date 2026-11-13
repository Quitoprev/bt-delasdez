'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { hojeMaceio, supabase } from '@/lib/clube/supabase'
import { Carregando, Rotulo } from '@/components/clube/ui'
import { LogoParceiro, dataCurta, type Parceiro } from '@/components/clube/parceiro'

export default function Parcerias() {
  const [lista, setLista] = useState<Parceiro[] | null>(null)
  const [categoria, setCategoria] = useState('Todas')

  useEffect(() => {
    supabase
      .from('parceiros')
      .select('*')
      .eq('ativo', true)
      .or(`valido_ate.is.null,valido_ate.gte.${hojeMaceio()}`)
      .order('destaque', { ascending: false })
      .order('ordem')
      .order('nome')
      .then(({ data }) => setLista((data as Parceiro[]) ?? []))
  }, [])

  const categorias = useMemo(
    () => ['Todas', ...Array.from(new Set((lista ?? []).map((p) => p.categoria))).sort()],
    [lista]
  )
  const filtrados = (lista ?? []).filter((p) => categoria === 'Todas' || p.categoria === categoria)
  const destaques = filtrados.filter((p) => p.destaque)
  const demais = filtrados.filter((p) => !p.destaque)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-white">Parcerias</h1>
        <p className="text-sm text-white/90">Descontos exclusivos para quem é do Clube. 💛</p>
      </div>

      {categorias.length > 2 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                categoria === c ? 'bg-[#2A2A9E] text-[#F7C948]' : 'bg-white/90 text-[#2A2A9E]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {!lista ? (
        <Carregando />
      ) : lista.length === 0 ? (
        <div className="rounded-[28px] bg-[#2A2A9E] p-8 text-center text-white ring-4 ring-[#F7C948]">
          <div className="text-5xl">🤝</div>
          <Rotulo className="mt-3">Em breve</Rotulo>
          <p className="mt-2 font-bold">As primeiras parcerias do Clube estão chegando.</p>
          <p className="mt-1 text-sm text-white/80">Fica de olho que vai ter desconto exclusivo pra você!</p>
        </div>
      ) : (
        <>
          {destaques.map((p) => (
            <Link
              key={p.id}
              href={`/clube/parcerias/${p.id}`}
              className="block rounded-[28px] bg-[#2A2A9E] p-5 text-white shadow-xl ring-4 ring-[#F7C948] active:scale-[0.98]"
            >
              <Rotulo>⭐ Destaque</Rotulo>
              <div className="mt-3 flex items-center gap-4">
                <LogoParceiro p={p} tamanho={64} />
                <div className="min-w-0">
                  <div className="truncate text-lg font-black">{p.nome}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white/70">{p.categoria}</div>
                </div>
              </div>
              <div className="mt-4 text-2xl font-black leading-tight text-[#F7C948]">{p.resumo}</div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-white/70">{p.valido_ate ? `Até ${dataCurta(p.valido_ate)}` : 'Sem prazo'}</span>
                <span className="rounded-full bg-white px-4 py-1.5 font-black text-[#2A2A9E]">Ver desconto →</span>
              </div>
            </Link>
          ))}

          <div className="space-y-3">
            {demais.map((p) => (
              <Link
                key={p.id}
                href={`/clube/parcerias/${p.id}`}
                className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-lg active:scale-[0.98]"
              >
                <LogoParceiro p={p} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-black text-[#2A2A9E]">{p.nome}</div>
                  <div className="font-extrabold leading-tight text-[#FF6A1A]">{p.resumo}</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {p.categoria}
                    {p.valido_ate && ` · até ${dataCurta(p.valido_ate)}`}
                  </div>
                </div>
                <span className="text-xl text-[#2A2A9E]/40">›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <p className="pt-2 text-center text-xs font-bold text-white/85">
        Tem um negócio e quer ser parceiro do BT Delas? Chama a organização no Instagram!
      </p>
    </div>
  )
}
