"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { TORNEIO, TEMPLATE } from "@/lib/torneio";

type Insc = {
  id: string; nome: string; telefone: string | null; email: string | null;
  categoria: "C" | "D"; status: "pendente" | "pago" | "espera"; created_at: string;
};
type GrupoJog = { id: string; nome: string };
type Grupos = { C: GrupoJog[][]; D: GrupoJog[][] };

export default function Painel() {
  const [logado, setLogado] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLogado(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function entrar() {
    setErroLogin("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErroLogin(error.message);
  }

  if (logado === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme">
        <div className="w-10 h-10 border-4 border-laranja/30 border-t-laranja rounded-full spin" />
      </div>
    );
  }

  if (!logado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-laranja p-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-4">
            <Image src="/bt-delas-logo.png" alt="BT Delas" width={140} height={140} priority className="drop-shadow-2xl" />
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h1 className="font-display text-2xl font-extrabold text-azul text-center">
              Painel da Organização
            </h1>
            <p className="text-azul/60 text-sm mt-1 text-center">BT Delas · Super 8</p>
            <div className="mt-6 space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full px-4 py-3 bg-creme border-2 border-azul/10 rounded-xl focus:outline-none focus:border-laranja"
              />
              <input
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                type="password"
                placeholder="Senha"
                className="w-full px-4 py-3 bg-creme border-2 border-azul/10 rounded-xl focus:outline-none focus:border-laranja"
              />
              {erroLogin && <p className="text-pink-500 text-sm">{erroLogin}</p>}
              <button
                onClick={entrar}
                className="w-full bg-laranja hover:bg-laranja-600 text-white font-bold py-3 rounded-xl transition"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <PainelConteudo />;
}

function PainelConteudo() {
  const [tab, setTab] = useState<"part" | "grupos" | "jogos">("part");
  const [inscricoes, setInscricoes] = useState<Insc[]>([]);
  const [grupos, setGrupos] = useState<Grupos>({ C: [], D: [] });
  const [results, setResults] = useState<Record<string, number>>({});
  const [filtro, setFiltro] = useState<string>("all");
  const [toast, setToast] = useState("");

  async function carregar() {
    const { data: ins } = await supabase.from("inscricoes").select("*").order("created_at");
    setInscricoes((ins as Insc[]) || []);
    const { data: est } = await supabase.from("estado").select("*");
    let g: Grupos = { C: [], D: [] };
    let r: Record<string, number> = {};
    (est || []).forEach((e: any) => {
      if (e.chave === "grupos") g = e.valor;
      if (e.chave === "resultados") r = e.valor;
    });
    setGrupos(g); setResults(r);
  }

  useEffect(() => {
    carregar();
    const ch = supabase.channel("rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "inscricoes" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "estado" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  function mostrarToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  async function mudarStatus(id: string, status: Insc["status"]) {
    const { error } = await supabase.from("inscricoes").update({ status }).eq("id", id);
    if (error) return mostrarToast("Erro: " + error.message);
    mostrarToast("Atualizado!");
  }

  async function remover(id: string, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return;
    const { error } = await supabase.from("inscricoes").delete().eq("id", id);
    if (error) return mostrarToast("Erro: " + error.message);
    mostrarToast("Removida");
  }

  function shuffle<T>(a: T[]): T[] {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  async function sortear(cat: "C" | "D") {
    const elig = shuffle(
      inscricoes.filter((p) => p.categoria === cat && p.status === "pago")
        .map((p) => ({ id: p.id, nome: p.nome }))
    );
    if (elig.length < 2) return mostrarToast(`Cat. ${cat}: poucas jogadoras pagas.`);
    const g: GrupoJog[][] = [];
    for (let i = 0; i < elig.length; i += TORNEIO.tamGrupo) {
      g.push(elig.slice(i, i + TORNEIO.tamGrupo));
    }
    const novos = { ...grupos, [cat]: g };
    const { error } = await supabase.from("estado").upsert({
      chave: "grupos", valor: novos, updated_at: new Date().toISOString(),
    });
    if (error) return mostrarToast("Erro: " + error.message);
    mostrarToast(`Cat. ${cat}: ${g.length} grupo(s) sorteado(s)!`);
  }

  async function limparGrupos() {
    if (!confirm("Limpar grupos e resultados?")) return;
    await supabase.from("estado").upsert({ chave: "grupos", valor: { C: [], D: [] }, updated_at: new Date().toISOString() });
    await supabase.from("estado").upsert({ chave: "resultados", valor: {}, updated_at: new Date().toISOString() });
    mostrarToast("Limpado.");
  }

  async function salvarScore(cat: "C" | "D", gi: number, ri: number, mi: number, val: string) {
    const k = `${cat}-${gi}-${ri}-${mi}`;
    const novo = { ...results };
    if (val === "") delete novo[k];
    else novo[k] = parseInt(val, 10);
    await supabase.from("estado").upsert({ chave: "resultados", valor: novo, updated_at: new Date().toISOString() });
    setResults(novo);
  }

  function computeStandings(cat: "C" | "D", gi: number) {
    const g = grupos[cat][gi]; if (!g) return [];
    const st: Record<string, any> = {};
    g.forEach((j) => (st[j.id] = { id: j.id, nome: j.nome, pro: 0, con: 0, v: 0, e: 0, d: 0 }));
    TEMPLATE.forEach((round, ri) =>
      round.forEach((match, mi) => {
        const [A, B] = match;
        const ai = A.map((p) => g[p - 1]);
        const bi = B.map((p) => g[p - 1]);
        if (ai.includes(undefined as any) || bi.includes(undefined as any)) return;
        const raw = results[`${cat}-${gi}-${ri}-${mi}`];
        if (raw === undefined || raw === null) return;
        const a = raw, b = 6 - raw;
        ai.forEach((j) => {
          const s = st[j.id];
          s.pro += a; s.con += b;
          if (a > b) s.v++; else if (a < b) s.d++; else s.e++;
        });
        bi.forEach((j) => {
          const s = st[j.id];
          s.pro += b; s.con += a;
          if (b > a) s.v++; else if (b < a) s.d++; else s.e++;
        });
      })
    );
    return Object.values(st).sort((x: any, y: any) =>
      y.pro - x.pro || (y.pro - y.con) - (x.pro - x.con) || y.v - x.v
    );
  }

  const stats = {
    C: {
      ativas: inscricoes.filter((p) => p.categoria === "C" && p.status !== "espera").length,
      pagas: inscricoes.filter((p) => p.categoria === "C" && p.status === "pago").length,
      espera: inscricoes.filter((p) => p.categoria === "C" && p.status === "espera").length,
    },
    D: {
      ativas: inscricoes.filter((p) => p.categoria === "D" && p.status !== "espera").length,
      pagas: inscricoes.filter((p) => p.categoria === "D" && p.status === "pago").length,
      espera: inscricoes.filter((p) => p.categoria === "D" && p.status === "espera").length,
    },
  };

  const lista = inscricoes.filter((p) => {
    if (filtro === "all") return true;
    if (filtro === "C" || filtro === "D") return p.categoria === filtro;
    return p.status === filtro;
  });

  return (
    <div className="min-h-screen bg-creme">
      <header className="bg-laranja text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/bt-delas-logo.png" alt="BT Delas" width={56} height={56} priority />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                Painel · BT Delas
              </div>
              <h1 className="font-display text-2xl font-extrabold">Super 8</h1>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-white/15 hover:bg-white/25 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat titulo="Cat. C · ativas" valor={`${stats.C.ativas}/24`} sub={`${stats.C.pagas} pagas`} />
          <Stat titulo="Cat. C · espera" valor={`${stats.C.espera}`} />
          <Stat titulo="Cat. D · ativas" valor={`${stats.D.ativas}/16`} sub={`${stats.D.pagas} pagas`} />
          <Stat titulo="Cat. D · espera" valor={`${stats.D.espera}`} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 flex gap-2 overflow-x-auto">
        {[
          { k: "part", l: "Participantes" },
          { k: "grupos", l: "Grupos" },
          { k: "jogos", l: "Jogos & Ranking" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition ${
              tab === t.k ? "bg-azul text-white"
                          : "bg-white text-azul/70 border-2 border-azul/10 hover:border-laranja/40"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === "part" && (
          <div className="bg-white rounded-3xl p-5 shadow-lg">
            <div className="flex gap-2 flex-wrap mb-4">
              {[
                ["all", "Todas"], ["C", "Cat. C"], ["D", "Cat. D"],
                ["pago", "Pagas"], ["pendente", "Pendentes"], ["espera", "Espera"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setFiltro(k)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
                    filtro === k ? "bg-laranja text-white border-laranja"
                                 : "bg-white text-azul/70 border-azul/10"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {lista.length === 0 ? (
              <p className="text-center py-10 text-azul/60 text-sm">Nenhuma inscrição.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase text-azul/60 border-b border-azul/10">
                      <th className="text-left py-2 px-1">#</th>
                      <th className="text-left py-2 px-1">Nome</th>
                      <th className="text-left py-2 px-1">WhatsApp</th>
                      <th className="text-left py-2 px-1">Cat.</th>
                      <th className="text-left py-2 px-1">Status</th>
                      <th className="text-left py-2 px-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((p, i) => (
                      <tr key={p.id} className="border-b border-azul/5">
                        <td className="py-3 px-1 text-azul/50">{i + 1}</td>
                        <td className="py-3 px-1 font-bold text-azul">{p.nome}</td>
                        <td className="py-3 px-1 text-azul/70">{p.telefone || "—"}</td>
                        <td className="py-3 px-1 font-display font-extrabold text-laranja">
                          {p.categoria}
                        </td>
                        <td className="py-3 px-1"><StatusPill status={p.status} /></td>
                        <td className="py-3 px-1">
                          <div className="flex gap-1.5 flex-wrap">
                            {p.status !== "pago" && (
                              <button onClick={() => mudarStatus(p.id, "pago")}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-laranja text-white hover:bg-laranja-600">
                                ✓ Confirmar
                              </button>
                            )}
                            {p.status === "pago" && (
                              <button onClick={() => mudarStatus(p.id, "pendente")}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border-2 border-azul/15 text-azul/70">
                                ↩ Reverter
                              </button>
                            )}
                            {p.status === "espera" && (
                              <button onClick={() => mudarStatus(p.id, "pendente")}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border-2 border-azul/15 text-azul/70">
                                ↑ Promover
                              </button>
                            )}
                            <button onClick={() => remover(p.id, p.nome)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border-2 border-pink/20 text-pink-500">
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "grupos" && (
          <div className="bg-white rounded-3xl p-5 shadow-lg">
            <h2 className="font-display text-2xl font-extrabold text-azul">Sorteio dos grupos</h2>
            <p className="text-sm text-azul/70 mt-1">
              Monta grupos de 8 apenas com jogadoras de vaga <b>paga</b>.
            </p>
            <div className="flex gap-2 flex-wrap mt-4">
              <button onClick={() => sortear("C")}
                className="bg-azul hover:bg-azul-600 text-white font-bold px-5 py-3 rounded-xl">
                🎲 Sortear Categoria C
              </button>
              <button onClick={() => sortear("D")}
                className="bg-azul hover:bg-azul-600 text-white font-bold px-5 py-3 rounded-xl">
                🎲 Sortear Categoria D
              </button>
              <button onClick={limparGrupos}
                className="bg-white border-2 border-azul/15 text-azul font-bold px-5 py-3 rounded-xl">
                Limpar tudo
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {(["C", "D"] as const).map((cat) =>
                grupos[cat]?.length ? (
                  <div key={cat}>
                    <h3 className="font-display text-lg font-extrabold text-laranja mb-3">
                      Categoria {cat}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {grupos[cat].map((g, gi) => (
                        <div key={gi} className="border-2 border-azul/10 rounded-2xl overflow-hidden">
                          <div className="bg-azul text-white px-4 py-2.5 flex justify-between">
                            <span className="font-display font-extrabold">Grupo {gi + 1}</span>
                            <span className="text-xs opacity-80">{g.length} jogadoras</span>
                          </div>
                          <ol className="p-4 space-y-1.5 text-sm">
                            {g.map((j, i) => (
                              <li key={j.id} className="text-azul">
                                <span className="font-bold text-azul/40 mr-2">{i + 1}.</span>
                                {j.nome}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
              {!grupos.C.length && !grupos.D.length && (
                <p className="text-center text-azul/60 text-sm py-10">
                  Nenhum grupo sorteado ainda.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "jogos" && (
          <div className="space-y-6">
            {(["C", "D"] as const).map((cat) =>
              grupos[cat]?.length ? (
                <div key={cat}>
                  <h2 className="font-display text-2xl font-extrabold text-laranja mb-3">
                    Categoria {cat}
                  </h2>
                  <div className="space-y-5">
                    {grupos[cat].map((g, gi) => (
                      <div key={gi} className="bg-white rounded-3xl p-5 shadow-lg">
                        <h3 className="font-display text-xl font-extrabold text-azul mb-3">
                          Grupo {gi + 1}
                        </h3>
                        {TEMPLATE.map((round, ri) => (
                          <div key={ri} className="mt-3">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-laranja mb-1.5">
                              Rodada {ri + 1}
                            </div>
                            {round.map((match, mi) => {
                              const [A, B] = match;
                              const an = A.map((p) => g[p - 1]?.nome ?? "—");
                              const bn = B.map((p) => g[p - 1]?.nome ?? "—");
                              const valid =
                                !A.map((p) => g[p - 1]).includes(undefined as any) &&
                                !B.map((p) => g[p - 1]).includes(undefined as any);
                              const raw = results[`${cat}-${gi}-${ri}-${mi}`];
                              const cur = raw === undefined || raw === null ? "" : String(raw);
                              return (
                                <div key={mi} className="flex items-center gap-2 py-2 border-b border-azul/5 text-sm flex-wrap">
                                  <div className="flex-1 min-w-[120px] text-azul">
                                    {an[0]} <span className="text-azul/40">/</span> {an[1]}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {valid ? (
                                      <select value={cur}
                                        onChange={(e) => salvarScore(cat, gi, ri, mi, e.target.value)}
                                        className="w-14 px-2 py-1 border-2 border-azul/15 rounded-lg font-bold text-center">
                                        <option value="">–</option>
                                        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                                          <option key={n} value={n}>{n}</option>
                                        ))}
                                      </select>
                                    ) : (<span className="text-azul/40">—</span>)}
                                    <span className="font-bold text-azul/50">×</span>
                                    <span className="w-6 text-center font-bold text-azul">
                                      {cur === "" ? "–" : 6 - Number(cur)}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-[120px] text-right text-azul">
                                    {bn[0]} <span className="text-azul/40">/</span> {bn[1]}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        <div className="mt-5">
                          <div className="text-[11px] font-bold uppercase tracking-widest text-pink-500 mb-2">
                            Classificação · Grupo {gi + 1}
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[10px] uppercase text-azul/60 border-b border-azul/10">
                                <th className="text-left py-2">#</th>
                                <th className="text-left py-2">Jogadora</th>
                                <th className="py-2">V</th><th className="py-2">E</th><th className="py-2">D</th>
                                <th className="py-2">Pró</th><th className="py-2">Con</th><th className="py-2">Saldo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {computeStandings(cat, gi).map((s: any, i: number) => (
                                <tr key={s.id} className={`border-b border-azul/5 ${i === 0 ? "bg-amarelo/10" : ""}`}>
                                  <td className="py-2 font-display font-extrabold text-azul">{i + 1}º</td>
                                  <td className="py-2 font-bold text-azul">{s.nome}</td>
                                  <td className="py-2 text-center">{s.v}</td>
                                  <td className="py-2 text-center">{s.e}</td>
                                  <td className="py-2 text-center">{s.d}</td>
                                  <td className="py-2 text-center font-bold text-laranja">{s.pro}</td>
                                  <td className="py-2 text-center">{s.con}</td>
                                  <td className="py-2 text-center">
                                    {s.pro - s.con > 0 ? "+" : ""}{s.pro - s.con}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
            {!grupos.C.length && !grupos.D.length && (
              <div className="bg-white rounded-3xl p-10 text-center text-azul/60 text-sm">
                Sorteie os grupos na aba <b>Grupos</b> para liberar os jogos.
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-azul text-white px-5 py-3 rounded-full font-bold text-sm shadow-xl anim-in">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ titulo, valor, sub }: { titulo: string; valor: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-azul/5">
      <div className="font-display text-2xl font-extrabold text-azul">{valor}</div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-azul/60 mt-1">{titulo}</div>
      {sub && <div className="text-xs text-laranja font-bold mt-1">{sub}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: Insc["status"] }) {
  const map = {
    pago: "bg-emerald-500/15 text-emerald-700",
    pendente: "bg-amarelo/25 text-azul",
    espera: "bg-azul/10 text-azul/60",
  };
  const label = { pago: "✓ Paga", pendente: "⏳ Aguardando", espera: "📋 Espera" };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${map[status]}`}>
      {label[status]}
    </span>
  );
}
