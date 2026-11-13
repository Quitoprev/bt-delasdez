'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Perfil = {
  id: string
  nome: string
  apelido: string | null
  whatsapp: string | null
  instagram: string | null
  categoria: string | null
  avatar_path: string | null
}

type Ctx = {
  carregando: boolean
  sessao: Session | null
  perfil: Perfil | null
  recarregarPerfil: () => Promise<void>
  sair: () => Promise<void>
}

const SessaoCtx = createContext<Ctx>({
  carregando: true,
  sessao: null,
  perfil: null,
  recarregarPerfil: async () => {},
  sair: async () => {},
})

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [sessao, setSessao] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  const buscarPerfil = useCallback(async (uid?: string) => {
    if (!uid) {
      setPerfil(null)
      return
    }
    const { data } = await supabase.from('atletas').select('*').eq('id', uid).maybeSingle()
    setPerfil((data as Perfil) ?? null)
  }, [])

  useEffect(() => {
    let ativo = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return
      setSessao(data.session)
      await buscarPerfil(data.session?.user.id)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSessao(s)
      // fora do callback para não travar o cliente do Supabase
      setTimeout(() => buscarPerfil(s?.user.id), 0)
    })
    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [buscarPerfil])

  const recarregarPerfil = useCallback(() => buscarPerfil(sessao?.user.id), [buscarPerfil, sessao])
  const sair = useCallback(async () => {
    await supabase.auth.signOut()
    setPerfil(null)
  }, [])

  return (
    <SessaoCtx.Provider value={{ carregando, sessao, perfil, recarregarPerfil, sair }}>
      {children}
    </SessaoCtx.Provider>
  )
}

export const useSessao = () => useContext(SessaoCtx)
