import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, getPageBySlug, listPages, loginWithGoogle, searchPages } from "./api";
import type { CurrentUser, PageDetails, PageSummary } from "./types";

function App() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageDetails | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Carregando dados...");

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [currentUser, pageList] = await Promise.all([getCurrentUser(), listPages()]);
      setUser(currentUser);
      setPages(pageList);
      setStatus(pageList.length > 0 ? "Paginas carregadas." : "Nenhuma pagina cadastrada.");
    } catch {
      setStatus("Nao foi possivel carregar os dados da wiki.");
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Buscando paginas...");
    try {
      const result = query.trim() ? await searchPages(query.trim()) : await listPages();
      setPages(result);
      setSelectedPage(null);
      setStatus(`${result.length} resultado(s) encontrado(s).`);
    } catch {
      setStatus("Nao foi possivel executar a busca.");
    }
  }

  async function handleSelectPage(slug: string) {
    setStatus("Carregando pagina...");
    try {
      const page = await getPageBySlug(slug);
      setSelectedPage(page);
      setStatus("Pagina carregada.");
    } catch {
      setStatus("Nao foi possivel carregar a pagina.");
    }
  }

  const formattedUpdatedAt = useMemo(() => {
    if (!selectedPage) {
      return null;
    }
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(selectedPage.updatedAt));
  }, [selectedPage]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Wiki Bol</p>
          <h1>Base colaborativa</h1>
        </div>

        <section className="session-box">
          {user ? (
            <>
              <span className="status-pill">{user.role}</span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </>
          ) : (
            <>
              <strong>Visitante</strong>
              <small>Entre para criar, editar e moderar paginas.</small>
              <button type="button" onClick={loginWithGoogle}>
                Entrar com Google
              </button>
            </>
          )}
        </section>

        <form className="search-form" onSubmit={handleSearch}>
          <label htmlFor="search">Buscar</label>
          <div>
            <input
              id="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titulo, slug, keyword ou conteudo"
            />
            <button type="submit">Buscar</button>
          </div>
        </form>

        <section className="page-list" aria-label="Paginas">
          {pages.map((page) => (
            <button key={page.id} type="button" onClick={() => void handleSelectPage(page.slug)}>
              <span>{page.title}</span>
              <small>{page.keywords.join(", ") || "sem keywords"}</small>
            </button>
          ))}
        </section>
      </aside>

      <section className="content-panel">
        <div className="status-line">{status}</div>
        {selectedPage ? (
          <article>
            <div className="page-meta">
              <span>v{selectedPage.currentVersion}</span>
              <span>{formattedUpdatedAt}</span>
              <span>{selectedPage.author.name}</span>
            </div>
            <h2>{selectedPage.title}</h2>
            <div className="keyword-row">
              {selectedPage.keywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
            <pre className="markdown-preview">{selectedPage.content}</pre>
          </article>
        ) : (
          <div className="empty-state">
            <h2>Selecione uma pagina</h2>
            <p>Use a busca ou a lista lateral para carregar o conteudo vindo da API.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
