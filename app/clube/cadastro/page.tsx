'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { supabase, traduzErro } from '@/lib/clube/supabase'
import { Aviso, Botao, Campo, Logo, Rotulo } from '@/components/clube/ui'

const CATEGORIAS = ['D', 'C', 'Iniciante', 'Outra']

export default function Cadastro() {
  const router = useRouter()
  const [f, setF] = useState({ nome: '', apelido: '', whatsapp: '', categoria: '', email: '', senha: '', senha2: '' })
  const [erro, setErro] = useState('')
  const [confirmarEmail, setConfirmarEmail] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const muda = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (f.senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (f.senha !== f.senha2) return setErro('As senhas não conferem.')
    if (!f.categoria) return setErro('Escolha sua categoria.')
    const whatsapp = f.whatsapp.replace(/\D/g, '')
    if (whatsapp.length < 10) return setErro('Informe o WhatsApp com DDD.')

    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.senha,
      options: {
        data: { nome: f.nome.trim(), apelido: f.apelido.trim(), whatsapp, categoria: f.categoria },
        emailRedirectTo: `${window.location.origin}/clube`,
      },
    })
    setEnviando(false)
    if (error) return setErro(traduzErro(error.message))
    // Supabase devolve usuário sem identidades quando o e-mail já existe
    if (data.user && data.user.identities?.length === 0) return setErro(traduzErro('already registered'))
    if (data.session) router.replace('/clube')
    else setConfirmarEmail(true)
  }

  if (confirmarEmail)
    return (
      <>
        <Logo />
      <Rotulo className="mt-5 text-center">Clube BT Delas</Rotulo>
        <div className="mt-8 space-y-4 rounded-[28px] bg-white p-6 text-center shadow-2xl">
          <div className="text-5xl">📬</div>
          <h1 className="text-2xl font-black text-[#2A2A9E]">Quase lá!</h1>
          <p className="text-gray-700">
            Mandamos um link de confirmação para <b>{f.email}</b>. Abra o e-mail (olhe também o spam) e toque no link
            para ativar sua conta.
          </p>
          <Link href="/clube/entrar" className="block font-bold text-[#FF6A1A] underline">Voltar para o login</Link>
        </div>
      </>
    )

  return (
    <>
      <Logo />
      <Rotulo className="mt-5 text-center">Clube BT Delas</Rotulo>
      <form onSubmit={cadastrar} className="mt-8 space-y-4 rounded-[28px] bg-white p-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-[#2A2A9E]">Entrar pro Clube</h1>
          <p className="text-sm text-gray-600">É grátis. Quem é do Clube tem prioridade nas inscrições dos torneios.</p>
        </div>
        {erro && <Aviso>{erro}</Aviso>}
        <Campo rotulo="Nome completo" required autoComplete="name" value={f.nome} onChange={muda('nome')} />
        <Campo rotulo="Como te chamam na areia" placeholder="Opcional" value={f.apelido} onChange={muda('apelido')} />
        <Campo rotulo="WhatsApp (com DDD)" type="tel" inputMode="tel" required placeholder="82 9 9999-9999" value={f.whatsapp} onChange={muda('whatsapp')} />

        <div>
          <span className="mb-1 block text-sm font-bold text-[#2A2A9E]">Categoria</span>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIAS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setF({ ...f, categoria: c })}
                className={`rounded-xl border-2 py-2.5 text-sm font-black transition ${
                  f.categoria === c ? 'border-[#2A2A9E] bg-[#2A2A9E] text-white' : 'border-[#2A2A9E]/15 bg-white text-[#2A2A9E]'
                }`}
              >
                {c.length === 1 ? `Cat. ${c}` : c}
              </button>
            ))}
          </div>
        </div>

        <Campo rotulo="E-mail" type="email" required autoComplete="email" value={f.email} onChange={muda('email')} />
        <Campo rotulo="Senha" type="password" required autoComplete="new-password" dica="Mínimo de 6 caracteres" value={f.senha} onChange={muda('senha')} />
        <Campo rotulo="Repita a senha" type="password" required autoComplete="new-password" value={f.senha2} onChange={muda('senha2')} />
        <Botao type="submit" carregando={enviando}>Criar minha conta</Botao>
      </form>
      <p className="mt-6 text-center text-white">
        Já tem conta?{' '}
        <Link href="/clube/entrar" className="font-black text-[#F7C948] underline">Entrar</Link>
      </p>
    </>
  )
}
