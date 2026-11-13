'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { supabase, traduzErro } from '@/lib/clube/supabase'
import { Aviso, Botao, Campo, Logo, Rotulo } from '@/components/clube/ui'

export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/clube/nova-senha`,
    })
    setEnviando(false)
    if (error) return setErro(traduzErro(error.message))
    setEnviado(true)
  }

  return (
    <>
      <Logo />
      <Rotulo className="mt-5 text-center">Clube BT Delas</Rotulo>
      <form onSubmit={enviar} className="mt-8 space-y-4 rounded-[28px] bg-white p-6 shadow-2xl">
        <h1 className="text-2xl font-black text-[#2A2A9E]">Recuperar senha</h1>
        {enviado ? (
          <Aviso tipo="ok">Se esse e-mail tiver cadastro, você vai receber um link para criar uma nova senha. Olhe também o spam.</Aviso>
        ) : (
          <>
            <p className="text-sm text-gray-600">Digite o e-mail do seu cadastro que a gente manda um link.</p>
            {erro && <Aviso>{erro}</Aviso>}
            <Campo rotulo="E-mail" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Botao type="submit" carregando={enviando}>Enviar link</Botao>
          </>
        )}
        <Link href="/clube/entrar" className="block text-center text-sm font-bold text-[#2A2A9E] underline">Voltar para o login</Link>
      </form>
    </>
  )
}
