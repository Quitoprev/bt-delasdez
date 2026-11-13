'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { supabase, traduzErro } from '@/lib/clube/supabase'
import { useSessao } from '@/lib/clube/sessao'
import { Aviso, Botao, Campo, Carregando, Logo, Rotulo } from '@/components/clube/ui'

export default function NovaSenha() {
  const router = useRouter()
  const { carregando, sessao } = useSessao()
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (senha !== senha2) return setErro('As senhas não conferem.')
    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) return setErro(traduzErro(error.message))
    router.replace('/clube')
  }

  if (carregando) return <Carregando />

  return (
    <>
      <Logo />
      <Rotulo className="mt-5 text-center">Clube BT Delas</Rotulo>
      <form onSubmit={salvar} className="mt-8 space-y-4 rounded-[28px] bg-white p-6 shadow-2xl">
        <h1 className="text-2xl font-black text-[#2A2A9E]">Nova senha</h1>
        {!sessao ? (
          <>
            <Aviso>Esse link expirou ou já foi usado. Peça um novo.</Aviso>
            <Link href="/clube/recuperar" className="block text-center font-bold text-[#FF6A1A] underline">Pedir novo link</Link>
          </>
        ) : (
          <>
            {erro && <Aviso>{erro}</Aviso>}
            <Campo rotulo="Nova senha" type="password" required autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <Campo rotulo="Repita a nova senha" type="password" required autoComplete="new-password" value={senha2} onChange={(e) => setSenha2(e.target.value)} />
            <Botao type="submit" carregando={enviando}>Salvar e entrar</Botao>
          </>
        )}
      </form>
    </>
  )
}
