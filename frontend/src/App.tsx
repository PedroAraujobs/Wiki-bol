import { FormEvent, createContext, useContext, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Edit3,
  Heading1,
  History,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  ApiRequestError,
  type CurrentUser,
  type PageDetails,
  type PageHistoryEntry,
  type PagePayload,
  type PageSummary,
} from "./types";
import {
  createPage,
  deletePage,
  getCurrentUser,
  getGoogleLoginUrl,
  getPageHistory,
  getPageBySlug,
  listPages,
  logout,
  restorePageVersion,
  searchPages,
  updatePage,
  uploadImage,
} from "./api";

type SessionContextValue = {
  user: CurrentUser | null;
};

type EditorMode = "create" | "edit";

type FormState = {
  title: string;
  slug: string;
  content: string;
  keywords: string;
  changeSummary: string;
};

type DiffLine = {
  kind: "added" | "removed" | "unchanged";
  text: string;
};

const KEYWORD_ALIASES: Record<string, string> = {
  manga: "manga",
  mangas: "manga",
  personagem: "personagem",
  personagens: "personagem",
  time: "time",
  times: "time",
  clube: "time",
  clubes: "time",
  equipe: "time",
  equipes: "time",
  partida: "partida",
  partidas: "partida",
  jogo: "partida",
  jogos: "partida",
  autor: "autor",
  autores: "autor",
  mangaka: "autor",
  roteirista: "autor",
  ilustrador: "autor",
  arco: "arco",
  arcos: "arco",
  saga: "arco",
  sagas: "arco",
};

const SessionContext = createContext<SessionContextValue | null>(null);

function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("Session context is not available");
  }

  return context;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError && error.messages.length > 0) {
    return error.messages.join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel concluir a operacao.";
}

function normalizeKeywords(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((keyword) =>
          keyword
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " "),
        )
        .map((keyword) => KEYWORD_ALIASES[keyword] ?? keyword)
        .filter(Boolean),
    ),
  );
}

function normalizeKeywordValue(keyword: string) {
  return normalizeKeywords(keyword)[0] ?? keyword.trim();
}

function keywordHref(keyword: string) {
  return `/pages?keyword=${encodeURIComponent(normalizeKeywordValue(keyword))}`;
}

function diffLines(fromText: string, toText: string): DiffLine[] {
  const fromLines = fromText.split(/\r?\n/);
  const toLines = toText.split(/\r?\n/);
  const lengths = Array.from({ length: fromLines.length + 1 }, () =>
    Array.from({ length: toLines.length + 1 }, () => 0),
  );

  for (let fromIndex = fromLines.length - 1; fromIndex >= 0; fromIndex -= 1) {
    for (let toIndex = toLines.length - 1; toIndex >= 0; toIndex -= 1) {
      lengths[fromIndex][toIndex] =
        fromLines[fromIndex] === toLines[toIndex]
          ? lengths[fromIndex + 1][toIndex + 1] + 1
          : Math.max(lengths[fromIndex + 1][toIndex], lengths[fromIndex][toIndex + 1]);
    }
  }

  const result: DiffLine[] = [];
  let fromIndex = 0;
  let toIndex = 0;

  while (fromIndex < fromLines.length && toIndex < toLines.length) {
    if (fromLines[fromIndex] === toLines[toIndex]) {
      result.push({ kind: "unchanged", text: fromLines[fromIndex] });
      fromIndex += 1;
      toIndex += 1;
    } else if (lengths[fromIndex + 1][toIndex] >= lengths[fromIndex][toIndex + 1]) {
      result.push({ kind: "removed", text: fromLines[fromIndex] });
      fromIndex += 1;
    } else {
      result.push({ kind: "added", text: toLines[toIndex] });
      toIndex += 1;
    }
  }

  while (fromIndex < fromLines.length) {
    result.push({ kind: "removed", text: fromLines[fromIndex] });
    fromIndex += 1;
  }

  while (toIndex < toLines.length) {
    result.push({ kind: "added", text: toLines[toIndex] });
    toIndex += 1;
  }

  return result;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/pages" replace />} />
          <Route path="/pages" element={<PageListPage />} />
          <Route path="/pages/new" element={<PageEditorPage mode="create" />} />
          <Route path="/pages/:slug/history" element={<PageHistoryPage />} />
          <Route path="/pages/:slug" element={<ArticlePage />} />
          <Route path="/pages/:slug/edit" element={<PageEditorPage mode="edit" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function AppLayout() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      try {
        const currentUser = await getCurrentUser();

        if (isActive) {
          setUser(currentUser);
        }
      } catch {
        if (isActive) {
          setSessionError("Nao foi possivel verificar a sessao.");
        }
      } finally {
        if (isActive) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    setSessionError(null);

    try {
      await logout();
      setUser(null);
      navigate("/pages");
    } catch (error) {
      setSessionError(getErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <SessionContext.Provider value={{ user }}>
      <div className="app-frame">
        <aside className="app-sidebar" aria-label="Navegacao principal">
          <div className="brand-block">
            <Link to="/pages" className="brand-link">
              Wiki Bol
            </Link>
            <p>Base editorial sobre mangas de futebol.</p>
          </div>

          <nav className="primary-nav">
            <NavLink to="/pages">Todas as paginas</NavLink>
            <NavLink to="/pages/new">Criar pagina</NavLink>
            <button type="button" disabled>
              Categorias em breve
            </button>
          </nav>
        </aside>

        <div className="app-content">
          <header className="top-session-bar" aria-label="Sessao do usuario">
            <SessionStatus
              user={user}
              isLoadingSession={isLoadingSession}
              sessionError={sessionError}
              isLoggingOut={isLoggingOut}
              onLogout={() => void handleLogout()}
            />
          </header>

          <main className="app-main">
            {isLoadingSession ? <LoadingState label="Carregando wiki..." /> : <Outlet />}
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}

function SessionStatus({
  user,
  isLoadingSession,
  sessionError,
  isLoggingOut,
  onLogout,
}: {
  user: CurrentUser | null;
  isLoadingSession: boolean;
  sessionError: string | null;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="top-session-content">
      {isLoadingSession ? (
        <p className="muted">Verificando sessao...</p>
      ) : user ? (
        <>
          <span className="role-pill">{user.role}</span>
          <div className="session-identity">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button
            type="button"
            className="button secondary-button"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" size={16} />
            Sair
          </button>
        </>
      ) : (
        <>
          <div className="session-identity">
            <strong>Visitante</strong>
            <small>Entre para criar, editar e enviar imagens.</small>
          </div>
          <a className="button primary-button" href={getGoogleLoginUrl()}>
            <LogIn aria-hidden="true" size={16} />
            Entrar com Google
          </a>
        </>
      )}
      {sessionError ? <p className="inline-error session-error">{sessionError}</p> : null}
    </div>
  );
}

function PageListPage() {
  const { user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState(notice ?? "");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword")?.trim() ?? "";
    const searchQuery = params.get("q")?.trim() ?? "";
    const activeQuery = keyword || searchQuery;

    setQuery(activeQuery);
    void loadPages(activeQuery, keyword ? "keyword" : activeQuery ? "search" : "list");
  }, [location.search, notice]);

  async function loadPages(activeQuery = "", mode: "list" | "search" | "keyword" = "list") {
    setStatus("loading");
    try {
      const result = activeQuery ? await searchPages(activeQuery) : await listPages();
      setPages(result);
      setStatus(result.length > 0 ? "ready" : "empty");
      if (mode === "keyword") {
        setMessage(result.length > 0 ? `Paginas com keyword: ${activeQuery}` : "Nenhum resultado encontrado.");
      } else if (mode === "search") {
        setMessage(result.length > 0 ? `${result.length} resultado(s) encontrado(s).` : "Nenhum resultado encontrado.");
      } else {
        setMessage(notice ?? (result.length > 0 ? "Paginas recentes" : "Nenhuma pagina cadastrada."));
      }
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      navigate(`/pages?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      navigate("/pages");
    }
  }

  return (
    <section className="screen-stack">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Catalogo</p>
          <h1>Todas as paginas</h1>
          <p>Busque mangas, personagens, times, partidas, autores e arcos catalogados.</p>
        </div>
        {user ? (
          <Link className="button primary-button" to="/pages/new">
            <Plus aria-hidden="true" size={16} />
            Criar pagina
          </Link>
        ) : null}
      </header>

      <form className="search-panel" onSubmit={handleSearch}>
        <label htmlFor="page-search">Buscar paginas</label>
        <div className="search-row">
          <input
            id="page-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titulo, slug, keyword ou conteudo"
          />
          <button type="submit" className="button primary-button">
            <Search aria-hidden="true" size={16} />
            Buscar
          </button>
        </div>
      </form>

      {status === "loading" ? <LoadingState label="Carregando paginas..." /> : null}
      {status === "error" ? <InlineError message={message} onRetry={() => void loadPages()} /> : null}
      {status === "empty" ? (
        <EmptyState
          title="Nenhuma pagina encontrada"
          description={user ? "Crie a primeira pagina da wiki." : "Entre com Google para criar uma pagina."}
        />
      ) : null}
      {status === "ready" ? (
        <>
          <p className="status-text">{message}</p>
          <div className="result-list" aria-label="Resultados de paginas">
            {pages.map((page) => (
              <PageResult key={page.id} page={page} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function PageResult({ page }: { page: PageSummary }) {
  return (
    <article className="page-result">
      <Link className="result-title" to={`/pages/${page.slug}`}>
        {page.title}
      </Link>
      <span className="result-meta">
        <span>v{page.currentVersion}</span>
        <span>{page.authorName}</span>
        <span>{formatDate(page.updatedAt)}</span>
      </span>
      <KeywordRow keywords={page.keywords} />
    </article>
  );
}

function ArticlePage() {
  const { user } = useSession();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as { page?: PageDetails; notice?: string } | null;
  const statePage = locationState?.page;
  const [page, setPage] = useState<PageDetails | null>(statePage ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">(statePage ? "ready" : "loading");
  const [message, setMessage] = useState(locationState?.notice ?? "");
  const [history, setHistory] = useState<PageHistoryEntry[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!slug || statePage?.slug === slug) {
      return;
    }

    const pageSlug = slug;
    let isActive = true;

    async function loadPage() {
      setStatus("loading");
      try {
        const result = await getPageBySlug(pageSlug);

        if (isActive) {
          setPage(result);
          setStatus("ready");
        }
      } catch (error) {
        if (isActive) {
          if (error instanceof ApiRequestError && error.status === 404) {
            setStatus("not-found");
            setMessage("Pagina nao encontrada.");
          } else {
            setStatus("error");
            setMessage(getErrorMessage(error));
          }
        }
      }
    }

    void loadPage();

    return () => {
      isActive = false;
    };
  }, [slug, statePage]);

  useEffect(() => {
    if (!page?.id) {
      return;
    }

    const pageId = page.id;
    let isActive = true;

    async function loadHistory() {
      try {
        const result = await getPageHistory(pageId);

        if (isActive) {
          setHistory(result);
        }
      } catch {
        if (isActive) {
          setHistory([]);
        }
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [page?.id]);

  const canDelete = Boolean(page && user && (user.role === "ADMIN" || page.author.id === user.id));

  async function handleDelete() {
    if (!page) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePage(page.id);
      setIsDeleteOpen(false);
      setPage(null);
      setStatus("ready");
      setMessage("Pagina deletada.");
      navigate("/pages", { state: { notice: "Pagina deletada." } });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  if (status === "loading") {
    return <LoadingState label="Carregando pagina..." />;
  }

  if (status === "not-found") {
    return <EmptyState title="Pagina nao encontrada" description={message} />;
  }

  if (status === "error" || !page) {
    return <InlineError message={message || "Nao foi possivel carregar a pagina."} />;
  }

  const latestHistory = history[0];

  return (
    <article className="article-layout">
      <header className="article-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/pages">Wiki Bol</Link>
          <span>/</span>
          <span>{page.title}</span>
        </nav>
        <h1>{page.title}</h1>
        <KeywordRow keywords={page.keywords} />
        <div className="article-actions">
          {user ? (
            <Link className="button secondary-button" to={`/pages/${page.slug}/edit`}>
              <Edit3 aria-hidden="true" size={16} />
              Editar pagina
            </Link>
          ) : null}
          <Link className="button secondary-button" to={`/pages/${page.slug}/history`}>
            <History aria-hidden="true" size={16} />
            Historico
          </Link>
          {canDelete ? (
            <button type="button" className="button danger-button" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 aria-hidden="true" size={16} />
              Deletar pagina
            </button>
          ) : null}
        </div>
      </header>

      {message ? <p className="status-text">{message}</p> : null}

      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
      </div>

      <footer className="article-footer-meta" aria-label="Informacoes editoriais">
        <h2>Informacoes editoriais</h2>
        <dl>
          <div>
            <dt>Autor original</dt>
            <dd>{page.author.name}</dd>
          </div>
          <div>
            <dt>Ultima atualizacao</dt>
            <dd>{formatDate(page.updatedAt)}</dd>
          </div>
          {latestHistory?.editedByName ? (
            <div>
              <dt>Ultima edicao</dt>
              <dd>{latestHistory.editedByName}</dd>
            </div>
          ) : null}
          {latestHistory?.changeSummary ? (
            <div>
              <dt>Resumo da ultima alteracao</dt>
              <dd>{latestHistory.changeSummary}</dd>
            </div>
          ) : null}
          <div>
            <dt>Versao atual</dt>
            <dd>v{page.currentVersion}</dd>
          </div>
          <div>
            <dt>Slug permanente</dt>
            <dd>
              <code>{page.slug}</code>
            </dd>
          </div>
        </dl>
      </footer>

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Deletar pagina"
        confirmLabel={isDeleting ? "Deletando..." : "Confirmar delete"}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      >
        Essa acao remove a pagina da listagem publica. O backend mantem a remocao logica e somente autor ou ADMIN pode executar.
      </ConfirmModal>
    </article>
  );
}

function PageHistoryPage() {
  const { user } = useSession();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageDetails | null>(null);
  const [history, setHistory] = useState<PageHistoryEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [message, setMessage] = useState("");
  const [fromVersion, setFromVersion] = useState<number | null>(null);
  const [toVersion, setToVersion] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<PageHistoryEntry | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const pageSlug = slug;
    let isActive = true;

    async function loadHistoryPage() {
      setStatus("loading");
      setMessage("");

      try {
        const loadedPage = await getPageBySlug(pageSlug);
        const loadedHistory = await getPageHistory(loadedPage.id);

        if (isActive) {
          setPage(loadedPage);
          setHistory(loadedHistory);
          setSelectedVersion(loadedHistory[0]?.version ?? null);
          setFromVersion(loadedHistory[1]?.version ?? null);
          setToVersion(loadedHistory[0]?.version ?? null);
          setStatus("ready");
        }
      } catch (error) {
        if (isActive) {
          if (error instanceof ApiRequestError && error.status === 404) {
            setStatus("not-found");
            setMessage("Pagina nao encontrada.");
          } else {
            setStatus("error");
            setMessage(getErrorMessage(error));
          }
        }
      }
    }

    void loadHistoryPage();

    return () => {
      isActive = false;
    };
  }, [slug]);

  if (status === "loading") {
    return <LoadingState label="Carregando historico..." />;
  }

  if (status === "not-found") {
    return <EmptyState title="Pagina nao encontrada" description={message} />;
  }

  if (status === "error" || !page) {
    return <InlineError message={message || "Nao foi possivel carregar o historico."} />;
  }

  const selectedEntry = history.find((entry) => entry.version === selectedVersion) ?? history[0] ?? null;
  const fromEntry = history.find((entry) => entry.version === fromVersion) ?? null;
  const toEntry = history.find((entry) => entry.version === toVersion) ?? null;
  const selectedIsCurrentVersion = selectedEntry?.version === page.currentVersion;
  const canRestore = Boolean(
    selectedEntry && !selectedIsCurrentVersion && user && (user.role === "ADMIN" || page.author.id === user.id),
  );

  async function handleRestore() {
    if (!page || !restoreTarget) {
      return;
    }

    setIsRestoring(true);
    setMessage("");

    try {
      const restoredPage = await restorePageVersion(page.id, restoreTarget.version);
      navigate(`/pages/${restoredPage.slug}`, {
        state: {
          page: restoredPage,
          notice: `Versao restaurada a partir da v${restoreTarget.version}.`,
        },
      });
    } catch (error) {
      setRestoreTarget(null);
      setMessage(getErrorMessage(error));
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <section className="screen-stack history-screen">
      <header className="screen-header">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/pages">Wiki Bol</Link>
            <span>/</span>
            <Link to={`/pages/${page.slug}`}>{page.title}</Link>
            <span>/</span>
            <span>Historico</span>
          </nav>
          <p className="eyebrow">Auditoria editorial</p>
          <h1>Historico de {page.title}</h1>
          <p>Compare versoes, revise alteracoes e restaure snapshots quando necessario.</p>
        </div>
      </header>

      {message ? <p className="inline-error">{message}</p> : null}

      {history.length === 0 ? (
        <EmptyState title="Historico vazio" description="Esta pagina ainda nao tem snapshots registrados." />
      ) : (
        <div className="history-layout">
          <aside className="history-list" aria-label="Versoes da pagina">
            <h2>Versoes</h2>
            {history.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={entry.version === selectedEntry?.version ? "history-version active" : "history-version"}
                onClick={() => setSelectedVersion(entry.version)}
              >
                <strong>
                  v{entry.version} {entry.changeSummary || "Alteracao registrada"}
                </strong>
                <span>{entry.editedByName}</span>
                <span>{formatDate(entry.createdAt)}</span>
              </button>
            ))}
          </aside>

          <div className="history-main">
            <section className="history-panel">
              <div className="history-panel-header">
                <div>
                  <p className="eyebrow">Comparacao</p>
                  <h2>Comparacao visual</h2>
                </div>
                {history.length > 1 ? (
                  <div className="compare-controls">
                    <label>
                      Comparar de
                      <select
                        value={fromVersion ?? ""}
                        onChange={(event) => setFromVersion(Number(event.target.value))}
                      >
                        {history.map((entry) => (
                          <option value={entry.version} key={entry.id}>
                            v{entry.version}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Comparar com
                      <select value={toVersion ?? ""} onChange={(event) => setToVersion(Number(event.target.value))}>
                        {history.map((entry) => (
                          <option value={entry.version} key={entry.id}>
                            v{entry.version}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>

              {history.length < 2 || !fromEntry || !toEntry ? (
                <p className="status-text">E necessario ter ao menos duas versoes para comparar alteracoes.</p>
              ) : (
                <VersionComparison fromEntry={fromEntry} toEntry={toEntry} />
              )}
            </section>

            {selectedEntry ? (
              <section className="history-panel">
                <div className="history-panel-header">
                  <div>
                    <p className="eyebrow">Snapshot</p>
                    <h2>Preview da versao v{selectedEntry.version}</h2>
                  </div>
                  {canRestore ? (
                    <button
                      type="button"
                      className="button danger-button"
                      onClick={() => setRestoreTarget(selectedEntry)}
                    >
                      <RotateCcw aria-hidden="true" size={16} />
                      Restaurar versao v{selectedEntry.version}
                    </button>
                  ) : selectedIsCurrentVersion ? (
                    <span className="current-version-pill">Versao atual</span>
                  ) : null}
                </div>
                <div className="snapshot-meta">
                  <span>{selectedEntry.editedByName}</span>
                  <span>{formatDate(selectedEntry.createdAt)}</span>
                  {selectedEntry.changeSummary ? <span>{selectedEntry.changeSummary}</span> : null}
                </div>
                <h3>{selectedEntry.title}</h3>
                <KeywordRow keywords={selectedEntry.keywords} />
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedEntry.content}</ReactMarkdown>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(restoreTarget)}
        title="Restaurar versao"
        confirmLabel={isRestoring ? "Restaurando..." : "Confirmar restore"}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={() => void handleRestore()}
      >
        Uma nova versao sera criada usando o conteudo, titulo e keywords da v{restoreTarget?.version}.
      </ConfirmModal>
    </section>
  );
}

function VersionComparison({ fromEntry, toEntry }: { fromEntry: PageHistoryEntry; toEntry: PageHistoryEntry }) {
  const addedKeywords = toEntry.keywords.filter((keyword) => !fromEntry.keywords.includes(keyword));
  const removedKeywords = fromEntry.keywords.filter((keyword) => !toEntry.keywords.includes(keyword));
  const contentDiff = diffLines(fromEntry.content, toEntry.content);

  return (
    <div className="diff-stack">
      {fromEntry.title !== toEntry.title ? (
        <section className="diff-meta-block">
          <h3>Titulo alterado</h3>
          <div className="diff-meta-values">
            <span className="diff-token removed">{fromEntry.title}</span>
            <span className="diff-token added">{toEntry.title}</span>
          </div>
        </section>
      ) : null}

      {addedKeywords.length > 0 || removedKeywords.length > 0 ? (
        <section className="diff-meta-block">
          <h3>Keywords alteradas</h3>
          <div className="diff-meta-values">
            {removedKeywords.map((keyword) => (
              <span className="diff-token removed" key={`removed-${keyword}`}>
                {keyword}
              </span>
            ))}
            {addedKeywords.map((keyword) => (
              <span className="diff-token added" key={`added-${keyword}`}>
                {keyword}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="diff-content" aria-label="Diferencas do conteudo">
        {contentDiff.map((line, index) => (
          <pre className={`diff-line diff-line-${line.kind}`} key={`${line.kind}-${index}-${line.text}`}>
            <span aria-hidden="true">{line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "}</span>
            {line.text || " "}
          </pre>
        ))}
      </section>
    </div>
  );
}

function PageEditorPage({ mode }: { mode: EditorMode }) {
  const { user } = useSession();
  const { slug } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [existingPage, setExistingPage] = useState<PageDetails | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    content: "",
    keywords: "",
    changeSummary: "",
  });
  const [editorView, setEditorView] = useState<"editor" | "preview">("editor");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">(
    mode === "edit" ? "loading" : "idle",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !slug) {
      return;
    }

    const pageSlug = slug;
    let isActive = true;

    async function loadPage() {
      setStatus("loading");
      try {
        const page = await getPageBySlug(pageSlug);

        if (isActive) {
          setExistingPage(page);
          setForm({
            title: page.title,
            slug: page.slug,
            content: page.content,
            keywords: page.keywords.join(", "),
            changeSummary: "",
          });
          setStatus("idle");
        }
      } catch (error) {
        if (isActive) {
          setStatus("error");
          setMessage(getErrorMessage(error));
        }
      }
    }

    void loadPage();

    return () => {
      isActive = false;
    };
  }, [mode, slug]);

  if (!user) {
    return (
      <EmptyState
        title="Login necessario"
        description="Entre com Google para criar, editar e enviar imagens."
        action={
          <a className="button primary-button" href={getGoogleLoginUrl()}>
            Entrar com Google
          </a>
        }
      />
    );
  }

  if (status === "loading") {
    return <LoadingState label="Carregando formulario..." />;
  }

  if (status === "error") {
    return <InlineError message={message} />;
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function buildPayload(): PagePayload {
    return {
      title: form.title.trim(),
      content: form.content.trim(),
      keywords: normalizeKeywords(form.keywords),
      changeSummary: form.changeSummary.trim() || (mode === "create" ? "Criacao da pagina" : "Edicao da pagina"),
    };
  }

  function insertContentAtCursor(insertedText: string) {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? form.content.length;
    const nextContent = `${form.content.slice(0, start)}${insertedText}${form.content.slice(end)}`;
    const nextCursor = start + insertedText.length;

    setForm((current) => ({
      ...current,
      content: nextContent,
    }));

    window.setTimeout(() => {
      textarea?.focus();
      textarea?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  }

  function applyMarkdownWrap(prefix: string, suffix: string, placeholder: string) {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? form.content.length;
    const selectedText = form.content.slice(start, end) || placeholder;
    insertContentAtCursor(`${prefix}${selectedText}${suffix}`);
  }

  function applyMarkdownLine(prefix: string, placeholder: string) {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? form.content.length;
    const selectedText = form.content.slice(start, end) || placeholder;
    insertContentAtCursor(`${prefix}${selectedText}`);
  }

  function handleLinkInsert() {
    const text = window.prompt("Texto do link", "Site oficial");
    if (!text) {
      return;
    }

    const url = window.prompt("URL do link", "https://");
    if (!url) {
      return;
    }

    insertContentAtCursor(`[${text}](${url})`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setMessage("Titulo e conteudo sao obrigatorios.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const payload = buildPayload();
      const savedPage =
        mode === "create"
          ? await createPage(payload)
          : await updatePage(existingPage?.id ?? "", payload);

      navigate(`/pages/${savedPage.slug}`, { state: { page: savedPage } });
    } catch (error) {
      setMessage(getErrorMessage(error));
      setStatus("idle");
    }
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    setMessage("Enviando imagem...");
    try {
      const image = await uploadImage(file, file.name.replace(/\.[^.]+$/, ""), existingPage?.id);
      insertContentAtCursor(`${image.markdown}\n`);
      setMessage("Imagem inserida no editor.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <section className="screen-stack">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{mode === "create" ? "Nova pagina" : "Edicao colaborativa"}</p>
          <h1>{mode === "create" ? "Criar pagina" : "Editar pagina"}</h1>
          <p>
            Escreva em Markdown, mantenha keywords objetivas e registre um resumo claro para o historico.
          </p>
        </div>
      </header>

      {message ? <p className={message.includes("obrigatorios") ? "inline-error" : "status-text"}>{message}</p> : null}

      <form className="editor-grid" onSubmit={(event) => void handleSubmit(event)}>
        <div className="editor-tabs" role="tablist" aria-label="Modo do editor">
          <button
            type="button"
            className={editorView === "editor" ? "editor-tab active" : "editor-tab"}
            onClick={() => setEditorView("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            className={editorView === "preview" ? "editor-tab active" : "editor-tab"}
            onClick={() => setEditorView("preview")}
          >
            Preview
          </button>
        </div>

        <section className={editorView === "preview" ? "editor-main editor-pane-hidden-mobile" : "editor-main"} aria-label="Editor">
          <label>
            Titulo
            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </label>

          {mode === "edit" ? (
            <label>
              Slug permanente
              <input value={form.slug} disabled />
            </label>
          ) : null}

          <div className="content-editor-field">
            <label htmlFor="page-content">Conteudo</label>
            <div className="markdown-toolbar" role="toolbar" aria-label="Ferramentas Markdown">
              <button type="button" className="toolbar-button" onClick={() => applyMarkdownWrap("**", "**", "texto")}>
                <Bold aria-hidden="true" size={16} />
                Negrito
              </button>
              <button type="button" className="toolbar-button" onClick={() => applyMarkdownWrap("*", "*", "texto")}>
                <Italic aria-hidden="true" size={16} />
                Italico
              </button>
              <button type="button" className="toolbar-button" onClick={() => applyMarkdownLine("# ", "Titulo")}>
                <Heading1 aria-hidden="true" size={16} />
                Titulo
              </button>
              <button type="button" className="toolbar-button" onClick={() => applyMarkdownLine("- ", "Item")}>
                <List aria-hidden="true" size={16} />
                Lista
              </button>
              <button type="button" className="toolbar-button" onClick={handleLinkInsert}>
                <LinkIcon aria-hidden="true" size={16} />
                Link
              </button>
            </div>
            <textarea
              id="page-content"
              ref={contentRef}
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={16}
              placeholder="# Titulo da secao"
            />
          </div>

          <label className="file-action">
            <ImagePlus aria-hidden="true" size={16} />
            Enviar imagem
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => void handleImageUpload(event.currentTarget.files?.[0])}
            />
          </label>
        </section>

        <aside className="editor-side">
          <label>
            Keywords
            <input
              value={form.keywords}
              onChange={(event) => updateField("keywords", event.target.value)}
              placeholder="manga, futebol, personagem"
            />
          </label>

          {mode === "edit" ? (
            <label>
              Resumo da alteracao
              <textarea
                value={form.changeSummary}
                onChange={(event) => updateField("changeSummary", event.target.value)}
                rows={4}
                placeholder="Explique o que mudou"
              />
            </label>
          ) : null}

          <button type="submit" className="button primary-button" disabled={status === "saving"}>
            <Save aria-hidden="true" size={16} />
            {mode === "create" ? "Salvar pagina" : "Salvar alteracoes"}
          </button>
        </aside>

        <section className={editorView === "editor" ? "preview-panel preview-pane-hidden-mobile" : "preview-panel"} aria-label="Preview do Markdown">
          <p className="eyebrow">Preview</p>
          <h2>Preview do artigo</h2>
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || "Preencha o conteudo para visualizar."}</ReactMarkdown>
          </div>
        </section>
      </form>
    </section>
  );
}

function KeywordRow({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) {
    return <span className="keyword-chip">sem keywords</span>;
  }

  return (
    <div className="keyword-row">
      {keywords.map((keyword) => (
        <Link className="keyword-chip" key={keyword} to={keywordHref(keyword)}>
          {keyword}
        </Link>
      ))}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <p className="loading-state">{label}</p>;
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="empty-state">
      <h1>{title}</h1>
      <p>{description}</p>
      {action}
    </section>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <section className="error-state" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button secondary-button" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
}

function ConfirmModal({
  isOpen,
  title,
  children,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <p>{children}</p>
        <div className="modal-actions">
          <button type="button" className="button secondary-button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="button danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return <EmptyState title="Tela nao encontrada" description="Volte para a listagem para continuar navegando." />;
}

export default App;
