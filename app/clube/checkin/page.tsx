'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BUCKET_FOTOS, hojeMaceio, supabase, traduzErro } from '@/lib/clube/supabase'
import { comprimirImagem } from '@/lib/clube/imagem'
import { useSessao } from '@/lib/clube/sessao'
import { Aviso, Botao, Rotulo } from '@/components/clube/ui'

type Tipo = { id: number; nome: string; emoji: string | null; pontos: number; eh_beach: boolean }

export default function Checkin() {
  const router = useRouter()
  const { sessao } = useSessao()
  const meuId = sessao!.user.id
  const inputFoto = useRef<HTMLInputElement>(null)

  const [tipos, setTipos] = useState<Tipo[]>([])
  const [tipoId, setTipoId] = useState<number | null>(null)
  const [foto, setFoto] = useState<File | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [legenda, setLegenda] = useState('')
  const [melhorHoje, setMelhorHoje] = useState(0)
  const [qtdHoje, setQtdHoje] = useState(0)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [{ data: t }, { data: hoje }] = await Promise.all([
        supabase.from('tipos_atividade').select('id,nome,emoji,pontos,eh_beach').eq('ativo', true).order('ordem'),
        supabase.from('checkins').select('pontos').eq('atleta_id', meuId).eq('data', hojeMaceio()).eq('status', 'valido'),
      ])
      setTipos((t as Tipo[]) ?? [])
      const pts = ((hoje as { pontos: number }[]) ?? []).map((c) => c.pontos)
      setQtdHoje(pts.length)
      setMelhorHoje(pts.length ? Math.max(...pts) : 0)
    })()
  }, [meuId])

  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa) }, [previa])

  function escolherFoto(arquivo?: File) {
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) return setErro('Escolha uma imagem.')
    setErro('')
    setFoto(arquivo)
    setPrevia(URL.createObjectURL(arquivo))
  }

  const tipo = tipos.find((t) => t.id === tipoId)
  const ganho = tipo ? Math.max(0, tipo.pontos - melhorHoje) : 0

  async function enviar() {
    if (!tipo) return setErro('Escolha o que você fez.')
    if (!foto) return setErro('Coloque uma foto do treino.')
    setErro('')
    setEnviando(true)
    try {
      const imagem = await comprimirImagem(foto)
      const caminho = `${meuId}/${Date.now()}.jpg`
      const up = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, imagem, { contentType: 'image/jpeg' })
      if (up.error) throw up.error

      const { error } = await supabase
        .from('checkins')
        .insert({ atleta_id: meuId, tipo_id: tipo.id, foto_path: caminho, legenda: legenda.trim() || null })
      if (error) {
        await supabase.storage.from(BUCKET_FOTOS).remove([caminho])
        throw error
      }
      router.replace('/clube')
    } catch (e) {
      setErro(traduzErro((e as Error).message))
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Check-in de hoje</h1>
        <p className="text-sm text-white/90">
          Vale 1 por dia: se fizer mais de um, conta o que dá mais pontos.
        </p>
      </div>

      {qtdHoje > 0 && (
        <Aviso tipo="info">
          Você já garantiu <b>{melhorHoje} pts</b> hoje. Um novo check-in só soma se valer mais que isso, mas aparece no feed do mesmo jeito.
        </Aviso>
      )}

      <section>
        <Rotulo className="mb-2">1. O que você fez?</Rotulo>
        <div className="grid grid-cols-2 gap-3">
          {tipos.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipoId(t.id)}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                tipoId === t.id ? 'border-[#2A2A9E] bg-[#FBF0C9]' : 'border-transparent bg-white'
              }`}
            >
              <div className="text-2xl">{t.emoji}</div>
              <div className="mt-1 text-sm font-black leading-tight text-[#2A2A9E]">{t.nome}</div>
              <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-black ${t.eh_beach ? 'bg-[#F7C948] text-[#2A2A9E]' : 'bg-gray-100 text-gray-600'}`}>
                {t.pontos} {t.pontos === 1 ? 'pt' : 'pts'}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <Rotulo className="mb-2">2. Foto do treino</Rotulo>
        <input ref={inputFoto} type="file" accept="image/*" className="hidden" onChange={(e) => escolherFoto(e.target.files?.[0])} />
        <button
          onClick={() => inputFoto.current?.click()}
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/70 bg-white/15"
        >
          {previa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previa} alt="Prévia" className="h-full w-full object-cover" />
          ) : (
            <span className="text-center text-white">
              <span className="block text-5xl">📷</span>
              <span className="mt-2 block font-bold">Tirar foto ou escolher da galeria</span>
            </span>
          )}
          {previa && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">Trocar</span>
          )}
        </button>
      </section>

      <section>
        <Rotulo className="mb-2">3. Legenda (opcional)</Rotulo>
        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value.slice(0, 280))}
          rows={2}
          placeholder="Ex.: Treino com as meninas na Top Sports 🔥"
          className="w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 outline-none focus:border-[#FF6A1A]"
        />
      </section>

      {erro && <Aviso>{erro}</Aviso>}

      <Botao onClick={enviar} carregando={enviando} disabled={!tipo || !foto}>
        {tipo ? (ganho > 0 ? `Fazer check-in (+${ganho} pts)` : 'Postar no feed (sem pontos extras)') : 'Fazer check-in'}
      </Botao>
    </div>
  )
}
