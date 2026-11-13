'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { supabase, traduzErro } from '@/lib/clube/supabase'
import { Aviso, Botao, Campo, Logo, Rotulo } from '@/components/clube/ui'

export default function Entrar() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) return setErro(traduzErro(error.message))
    router.replace('/clube')
  }

  return (
    <>
      <Logo />
      <Rotulo className="mt-5 text-center">Clube BT Delas</Rotulo>
      <p className="mt-4 text-center text-white/80">Treinou? Faz check-in, soma ponto e sobe no ranking. 🎾</p>

      <form onSubmit={entrar} className="mt-8 space-y-4 rounded-[28px] bg-white p-6 shadow-2xl">
        <h1 className="text-2xl font-black text-[#2A2A9E]">Entrar</h1>
        {erro && <Aviso>{erro}</Aviso>}
        <Campo rotulo="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Campo rotulo="Senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        <Botao type="submit" carregando={enviando}>Entrar</Botao>
        <Link href="/clube/recuperar" className="block text-center text-sm font-bold text-[#2A2A9E] underline">
          Esqueci minha senha
        </Link>
      </form>

      <p className="mt-6 text-center text-white">
        Ainda não é do Clube?{' '}
        <Link href="/clube/cadastro" className="font-black text-[#F7C948] underline">
          Cadastre-se grátis
        </Link>
      </p>
    </>
  )
}
