'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { SessaoProvider, useSessao } from '@/lib/clube/sessao'
import { Carregando, FUNDO } from '@/components/clube/ui'

const ROTAS_PUBLICAS = ['/clube/entrar', '/clube/cadastro', '/clube/recuperar', '/clube/nova-senha']

export default function ClubeLayout({ children }: { children: ReactNode }) {
  return (
    <SessaoProvider>
      <Guarda>{children}</Guarda>
    </SessaoProvider>
  )
}

function Guarda({ children }: { children: ReactNode }) {
  const { carregando, sessao } = useSessao()
  const rota = usePathname()
  const router = useRouter()
  const publica = ROTAS_PUBLICAS.some((r) => rota.startsWith(r))

  useEffect(() => {
    if (carregando) return
    if (!sessao && !publica) router.replace('/clube/entrar')
    if (sessao && (rota === '/clube/entrar' || rota === '/clube/cadastro')) router.replace('/clube')
  }, [carregando, sessao, publica, rota, router])

  if (publica) {
    return (
      <main className={`min-h-screen px-5 py-10 ${FUNDO}`}>
        <div className="mx-auto max-w-sm">{children}</div>
      </main>
    )
  }

  if (carregando || !sessao)
    return (
      <div className={`min-h-screen ${FUNDO}`}>
        <Carregando />
      </div>
    )

  return (
    <div className={`min-h-screen pb-24 ${FUNDO}`}>
      <header className="sticky top-0 z-20 bg-[#FF6A1A]/95 px-4 py-2 shadow-[0_2px_10px_#00000022] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/clube" aria-label="Início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clube/logo-btdelas.png" alt="BT Delas" className="h-11 w-auto" />
          </Link>
          <span className="rounded-full bg-[#2A2A9E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#F7C948]">
            Clube
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <MenuInferior rota={rota} />
    </div>
  )
}

function MenuInferior({ rota }: { rota: string }) {
  const itens = [
    { href: '/clube', rotulo: 'Início', icone: '🏠' },
    { href: '/clube/ranking', rotulo: 'Ranking', icone: '🏆' },
    { href: '/clube/checkin', rotulo: 'Check-in', icone: '📸', destaque: true },
    { href: '/clube/parcerias', rotulo: 'Parcerias', icone: '🎁' },
    { href: '/clube/perfil', rotulo: 'Perfil', icone: '👤' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_#00000026]">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {itens.map((i) => {
          const ativo = i.href === '/clube' ? rota === i.href : rota.startsWith(i.href)
          if (i.destaque)
            return (
              <Link key={i.href} href={i.href} className="flex flex-col items-center justify-center py-1">
                <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-[#2A2A9E] text-2xl shadow-lg ring-4 ring-[#F7C948]">
                  {i.icone}
                </span>
                <span className="mt-1 text-[11px] font-extrabold text-[#2A2A9E]">{i.rotulo}</span>
              </Link>
            )
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-extrabold ${ativo ? 'text-[#FF6A1A]' : 'text-gray-400'}`}
            >
              <span className={`text-xl ${ativo ? '' : 'opacity-50 grayscale'}`}>{i.icone}</span>
              {i.rotulo}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
