'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { BUCKET_FOTOS, fotoUrl, supabase, traduzErro } from '@/lib/clube/supabase'
import { useSessao } from '@/lib/clube/sessao'
import { Aviso, Avatar, Botao, Campo } from '@/components/clube/ui'

type MeuCheckin = { id: number; data: string; pontos: number; foto_path: string; tipo_atividade: { nome: string; emoji: string | null } | null }

const CATEGORIAS = ['D', 'C', 'Iniciante', 'Outra']

export default function Perfil() {
  const router = useRouter()
  const { sessao, perfil, recarregarPerfil, sair } = useSessao()
  const [f, setF] = useState({ nome: '', apelido: '', whatsapp: '', instagram: '', categoria: '' })
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [meus, setMeus] = useState<MeuCheckin[]>([])

  useEffect(() => {
    if (perfil)
      setF({
        nome: perfil.nome ?? '',
        apelido: perfil.apelido ?? '',
        whatsapp: perfil.whatsapp ?? '',
        instagram: perfil.instagram ?? '',
        categoria: perfil.categoria ?? '',
      })
  }, [perfil])

  useEffect(() => {
    supabase
      .from('checkins')
      .select('id,data,pontos,foto_path,tipo_atividade:tipos_atividade(nome,emoji)')
      .eq('atleta_id', sessao!.user.id)
      .eq('status', 'valido')
      .order('criado_em', { ascending: false })
      .limit(30)
      .then(({ data }) => setMeus((data as unknown as MeuCheckin[]) ?? []))
  }, [sessao])

  const muda = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    setSalvando(true)
    const { error } = await supabase
      .from('atletas')
      .update({
        nome: f.nome.trim(),
        apelido: f.apelido.trim() || null,
        whatsapp: f.whatsapp.replace(/\D/g, '') || null,
        instagram: f.instagram.replace('@', '').trim() || null,
        categoria: f.categoria || null,
      })
      .eq('id', sessao!.user.id)
    setSalvando(false)
    if (error) return setMsg({ tipo: 'erro', texto: traduzErro(error.message) })
    await recarregarPerfil()
    setMsg({ tipo: 'ok', texto: 'Perfil atualizado! ✅' })
  }

  async function apagar(c: MeuCheckin) {
    if (!window.confirm('Apagar esse check-in? Os pontos dele saem do ranking.')) return
    const { error } = await supabase.from('checkins').delete().eq('id', c.id)
    if (error) return setMsg({ tipo: 'erro', texto: traduzErro(error.message) })
    await supabase.storage.from(BUCKET_FOTOS).remove([c.foto_path])
    setMeus((m) => m.filter((x) => x.id !== c.id))
  }

  async function sairDaConta() {
    await sair()
    router.replace('/clube/entrar')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar nome={f.nome || 'A'} tamanho={64} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black text-white">{perfil?.apelido || perfil?.nome}</h1>
          <p className="truncate text-sm text-white/85">{sessao?.user.email}</p>
        </div>
      </div>

      <form onSubmit={salvar} className="space-y-4 rounded-[28px] bg-white p-5 shadow-lg">
        <h2 className="font-black text-[#2A2A9E]">Meus dados</h2>
        {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
        <Campo rotulo="Nome completo" required value={f.nome} onChange={muda('nome')} />
        <Campo rotulo="Apelido" value={f.apelido} onChange={muda('apelido')} />
        <Campo rotulo="WhatsApp" type="tel" value={f.whatsapp} onChange={muda('whatsapp')} dica="Só a organização vê" />
        <Campo rotulo="Instagram" placeholder="@seuperfil" value={f.instagram} onChange={muda('instagram')} />
        <div>
          <span className="mb-1 block text-sm font-bold text-[#2A2A9E]">Categoria</span>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIAS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setF({ ...f, categoria: c })}
                className={`rounded-xl border-2 py-2 text-sm font-black ${f.categoria === c ? 'border-[#2A2A9E] bg-[#2A2A9E] text-white' : 'border-[#2A2A9E]/15 text-[#2A2A9E]'}`}
              >
                {c.length === 1 ? `Cat. ${c}` : c}
              </button>
            ))}
          </div>
        </div>
        <Botao type="submit" carregando={salvando}>Salvar</Botao>
      </form>

      <section>
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-[0.25em] text-[#F7C948]">Meus check-ins</h2>
        {meus.length === 0 ? (
          <p className="text-sm text-white">Nenhum check-in ainda.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {meus.map((c) => (
              <div key={c.id} className="relative overflow-hidden rounded-xl bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoUrl(c.foto_path)} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 px-1.5 pb-1 pt-4 text-[10px] font-bold text-white">
                  {c.tipo_atividade?.emoji} {c.data.split('-').reverse().slice(0, 2).join('/')} · {c.pontos}pts
                </div>
                <button
                  onClick={() => apagar(c)}
                  className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/50 text-xs text-white"
                  aria-label="Apagar check-in"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Botao variante="claro" onClick={sairDaConta}>Sair da conta</Botao>
    </div>
  )
}
