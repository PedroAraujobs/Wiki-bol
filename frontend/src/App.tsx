import { FormEvent, createContext, useContext, useEffect, useState } from "react";
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
import { Edit3, ImagePlus, LogIn, LogOut, Plus, Save, Search, Trash2 } from "lucide-react";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/pages" replace />} />
          <Route path="/pages" element={<PageListPage />} />
          <Route path="/pages/new" element={<PageEditorPage mode="create" />} />
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
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState(notice ?? "");

  useEffect(() => {
    void loadPages();
  }, [notice]);

  async function loadPages() {
    setStatus("loading");
    try {
      const result = await listPages();
      setPages(result);
      setStatus(result.length > 0 ? "ready" : "empty");
      setMessage(notice ?? (result.length > 0 ? "Paginas recentes" : "Nenhuma pagina cadastrada."));
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const trimmedQuery = query.trim();
      const result = trimmedQuery ? await searchPages(trimmedQuery) : await listPages();
      setPages(result);
      setStatus(result.length > 0 ? "ready" : "empty");
      setMessage(result.length > 0 ? `${result.length} resultado(s) encontrado(s).` : "Nenhum resultado encontrado.");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
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
    <Link className="page-result" to={`/pages/${page.slug}`}>
      <span className="result-title">{page.title}</span>
      <span className="result-meta">
        <span>v{page.currentVersion}</span>
        <span>{page.authorName}</span>
        <span>{formatDate(page.updatedAt)}</span>
      </span>
      <KeywordRow keywords={page.keywords} />
    </Link>
  );
}

function ArticlePage() {
  const { user } = useSession();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const statePage = (location.state as { page?: PageDetails } | null)?.page;
  const [page, setPage] = useState<PageDetails | null>(statePage ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">(statePage ? "ready" : "loading");
  const [message, setMessage] = useState("");
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
          <button type="button" className="button secondary-button" disabled>
            Historico em breve
          </button>
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

function PageEditorPage({ mode }: { mode: EditorMode }) {
  const { user } = useSession();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [existingPage, setExistingPage] = useState<PageDetails | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    content: "",
    keywords: "",
    changeSummary: "",
  });
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
      setForm((current) => ({
        ...current,
        content: current.content ? `${current.content}\n\n${image.markdown}` : image.markdown,
      }));
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
        <section className="editor-main" aria-label="Editor">
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

          <label>
            Conteudo
            <textarea
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={16}
              placeholder="# Titulo da secao"
            />
          </label>

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

        <section className="preview-panel" aria-label="Preview do Markdown">
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
        <span className="keyword-chip" key={keyword}>
          {keyword}
        </span>
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
