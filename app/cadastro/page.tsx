"use client";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Cat = "C" | "D" | "indefinida";
type Tela = "form" | "sucesso";

export default function Cadastro() {
  const [tela, setTela] = useState<Tela>("form");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [cat, setCat] = useState<Cat>("indefinida");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [aniv, setAniv] = useState(""); // YYYY-MM-DD

  async function enviar() {
    setErro("");
    if (!nome.trim()) return setErro("Informe seu nome.");
    if (!tel.trim()) return setErro("Informe seu WhatsApp.");

    setEnviando(true);
    try {
      const { error } = await supabase.rpc("cadastrar_atleta", {
        p_nome: nome.trim(),
        p_tel: tel.trim(),
        p_email: email.trim() || null,
        p_cat: cat,
        p_cidade: cidade.trim() || null,
        p_bairro: bairro.trim() || null,
        p_aniversario: aniv || null,
      });
      if (error) {
        if (error.message.includes("ja_cadastrada")) {
          setErro("Este WhatsApp já está cadastrado no Clube BT Delas. Você já é membra! 💛");
          return;
        }
        if (error.message.includes("telefone_invalido")) {
          setErro("WhatsApp inválido. Digite com DDD (ex: 82 99628-1922).");
          return;
        }
        throw error;
      }
      setTela("sucesso");
    } catch (e: any) {
      setErro("Erro: " + e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-laranja flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center py-4">
          <Image
            src="/bt-delas-logo.png"
            alt="BT Delas"
            width={180}
            height={180}
            priority
            className="drop-shadow-2xl"
          />
        </div>

        <div className="text-center mt-2 mb-4 text-white">
          <p className="font-bold text-amarelo uppercase tracking-widest text-xs">
            💛 Clube BT Delas
          </p>
          <p className="mt-2 text-white/95 text-sm">
            Cadastre-se e tenha vantagens nos próximos torneios
          </p>
        </div>

        {/* Card de benefícios */}
        <div className="bg-azul rounded-3xl p-5 mb-5 text-center shadow-2xl border-4 border-amarelo">
          <p className="text-amarelo text-[11px] font-bold uppercase tracking-widest mb-3">
            🎁 Vantagens exclusivas
          </p>
          <div className="space-y-2.5 text-left">
            <div className="flex gap-3 items-start">
              <span className="text-2xl leading-none">⏰</span>
              <div>
                <p className="font-bold text-white text-sm leading-tight">
                  Prioridade na inscrição
                </p>
                <p className="text-white/80 text-xs">
                  Membras se inscrevem 24h antes do público
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl leading-none">🎉</span>
              <div>
                <p className="font-bold text-white text-sm leading-tight">
                  Novidades em primeira mão
                </p>
                <p className="text-white/80 text-xs">
                  Torneios, aulões e eventos da comunidade
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl leading-none">💎</span>
              <div>
                <p className="font-bold text-white text-sm leading-tight">
                  Em breve: descontos em parceiros
                </p>
                <p className="text-white/80 text-xs">
                  Estamos construindo o clube — você começa com a gente
                </p>
              </div>
            </div>
          </div>
        </div>

        {tela === "form" && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl anim-in">
            <Label>Nome completo</Label>
            <Input value={nome} onChange={setNome} placeholder="Seu nome" />

            <Label>WhatsApp *</Label>
            <Input
              value={tel}
              onChange={setTel}
              placeholder="(82) 99628-1922"
              inputMode="tel"
            />

            <Label>E-mail</Label>
            <Input
              value={email}
              onChange={setEmail}
              placeholder="voce@email.com"
              inputMode="email"
            />

            <Label>Categoria que mais joga</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["C", "D", "indefinida"] as Cat[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`p-3 rounded-xl border-2 font-bold transition ${
                    cat === c
                      ? "border-laranja bg-laranja/10 text-laranja"
                      : "border-azul/15 text-azul/80 hover:border-laranja/50"
                  }`}
                >
                  <div className="font-display text-base">
                    {c === "indefinida" ? "Não sei" : `Cat. ${c}`}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input value={cidade} onChange={setCidade} placeholder="Maceió" />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={bairro} onChange={setBairro} placeholder="Jatiúca" />
              </div>
            </div>

            <Label>Aniversário (opcional 🎂)</Label>
            <input
              type="date"
              value={aniv}
              onChange={(e) => setAniv(e.target.value)}
              className="w-full px-4 py-3 bg-creme border-2 border-azul/10 rounded-xl text-azul font-medium focus:outline-none focus:border-laranja"
            />

            {erro && (
              <div className="mt-4 p-3 rounded-xl bg-pink/10 text-pink-500 text-sm font-medium">
                {erro}
              </div>
            )}

            <button
              onClick={enviar}
              disabled={enviando}
              className="w-full mt-5 bg-laranja hover:bg-laranja-600 text-white font-bold py-4 rounded-xl text-lg transition disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Entrar no Clube 💛"}
            </button>

            <p className="text-center text-azul/60 text-[11px] mt-3">
              Cadastro gratuito · Seus dados ficam só com a organização BT Delas
            </p>
          </div>
        )}

        {tela === "sucesso" && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl anim-in text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="font-display text-3xl font-extrabold text-laranja mt-3">
              Bem-vinda ao Clube!
            </h2>
            <p className="text-azul/80 text-sm mt-4">
              Cadastro feito com sucesso. No próximo torneio, você terá{" "}
              <b>24h de prioridade</b> antes da abertura pública das inscrições.
            </p>
            <div className="mt-5 p-3 bg-amarelo/10 rounded-xl text-sm text-azul/85">
              💛 Fique de olho no WhatsApp — por lá chegarão os avisos de novos
              torneios e das vantagens do clube.
            </div>
            <a
              href="https://www.instagram.com/btdelas_mcz"
              target="_blank"
              className="block mt-5 bg-pink hover:bg-pink-500 text-white font-bold py-3 rounded-xl transition"
            >
              📸 Seguir @BTdelas_Mcz no Instagram
            </a>
          </div>
        )}

        <footer className="text-center text-white/80 text-xs mt-6 font-bold">
          @BTdelas_Mcz
        </footer>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-azul uppercase tracking-wider mt-4 mb-1.5">
      {children}
    </label>
  );
}
function Input(props: any) {
  return (
    <input
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      inputMode={props.inputMode}
      className="w-full px-4 py-3 bg-creme border-2 border-azul/10 rounded-xl text-azul font-medium focus:outline-none focus:border-laranja transition"
    />
  );
}
