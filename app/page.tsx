"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { TORNEIO } from "@/lib/torneio";

type Cat = "C" | "D";
type Tela = "form" | "countdown" | "pix" | "espera" | "sucesso";

// ⚙️ CONFIG PIX
const PIX = {
  chave: "bdcdc7b1-9bd7-426c-bed9-b41c61feea9f",
  nome: "BT DELAS",
  cidade: "MACEIO",
  valor: 30.00,
};

export default function Home() {
  const [tela, setTela] = useState<Tela>("form");
  const [cat, setCat] = useState<Cat>("C");
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [vagas, setVagas] = useState<{ C: number; D: number; abertas: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [tempo, setTempo] = useState("");

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

  useEffect(() => {
    const atualizar = () => {
      const agora = new Date();
      const diff = TORNEIO.abertura.getTime() - agora.getTime();
      if (diff <= 0) { setTempo("Inscrições abertas!"); carregarVagas(); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTempo(`${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    atualizar();
    const iv = setInterval(atualizar, 1000);
    return () => clearInterval(iv);
  }, []);

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
        p_email: null,
        p_cat: cat,
      });
      if (error) {
        if (error.message.includes("inscricoes_fechadas")) { setTela("countdown"); return; }
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
        <div className="flex justify-center py-4">
          <Image src="/bt-delas-logo.png" alt="BT Delas" width={180} height={180} priority className="drop-shadow-2xl" />
        </div>

        <div className="text-center mt-2 mb-4 text-white anim-in">
          <p className="font-bold text-amarelo uppercase tracking-widest text-xs">
            Torneio Super 8
          </p>
        </div>

        {/* CARD DE DATA + HORA — bem destacado */}
        <div className="bg-azul rounded-3xl p-5 mb-5 text-center shadow-2xl border-4 border-amarelo anim-in">
          <p className="text-amarelo text-[11px] font-bold uppercase tracking-widest">
            🏆 Save the date
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="text-center">
              <div className="font-display text-6xl font-extrabold text-white leading-none tabular-nums">
                13
              </div>
              <div className="font-display text-sm font-bold text-amarelo uppercase mt-0.5">
                dezembro
              </div>
            </div>
            <div className="h-16 w-px bg-white/30" />
            <div className="text-left">
              <div className="font-display text-3xl font-extrabold text-white leading-none tabular-nums">
                15<span className="text-amarelo">h</span>
              </div>
              <div className="font-bold text-white/90 text-xs uppercase tracking-wider mt-1">
                Domingo
              </div>
            </div>
          </div>
        </div>

        {tela === "countdown" && <TelaCountdown tempo={tempo} />}
        {tela === "form" && (
          <TelaForm vagas={vagas} cat={cat} setCat={setCat} nome={nome} setNome={setNome}
            tel={tel} setTel={setTel} enviando={enviando} erro={erro} onSubmit={inscrever} />
        )}
        {tela === "pix" && <TelaPix cat={cat} />}
        {tela === "espera" && <TelaEspera cat={cat} />}
        {tela === "sucesso" && <TelaSucesso />}

        {/* LOGO LOCAL - Top Sports Academy */}
        {(tela === "form" || tela === "countdown") && (
          <div className="mt-6 bg-black/85 rounded-2xl px-6 py-4 flex flex-col items-center shadow-lg">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2">
              Arena parceira
            </p>
            <Image
              src="/topsports-logo.png"
              alt="Top Sports Academy"
              width={200}
              height={35}
              className="h-auto"
            />
          </div>
        )}

        <footer className="text-center text-white/80 text-xs mt-6 font-bold">
          @BTdelas_Mcz
        </footer>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-3xl p-6 shadow-2xl anim-in">{children}</div>;
}

function TelaCountdown({ tempo }: { tempo: string }) {
  return (
    <Card>
      <div className="text-center">
        <div className="inline-block px-3 py-1 bg-amarelo/30 text-azul font-bold text-xs rounded-full tracking-widest uppercase">
          Em breve
        </div>
        <h2 className="font-display text-2xl font-extrabold text-azul mt-3">
          Inscrições abrem em
        </h2>
        <div className="font-display text-3xl font-extrabold text-laranja mt-3 tabular-nums">
          {tempo || "…"}
        </div>
        <p className="text-azul/70 text-sm mt-3">
          Segunda, 9 de novembro, às 12h (horário de Maceió)
        </p>
        <div className="mt-5 pt-5 border-t border-azul/10 text-left text-sm text-azul/80 space-y-1.5">
          <p>🏆 Torneio em <b>13/12 (domingo) às 15h</b></p>
          <p>🎾 <b>24 vagas</b> na Categoria C</p>
          <p>🎾 <b>16 vagas</b> na Categoria D</p>
          <p>💰 Inscrição <b>R$ 30,00</b></p>
        </div>
      </div>
    </Card>
  );
}

function TelaForm({
  vagas, cat, setCat, nome, setNome, tel, setTel, enviando, erro, onSubmit,
}: any) {
  const lotada = (c: Cat) => vagas && vagas[c] <= 0;
  return (
    <Card>
      <div className="flex gap-2 text-xs mb-5">
        <Chip lotada={lotada("C")} label="Cat. C" valor={vagas?.C} total={24} />
        <Chip lotada={lotada("D")} label="Cat. D" valor={vagas?.D} total={16} />
      </div>

      <Label>Nome completo</Label>
      <Input value={nome} onChange={setNome} placeholder="Seu nome" />

      <Label>WhatsApp</Label>
      <Input value={tel} onChange={setTel} placeholder="(82) 90000-0000" inputMode="tel" />

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
                sel ? "border-laranja bg-laranja/10 text-laranja"
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

      {/* AVISO DAY USE — importante */}
      <div className="mt-4 p-3.5 bg-pink/10 border-l-4 border-pink rounded-xl">
        <p className="text-[11px] font-bold text-pink-500 uppercase tracking-wider mb-1.5">
          💡 Atenção · Day use da arena
        </p>
        <p className="text-xs text-azul/85 leading-relaxed">
          Além da inscrição, há o <b>day use da arena de R$ 10,00</b>
          (valor especial para atletas participantes), pago <b>direto na
          recepção da Top Sports</b> ao chegar para jogar.
        </p>
      </div>

      {/* AVISO DE DESISTÊNCIA */}
      <div className="mt-3 p-3.5 bg-amarelo/15 border-l-4 border-amarelo rounded-xl">
        <p className="text-[11px] font-bold text-azul uppercase tracking-wider mb-1.5">
          ⚠️ Política de desistência
        </p>
        <p className="text-xs text-azul/85 leading-relaxed">
          Em caso de desistência, <b>o valor não é devolvido</b>. Se não houver ninguém na
          lista de espera, a jogadora que desistiu fica <b>responsável por encontrar uma
          substituta</b>. A troca deve ser <b>comunicada à organização</b> para que a nova
          inscrição seja realizada.
        </p>
      </div>

      <p className="text-center text-azul/60 text-[11px] mt-3">
        Inscrição R$ {PIX.valor.toFixed(2).replace(".", ",")} · Confirmada após o pagamento.
      </p>
    </Card>
  );
}

function Confete() {
  // 40 pecinhas caindo, com posições e cores aleatórias mas estáveis
  const cores = ["#FF6A1A", "#2A2A9E", "#FF3D8B", "#F7C948", "#FFFFFF"];
  const pecas = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.2,
        cor: cores[i % cores.length],
        tamanho: 8 + Math.random() * 8,
        rot: Math.random() * 360,
      })),
    []
  );
  return (
    <div className="confete-wrap" aria-hidden="true">
      {pecas.map((p, i) => (
        <span
          key={i}
          className="confete"
          style={{
            left: `${p.left}%`,
            background: p.cor,
            width: `${p.tamanho}px`,
            height: `${p.tamanho * 1.4}px`,
            transform: `rotate(${p.rot}deg)`,
            animationDelay: `${p.delay}s, ${p.delay}s`,
            animationDuration: `${p.duration}s, 1.2s`,
            borderRadius: i % 3 === 0 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

function TelaPix({ cat }: { cat: Cat }) {
  const [copiado, setCopiado] = useState<"chave" | "cola" | null>(null);
  const [mostrarConfete, setMostrarConfete] = useState(true);
  const pixCopiaECola = useMemo(() => gerarPixCopiaECola(PIX), []);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pixCopiaECola)}&margin=0&bgcolor=FFFFFF&color=16166A`;

  // Remove os confetes do DOM após terminar (perf)
  useEffect(() => {
    const t = setTimeout(() => setMostrarConfete(false), 4500);
    return () => clearTimeout(t);
  }, []);

  function copiar(texto: string, qual: "chave" | "cola") {
    navigator.clipboard.writeText(texto);
    setCopiado(qual);
    setTimeout(() => setCopiado(null), 2000);
  }

  return (
    <>
      {mostrarConfete && <Confete />}
      <Card>
        <div className="text-center">
          <div className="text-5xl mb-1">🎉</div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amarelo/30 text-azul font-bold text-xs rounded-full">
            ⏳ Aguardando pagamento
          </div>
          <h2 className="font-display text-2xl font-extrabold text-azul mt-3">
            Vaga reservada!
          </h2>
          <p className="text-azul/80 text-sm mt-2">
            Pague o PIX de <b>R$ {PIX.valor.toFixed(2).replace(".", ",")}</b> na Categoria{" "}
            <b>{cat}</b> para confirmar sua vaga.
          </p>

          {/* 🎁 BRINDE EXCLUSIVO — pagamento em 24h */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amarelo via-amarelo to-laranja border-2 border-amarelo pulse-glow">
            <div className="flex items-center justify-center gap-2 text-azul">
              <span className="text-2xl">🎁</span>
              <div className="text-left">
                <p className="font-display font-extrabold text-sm leading-tight">
                  Brinde exclusivo!
                </p>
                <p className="text-[11px] font-bold leading-tight">
                  Pague em até <b>24h</b> e garanta o seu
                </p>
              </div>
            </div>
            <p className="text-[10px] text-azul/80 font-bold mt-2 pt-2 border-t border-azul/15">
              * Brinde intransferível
            </p>
          </div>

          <div className="mt-5 p-4 bg-white border-2 border-azul/10 rounded-2xl">
            <img src={qrUrl} alt="QR Code PIX" className="mx-auto" width={240} height={240} />
            <p className="text-[11px] text-azul/60 mt-2 font-bold uppercase tracking-wider">
              Escaneie no app do seu banco
            </p>
          </div>

        <button
          onClick={() => copiar(pixCopiaECola, "cola")}
          className="w-full mt-4 bg-azul hover:bg-azul-600 text-white font-bold py-3.5 rounded-xl transition"
        >
          {copiado === "cola" ? "✓ Copiado!" : "📋 Copiar código PIX (copia e cola)"}
        </button>

        <div className="mt-3 p-3 bg-creme rounded-xl">
          <p className="text-[11px] font-bold text-azul/60 uppercase tracking-wider">
            Ou pague pela chave PIX
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 text-xs text-azul font-mono text-left truncate">
              {PIX.chave}
            </code>
            <button
              onClick={() => copiar(PIX.chave, "chave")}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-laranja text-white hover:bg-laranja-600 whitespace-nowrap"
            >
              {copiado === "chave" ? "✓" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="mt-5 p-4 bg-amarelo/10 rounded-2xl text-left border border-amarelo/30">
          <p className="text-xs font-bold text-azul uppercase tracking-wider">
            📲 Após o pagamento
          </p>
          <p className="text-sm text-azul/80 mt-1.5">
            Envie o comprovante pelo WhatsApp pra organização confirmar sua vaga mais rápido.
          </p>
        </div>

        <a
          href="https://wa.me/5582996281922?text=Oi!%20Fiz%20minha%20inscri%C3%A7%C3%A3o%20no%20Super%208%20BT%20Delas%20e%20estou%20enviando%20o%20comprovante%20do%20PIX."
          target="_blank"
          className="block mt-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition"
        >
          📲 Enviar comprovante
        </a>

        <div className="mx-auto mt-4 w-8 h-8 border-2 border-laranja/30 border-t-laranja rounded-full spin" />
        <p className="text-azul/50 text-[11px] mt-2">
          Esta tela atualiza sozinha quando o pagamento for confirmado
        </p>
      </div>
    </Card>
    </>
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
          A <b>Categoria {cat}</b> já está cheia, mas você foi registrada na lista de espera.
          Se abrir vaga, a organização entra em contato pelo seu WhatsApp.
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
          Tudo certo! Nos vemos em <b>13/12 às 15h</b> na Top Sports Academy.
          Fique de olho no WhatsApp — a organização enviará mais detalhes na semana do torneio.
        </p>

        <div className="mt-5 p-3 bg-pink/10 rounded-xl border border-pink/20 text-left">
          <p className="text-xs text-azul/85">
            💡 <b>Lembrete:</b> Não esqueça do <b>day use de R$ 10,00</b> (valor
            especial pra atletas), pago direto na recepção da arena ao chegar.
          </p>
        </div>
      </div>
    </Card>
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
function Chip({ lotada, label, valor, total }: any) {
  return (
    <div
      className={`flex-1 text-center py-1.5 rounded-full border font-bold ${
        lotada ? "bg-pink/10 border-pink/30 text-pink-500"
               : "bg-amarelo/15 border-amarelo/40 text-azul"
      }`}
    >
      {label}: {valor ?? "—"}/{total}
    </div>
  );
}

/* Gerador de PIX "copia e cola" (padrão EMV BACEN) */
function gerarPixCopiaECola(p: { chave: string; nome: string; cidade: string; valor: number }) {
  const fmt = (id: string, val: string) => id + String(val.length).padStart(2, "0") + val;
  const merchantAccount = fmt("00", "br.gov.bcb.pix") + fmt("01", p.chave);
  const payload =
    fmt("00", "01") +
    fmt("26", merchantAccount) +
    fmt("52", "0000") +
    fmt("53", "986") +
    fmt("54", p.valor.toFixed(2)) +
    fmt("58", "BR") +
    fmt("59", p.nome.toUpperCase().slice(0, 25)) +
    fmt("60", p.cidade.toUpperCase().slice(0, 15)) +
    fmt("62", fmt("05", "***")) +
    "6304";
  return payload + crc16(payload);
}
function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
