"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TORNEIO } from "@/lib/torneio";

type Cat = "C" | "D";
type Tela = "form" | "countdown" | "pix" | "espera" | "sucesso";

export default function Home() {
  const [tela, setTela] = useState<Tela>("form");
  const [cat, setCat] = useState<Cat>("C");
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [vagas, setVagas] = useState<{ C: number; D: number; abertas: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [tempo, setTempo] = useState("");

  // Busca vagas e verifica se está aberto
  async function carregarVagas() {
    try {
      const { data, error } = await supabase.rpc("vagas");
      if (error) throw error;
      setVagas(data);
      if (!data.abertas) setTela("countdown");
    } catch (e: any) {
      setErro("Não foi possível carregar as vagas: " + e.message);
    }
  }

  useEffect(() => {
    carregarVagas();
    const iv = setInterval(carregarVagas, 30_000);
    return () => clearInterval(iv);
  }, []);

  // Contagem regressiva até 10/11 12h
  useEffect(() => {
    const atualizar = () => {
      const agora = new Date();
      const diff = TORNEIO.abertura.getTime() - agora.getTime();
      if (diff <= 0) {
        setTempo("Inscrições abertas!");
        carregarVagas();
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTempo(
        `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
      );
    };
    atualizar();
    const iv = setInterval(atualizar, 1000);
    return () => clearInterval(iv);
  }, []);

  // Polling do status da inscrição (pra quando a organização confirmar)
  useEffect(() => {
    if (!inscricaoId || tela !== "pix") return;
    const iv = setInterval(async () => {
      const { data } = await supabase.rpc("status_inscricao", { p_id: inscricaoId });
      if (data === "pago") setTela("sucesso");
    }, 4000);
    return () => clearInterval(iv);
  }, [inscricaoId, tela]);

  async function inscrever() {
    setErro("");
    if (!nome.trim()) return setErro("Informe seu nome.");
    if (!tel.trim()) return setErro("Informe seu WhatsApp.");
    setEnviando(true);
    try {
      const { data, error } = await supabase.rpc("reservar_vaga", {
        p_nome: nome.trim(),
        p_tel: tel.trim(),
        p_email: email.trim() || null,
        p_cat: cat,
      });
      if (error) {
        if (error.message.includes("inscricoes_fechadas")) {
          setTela("countdown");
          return;
        }
        throw error;
      }
      const row = Array.isArray(data) ? data[0] : data;
      setInscricaoId(row.id);
      setTela(row.status === "espera" ? "espera" : "pix");
    } catch (e: any) {
      setErro("Erro: " + e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-laranja flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Logo />

        {/* Hero */}
        <div className="text-center mt-4 mb-6 text-white anim-in">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-none">
            Super 8
          </h1>
          <p className="mt-2 text-white/90 text-sm">
            {TORNEIO.data} · {TORNEIO.localCurto}
          </p>
        </div>

        {/* Conteúdo que troca por tela */}
        {tela === "countdown" && <TelaCountdown tempo={tempo} />}

        {tela === "form" && (
          <TelaForm
            vagas={vagas}
            cat={cat}
            setCat={setCat}
            nome={nome}
            setNome={setNome}
            tel={tel}
            setTel={setTel}
            email={email}
            setEmail={setEmail}
            enviando={enviando}
            erro={erro}
            onSubmit={inscrever}
          />
        )}

        {tela === "pix" && <TelaPix cat={cat} />}
        {tela === "espera" && <TelaEspera cat={cat} />}
        {tela === "sucesso" && <TelaSucesso />}

        <footer className="text-center text-white/70 text-xs mt-6">
          @BTdelas_Mcz
        </footer>
      </div>
    </main>
  );
}

/* ================= COMPONENTES ================= */

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
        <span className="font-display text-3xl font-extrabold text-azul">
          Bt
        </span>
        <span className="font-display text-amarelo font-extrabold text-sm align-super ml-0.5">
          delas
        </span>
        <span className="inline-block w-2 h-2 rounded-full bg-pink ml-1" />
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl anim-in">
      {children}
    </div>
  );
}

function TelaCountdown({ tempo }: { tempo: string }) {
  return (
    <Card>
      <div className="text-center">
        <div className="inline-block px-3 py-1 bg-amarelo/20 text-azul font-bold text-xs rounded-full tracking-widest uppercase">
          Em breve
        </div>
        <h2 className="font-display text-2xl font-extrabold text-azul mt-3">
          Inscrições abrem em
        </h2>
        <div className="font-display text-3xl font-extrabold text-laranja mt-3 tabular-nums">
          {tempo || "…"}
        </div>
        <p className="text-azul/70 text-sm mt-3">
          Terça, 10 de novembro, às 12h (horário de Maceió)
        </p>
        <div className="mt-5 pt-5 border-t border-azul/10 text-left text-sm text-azul/80 space-y-1.5">
          <p>🎾 <b>24 vagas</b> na Categoria C</p>
          <p>🎾 <b>16 vagas</b> na Categoria D</p>
          <p>🏆 Torneio em <b>13/12</b> (domingo)</p>
        </div>
      </div>
    </Card>
  );
}

function TelaForm({
  vagas, cat, setCat, nome, setNome, tel, setTel, email, setEmail,
  enviando, erro, onSubmit,
}: any) {
  const lotada = (c: Cat) => vagas && vagas[c] <= 0;
  return (
    <Card>
      {/* Status de vagas */}
      <div className="flex gap-2 text-xs mb-5">
        <Chip lotada={lotada("C")} label="Cat. C" valor={vagas?.C} total={24} />
        <Chip lotada={lotada("D")} label="Cat. D" valor={vagas?.D} total={16} />
      </div>

      <Label>Nome completo</Label>
      <Input value={nome} onChange={setNome} placeholder="Seu nome" />

      <Label>WhatsApp</Label>
      <Input
        value={tel}
        onChange={setTel}
        placeholder="(82) 90000-0000"
        inputMode="tel"
      />

      <Label>E-mail (opcional)</Label>
      <Input
        value={email}
        onChange={setEmail}
        placeholder="voce@email.com"
        inputMode="email"
      />

      <Label>Categoria</Label>
      <div className="grid grid-cols-2 gap-2">
        {(["C", "D"] as Cat[]).map((c) => {
          const sel = cat === c;
          const cheia = lotada(c);
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`p-3 rounded-xl border-2 font-bold transition ${
                sel
                  ? "border-laranja bg-laranja/10 text-laranja"
                  : "border-azul/15 text-azul/80 hover:border-laranja/50"
              } ${cheia ? "opacity-60" : ""}`}
            >
              <div className="font-display text-lg">Categoria {c}</div>
              <div className="text-[11px] font-medium opacity-80">
                {cheia ? "lista de espera" : `${c === "C" ? 24 : 16} vagas`}
              </div>
            </button>
          );
        })}
      </div>

      {erro && (
        <div className="mt-4 p-3 rounded-xl bg-pink/10 text-pink-500 text-sm font-medium">
          {erro}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={enviando}
        className="w-full mt-5 bg-laranja hover:bg-laranja-600 text-white font-bold py-4 rounded-xl text-lg transition disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Garantir minha vaga"}
      </button>

      <p className="text-center text-azul/60 text-[11px] mt-3">
        A vaga é confirmada após o pagamento.
      </p>
    </Card>
  );
}

function TelaPix({ cat }: { cat: Cat }) {
  return (
    <Card>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amarelo/20 text-azul font-bold text-xs rounded-full">
          ⏳ Aguardando pagamento
        </div>
        <h2 className="font-display text-2xl font-extrabold text-azul mt-3">
          Vaga reservada!
        </h2>
        <p className="text-azul/80 text-sm mt-2">
          Sua vaga na <b>Categoria {cat}</b> está reservada. Agora é só pagar
          pelo PIX e aguardar a confirmação da organização.
        </p>

        <div className="mt-5 p-4 bg-creme rounded-2xl text-left">
          <p className="text-xs font-bold text-azul/60 uppercase tracking-wider">
            Como pagar
          </p>
          <ol className="mt-2 space-y-1.5 text-sm text-azul">
            <li>1. Faça o PIX do valor da inscrição</li>
            <li>2. Envie o comprovante no WhatsApp da organização</li>
            <li>3. Sua vaga é confirmada e você recebe aviso</li>
          </ol>
        </div>

        <a
          href="https://wa.me/5582996001624?text=Oi!%20Fiz%20minha%20inscri%C3%A7%C3%A3o%20no%20Super%208%20BT%20Delas%20e%20quero%20enviar%20o%20comprovante%20do%20PIX."
          target="_blank"
          className="block mt-5 bg-azul hover:bg-azul-600 text-white font-bold py-4 rounded-xl transition"
        >
          📲 Enviar comprovante no WhatsApp
        </a>

        <p className="text-azul/50 text-xs mt-4">
          Esta tela atualiza sozinha quando a organização confirmar seu pagamento.
        </p>
        <div className="mx-auto mt-3 w-8 h-8 border-2 border-laranja/30 border-t-laranja rounded-full spin" />
      </div>
    </Card>
  );
}

function TelaEspera({ cat }: { cat: Cat }) {
  return (
    <Card>
      <div className="text-center">
        <div className="inline-block px-3 py-1 bg-amarelo/30 text-azul font-bold text-xs rounded-full">
          📋 Lista de espera
        </div>
        <h2 className="font-display text-2xl font-extrabold text-azul mt-3">
          Você entrou na lista!
        </h2>
        <p className="text-azul/80 text-sm mt-3">
          A <b>Categoria {cat}</b> já está cheia, mas você foi registrada na
          lista de espera. Se abrir vaga, a organização entra em contato pelo
          seu WhatsApp.
        </p>
      </div>
    </Card>
  );
}

function TelaSucesso() {
  return (
    <Card>
      <div className="text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="font-display text-3xl font-extrabold text-laranja mt-3">
          Vaga confirmada!
        </h2>
        <div className="inline-block px-3 py-1 bg-emerald-500/15 text-emerald-700 font-bold text-xs rounded-full mt-3">
          ✓ Pagamento confirmado
        </div>
        <p className="text-azul/80 text-sm mt-4">
          Tudo certo! Nos vemos na quadra em <b>13/12</b>. Fique de olho no
          WhatsApp — a organização enviará mais detalhes na semana do torneio.
        </p>
      </div>
    </Card>
  );
}

/* UI helpers */
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
function Chip({ lotada, label, valor, total }: any) {
  return (
    <div
      className={`flex-1 text-center py-1.5 rounded-full border ${
        lotada
          ? "bg-pink/10 border-pink/30 text-pink-500"
          : "bg-amarelo/15 border-amarelo/40 text-azul"
      } font-bold`}
    >
      {label}: {valor ?? "—"}/{total}
    </div>
  );
}
