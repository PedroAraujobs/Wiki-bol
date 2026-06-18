import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CurrentUser, PageDetails, PageHistoryEntry, PageSummary } from "./types";

const API_BASE_URL = "http://localhost:8080";

const visitorResponse = {
  status: 401,
  body: {
    timestamp: "2026-06-11T10:00:00",
    status: 401,
    error: "Unauthorized",
    messages: ["Autenticacao obrigatoria."],
  },
};

const user: CurrentUser = {
  id: "user-1",
  name: "Pedro Araujo",
  email: "pedro@example.com",
  provider: "GOOGLE",
  role: "USER",
  avatarUrl: null,
  createdAt: "2026-06-09T19:08:25",
};

const admin: CurrentUser = {
  ...user,
  id: "admin-1",
  name: "Admin Wiki",
  email: "admin@example.com",
  role: "ADMIN",
};

const summaries: PageSummary[] = [
  {
    id: "page-1",
    title: "Ao Ashi",
    slug: "ao-ashi",
    keywords: ["manga", "futebol"],
    currentVersion: 3,
    authorName: "Pedro Araujo",
    updatedAt: "2026-06-11T18:30:00",
  },
  {
    id: "page-2",
    title: "Esperion",
    slug: "esperion",
    keywords: ["time"],
    currentVersion: 1,
    authorName: "Admin Wiki",
    updatedAt: "2026-06-10T12:00:00",
  },
];

const catalogSummaries = [
  {
    ...summaries[0],
    title: "Ao Ashi e a longa jornada do futebol de base japones",
    keywords: ["manga", "futebol", "personagem", "esperion"],
    coverImageUrl: "https://example.com/ao-ashi-cover.jpg",
    coverImageAlt: "Ashito Aoi em campo",
  },
  {
    ...summaries[1],
    coverImageUrl: null,
    coverImageAlt: null,
  },
  {
    ...summaries[1],
    id: "page-3",
    title: "Pagina sem keywords",
    slug: "sem-keywords",
    keywords: [],
    coverImageUrl: "javascript:alert('invalid')",
    coverImageAlt: "Imagem insegura",
  },
] as PageSummary[];

const aoAshi: PageDetails = {
  id: "page-1",
  title: "Ao Ashi",
  slug: "ao-ashi",
  content: "# Sinopse\n\nAo Ashi acompanha **Ashito Aoi**.\n\n- Futebol\n- Base",
  keywords: ["manga", "futebol"],
  currentVersion: 3,
  author: {
    id: "user-1",
    name: "Pedro Araujo",
    email: "pedro@example.com",
    provider: "GOOGLE",
    avatarUrl: null,
    createdAt: "2026-06-09T19:08:25",
  },
  createdAt: "2026-06-09T19:08:25",
  updatedAt: "2026-06-11T18:30:00",
};

const aoAshiHistory: PageHistoryEntry[] = [
  {
    id: "history-3",
    pageId: "page-1",
    version: 3,
    title: "Ao Ashi",
    content: "# Sinopse\n\nAo Ashi acompanha **Ashito Aoi**.\n\n- Futebol\n- Base\n- Profissional",
    keywords: ["manga", "futebol", "personagem"],
    editedByName: "Editor Final",
    changeSummary: "Ajuste de sinopse",
    createdAt: "2026-06-11T18:35:00",
  },
  {
    id: "history-2",
    pageId: "page-1",
    version: 2,
    title: "Ao Ashi Antigo",
    content: "# Sinopse\n\nAo Ashi acompanha **Ashito Aoi**.\n\n- Futebol\n- Base\n- Juvenil",
    keywords: aoAshi.keywords,
    editedByName: "Pedro Araujo",
    changeSummary: "Complemento de personagens",
    createdAt: "2026-06-10T15:20:00",
  },
];

const recentAoAshi = {
  id: aoAshi.id,
  title: aoAshi.title,
  slug: aoAshi.slug,
  viewedAt: "2026-06-11T18:30:00.000Z",
};

type MockResponse = {
  status?: number;
  body?: unknown;
};

function mockFetchSequence(responses: MockResponse[]) {
  const fetchMock = vi.fn(async () => {
    const next = responses.shift();

    if (!next) {
      throw new Error("Unexpected fetch call");
    }

    return new Response(next.body === undefined ? null : JSON.stringify(next.body), {
      status: next.status ?? 200,
      headers: next.body === undefined ? undefined : { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function goTo(path: string) {
  window.history.pushState({}, "", path);
}

function mockColorScheme(initialDarkMode = false) {
  let isDarkMode = initialDarkMode;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() {
      return isDarkMode;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList;

  vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));

  return {
    setDarkMode(nextDarkMode: boolean) {
      isDarkMode = nextDarkMode;
      listeners.forEach((listener) => listener({ matches: nextDarkMode, media: mediaQuery.media } as MediaQueryListEvent));
    },
  };
}

describe("Wiki-bol frontend", () => {
  beforeEach(() => {
    goTo("/");
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    mockColorScheme();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the public shell and page list for visitors", async () => {
    mockFetchSequence([visitorResponse, { body: summaries }]);
    goTo("/pages");

    render(<App />);

    const session = await screen.findByLabelText("Sessao do usuario");
    const navigation = screen.getByLabelText("Navegacao principal");

    expect(within(session).getByText("Visitante")).toBeInTheDocument();
    expect(within(navigation).queryByText("Visitante")).not.toBeInTheDocument();
    expect(within(session).getByRole("link", { name: /entrar com google/i })).toHaveAttribute(
      "href",
      `${API_BASE_URL}/oauth2/authorization/google`,
    );
    expect(await screen.findByRole("link", { name: /ao ashi/i })).toBeInTheDocument();
    expect(screen.queryByText(/Pedro Araujo/)).not.toBeInTheDocument();
    expect(screen.queryByText("v3")).not.toBeInTheDocument();
    expect(within(navigation).getByRole("heading", { name: "Visto recentemente" })).toBeInTheDocument();
    expect(within(navigation).getByText("Nenhuma pagina vista.")).toBeInTheDocument();
    expect(within(navigation).queryByText("Categorias em breve")).not.toBeInTheDocument();
  });

  it("records a successfully loaded article for the visitor and shows it in both navigation surfaces", async () => {
    mockFetchSequence([visitorResponse, { body: aoAshi }, { body: aoAshiHistory }]);
    goTo("/pages/ao-ashi");
    const actor = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Ao Ashi" });
    const navigation = screen.getByLabelText("Navegacao principal");
    expect(within(navigation).getByRole("link", { name: "Ao Ashi" })).toHaveAttribute("href", "/pages/ao-ashi");
    expect(JSON.parse(localStorage.getItem("wiki-bol-recent-pages:guest") ?? "[]")).toEqual([
      expect.objectContaining({ id: "page-1", title: "Ao Ashi", slug: "ao-ashi", viewedAt: expect.any(String) }),
    ]);

    await actor.click(screen.getByRole("button", { name: "Abrir menu" }));
    const mobileNavigation = screen.getByLabelText("Navegacao mobile");
    expect(within(mobileNavigation).getByRole("link", { name: "Ao Ashi" })).toHaveAttribute(
      "href",
      "/pages/ao-ashi",
    );
  });

  it("moves a revisited page to the top, deduplicates it and keeps only five recent pages", async () => {
    localStorage.setItem(
      "wiki-bol-recent-pages:guest",
      JSON.stringify([
        { id: "page-2", title: "Blue Lock", slug: "blue-lock", viewedAt: "2026-06-11T18:29:00.000Z" },
        { id: "page-3", title: "Inazuma Eleven", slug: "inazuma-eleven", viewedAt: "2026-06-11T18:28:00.000Z" },
        recentAoAshi,
        { id: "page-4", title: "Esperion", slug: "esperion", viewedAt: "2026-06-11T18:26:00.000Z" },
        { id: "page-5", title: "Ashito Aoi", slug: "ashito-aoi", viewedAt: "2026-06-11T18:25:00.000Z" },
      ]),
    );
    mockFetchSequence([visitorResponse, { body: aoAshi }, { body: aoAshiHistory }]);
    goTo("/pages/ao-ashi");

    render(<App />);

    await screen.findByRole("heading", { name: "Ao Ashi" });
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("wiki-bol-recent-pages:guest") ?? "[]");
      expect(stored).toHaveLength(5);
      expect(stored[0]).toEqual(expect.objectContaining({ id: "page-1", slug: "ao-ashi" }));
      expect(stored.filter((entry: { id: string }) => entry.id === "page-1")).toHaveLength(1);
    });
  });

  it("uses separate recent lists for an authenticated user and the guest after logout", async () => {
    localStorage.setItem("wiki-bol-recent-pages:guest", JSON.stringify([recentAoAshi]));
    localStorage.setItem(
      "wiki-bol-recent-pages:user-1",
      JSON.stringify([
        { id: "page-2", title: "Blue Lock", slug: "blue-lock", viewedAt: "2026-06-11T18:31:00.000Z" },
      ]),
    );
    mockFetchSequence([
      { body: user },
      { body: [] },
      { status: 200, body: { message: "Logout realizado com sucesso." } },
    ]);
    goTo("/pages");
    const actor = userEvent.setup();

    render(<App />);

    const navigation = await screen.findByLabelText("Navegacao principal");
    expect(await within(navigation).findByRole("link", { name: "Blue Lock" })).toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "Ao Ashi" })).not.toBeInTheDocument();

    await actor.click(screen.getByRole("button", { name: /^sair$/i }));
    expect(await within(navigation).findByRole("link", { name: "Ao Ashi" })).toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "Blue Lock" })).not.toBeInTheDocument();
  });

  it("recovers from invalid recent data without breaking the shell", async () => {
    localStorage.setItem("wiki-bol-recent-pages:guest", "not-json");
    mockFetchSequence([visitorResponse, { body: [] }]);
    goTo("/pages");

    render(<App />);

    const navigation = await screen.findByLabelText("Navegacao principal");
    expect(within(navigation).getByText("Nenhuma pagina vista.")).toBeInTheDocument();
    expect(localStorage.getItem("wiki-bol-recent-pages:guest")).toBe("[]");
  });

  it("removes a recent page when its article returns 404", async () => {
    localStorage.setItem("wiki-bol-recent-pages:guest", JSON.stringify([recentAoAshi]));
    mockFetchSequence([
      visitorResponse,
      {
        status: 404,
        body: {
          timestamp: "2026-06-11T10:00:00",
          status: 404,
          error: "Not Found",
          messages: ["Pagina nao encontrada."],
        },
      },
    ]);
    goTo("/pages/ao-ashi");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Pagina nao encontrada" })).toBeInTheDocument();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("wiki-bol-recent-pages:guest") ?? "[]")).toEqual([]),
    );
  });

  it("renders the official brand assets and accessible name", async () => {
    mockFetchSequence([visitorResponse, { body: summaries }]);
    goTo("/pages");

    render(<App />);

    const navigation = await screen.findByLabelText("Navegacao principal");
    expect(within(navigation).getByRole("img", { name: "Wiki-bol" })).toHaveAttribute(
      "src",
      "/brand/wiki-bol-logo.png",
    );
    expect(screen.getByRole("link", { name: "Wiki-bol" })).toHaveAttribute("href", "/pages");
  });

  it("uses the system theme by default and persists an explicit preference", async () => {
    const colorScheme = mockColorScheme(false);
    mockFetchSequence([visitorResponse, { body: summaries }]);
    goTo("/pages");
    const actor = userEvent.setup();

    render(<App />);

    await screen.findByRole("link", { name: /ao ashi/i });
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Usar tema do sistema" })).toHaveAttribute("aria-pressed", "true");

    colorScheme.setDarkMode(true);
    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-theme", "dark"));

    await actor.click(screen.getByRole("button", { name: "Usar tema claro" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("wiki-bol-theme")).toBe("light");

    colorScheme.setDarkMode(true);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("opens and closes the mobile navigation accessibly", async () => {
    mockFetchSequence([visitorResponse, { body: summaries }]);
    goTo("/pages");
    const actor = userEvent.setup();

    render(<App />);

    await screen.findByRole("link", { name: /ao ashi/i });
    const menuButton = screen.getByRole("button", { name: "Abrir menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await actor.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Fechar menu" })).toBeInTheDocument();

    await actor.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Fechar menu" })).not.toBeInTheDocument();
  });

  it("marks only the exact sidebar destination as active on the create page", async () => {
    mockFetchSequence([{ body: user }]);
    goTo("/pages/new");
    const actor = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    const navigation = screen.getByLabelText("Navegacao principal");
    expect(within(navigation).getByRole("link", { name: "Todas as paginas" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(within(navigation).getByRole("link", { name: "Criar pagina" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await actor.click(screen.getByRole("button", { name: "Abrir menu" }));
    const mobileNavigation = screen.getByLabelText("Navegacao mobile");
    expect(within(mobileNavigation).getByRole("link", { name: "Todas as paginas" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(within(mobileNavigation).getByRole("link", { name: "Criar pagina" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders catalog entries as accessible cards without administrative metadata", async () => {
    mockFetchSequence([visitorResponse, { body: catalogSummaries }]);
    goTo("/pages");
    const actor = userEvent.setup();

    render(<App />);

    const card = await screen.findByRole("link", {
      name: /ao ashi e a longa jornada do futebol de base japones/i,
    });
    expect(card).toHaveAttribute("href", "/pages/ao-ashi");
    expect(within(card).getByRole("img", { name: "Ashito Aoi em campo" })).toHaveAttribute(
      "src",
      "https://example.com/ao-ashi-cover.jpg",
    );
    expect(within(card).getByText("manga")).toBeInTheDocument();
    expect(within(card).getByText("futebol")).toBeInTheDocument();
    expect(within(card).getByText("personagem")).toBeInTheDocument();
    expect(within(card).queryByText("esperion")).not.toBeInTheDocument();
    expect(within(card).getByText("…")).toBeInTheDocument();
    expect(within(card).queryByText("v3")).not.toBeInTheDocument();
    expect(within(card).queryByText("Pedro Araujo")).not.toBeInTheDocument();
    expect(within(card).queryAllByRole("link")).toHaveLength(0);

    let attempts = 0;
    while (document.activeElement !== card && attempts < 20) {
      await actor.tab();
      attempts += 1;
    }
    expect(card).toHaveFocus();
  });

  it("uses the brand fallback when a catalog cover is absent or fails to load", async () => {
    mockFetchSequence([visitorResponse, { body: catalogSummaries }]);
    goTo("/pages");

    render(<App />);

    const coveredCard = await screen.findByRole("link", {
      name: /ao ashi e a longa jornada do futebol de base japones/i,
    });
    const cover = within(coveredCard).getByRole("img", { name: "Ashito Aoi em campo" });
    expect(cover).not.toHaveClass("catalog-fallback-image");
    fireEvent.error(cover);
    expect(coveredCard.querySelector("img")).toHaveAttribute("src", "/brand/catalog-fallback.png");
    expect(coveredCard.querySelector("img")).toHaveAttribute("alt", "");
    expect(coveredCard.querySelector("img")).toHaveClass("catalog-fallback-image");

    const noCoverCard = screen.getByRole("link", { name: /^esperion/i });
    expect(noCoverCard.querySelector("img")).toHaveAttribute("src", "/brand/catalog-fallback.png");
    expect(noCoverCard.querySelector("img")).toHaveClass("catalog-fallback-image");
    expect(within(noCoverCard).queryByText("…")).not.toBeInTheDocument();

    const unsafeCoverCard = screen.getByRole("link", { name: /^pagina sem keywords/i });
    expect(unsafeCoverCard.querySelector("img")).toHaveAttribute("src", "/brand/catalog-fallback.png");
    expect(unsafeCoverCard.querySelector("img")).toHaveClass("catalog-fallback-image");
    expect(within(unsafeCoverCard).queryByLabelText("Keywords")).not.toBeInTheDocument();
  });

  it("searches pages and returns to the full listing when the query is cleared", async () => {
    const fetchMock = mockFetchSequence([
      visitorResponse,
      { body: summaries },
      { body: [summaries[1]] },
      { body: summaries },
    ]);
    const actor = userEvent.setup();
    goTo("/pages");

    render(<App />);

    await screen.findByRole("link", { name: /ao ashi/i });
    await actor.type(screen.getByRole("searchbox", { name: /buscar paginas/i }), "Esperion");
    await actor.click(screen.getByRole("button", { name: /^buscar$/i }));

    expect(await screen.findByRole("link", { name: /esperion/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ao ashi/i })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/pages/search?q=Esperion&limit=20`, {
      credentials: "include",
    });

    await actor.clear(screen.getByRole("searchbox", { name: /buscar paginas/i }));
    await actor.click(screen.getByRole("button", { name: /^buscar$/i }));

    expect(await screen.findByRole("link", { name: /ao ashi/i })).toBeInTheDocument();
  });

  it("filters the listing from a keyword URL and returns to the full listing when cleared", async () => {
    const fetchMock = mockFetchSequence([visitorResponse, { body: [summaries[0]] }, { body: summaries }]);
    const actor = userEvent.setup();
    goTo("/pages?keyword=manga");

    render(<App />);

    expect(await screen.findByRole("link", { name: /ao ashi/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /buscar paginas/i })).toHaveValue("manga");
    expect(screen.getByText("Paginas com keyword: manga")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/pages/search?q=manga&limit=20`, {
      credentials: "include",
    });

    expect(screen.queryByRole("link", { name: /^manga$/i })).not.toBeInTheDocument();
    await actor.clear(screen.getByRole("searchbox", { name: /buscar paginas/i }));
    await actor.click(screen.getByRole("button", { name: /^buscar$/i }));

    expect(await screen.findByText("Paginas recentes")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/pages");
    expect(window.location.search).toBe("");
  });

  it("canonicalizes accented keyword chips before navigating to the filtered listing", async () => {
    const legacyKeywordPage = { ...aoAshi, keywords: ["mangá", "futebol"] };
    const fetchMock = mockFetchSequence([
      visitorResponse,
      { body: legacyKeywordPage },
      { body: aoAshiHistory },
      { body: [summaries[0]] },
    ]);
    goTo("/pages/ao-ashi");

    render(<App />);

    expect(await screen.findByRole("link", { name: /^mangá$/i })).toHaveAttribute("href", "/pages?keyword=manga");
    await userEvent.click(screen.getByRole("link", { name: /^mangá$/i }));

    expect(await screen.findByText("Paginas com keyword: manga")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/pages/search?q=manga&limit=20`, {
      credentials: "include",
    });
  });

  it("renders markdown article content and visitor-safe actions", async () => {
    mockFetchSequence([visitorResponse, { body: aoAshi }, { body: aoAshiHistory }]);
    goTo("/pages/ao-ashi");

    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Ao Ashi" })).toBeInTheDocument();
    const articleHeader = container.querySelector(".article-header");
    expect(articleHeader).not.toBeNull();
    expect(within(articleHeader as HTMLElement).getByLabelText("Breadcrumb")).toBeInTheDocument();
    expect(within(articleHeader as HTMLElement).queryByText("v3")).not.toBeInTheDocument();
    expect(within(articleHeader as HTMLElement).queryByText(/Atualizado em/i)).not.toBeInTheDocument();
    expect(within(articleHeader as HTMLElement).queryByText(/por Pedro Araujo/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sinopse" })).toBeInTheDocument();
    expect(screen.getByText("Ashito Aoi")).toBeInTheDocument();
    expect(screen.queryByLabelText("Informacoes da pagina")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Informacoes editoriais" })).toBeInTheDocument();
    expect(screen.getByText("Autor original")).toBeInTheDocument();
    expect(screen.getByText("Pedro Araujo")).toBeInTheDocument();
    expect(screen.getByText("Ultima atualizacao")).toBeInTheDocument();
    expect(await screen.findByText("Ultima edicao")).toBeInTheDocument();
    expect(screen.getByText("Editor Final")).toBeInTheDocument();
    expect(screen.getByText("Resumo da ultima alteracao")).toBeInTheDocument();
    expect(screen.getByText("Ajuste de sinopse")).toBeInTheDocument();
    expect(screen.getByText("Versao atual")).toBeInTheDocument();
    expect(screen.getAllByText("v3").length).toBeGreaterThan(0);
    expect(screen.getByText("Slug permanente")).toBeInTheDocument();
    expect(screen.getByText("ao-ashi")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /editar pagina/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /deletar página/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^historico$/i })).toHaveAttribute("href", "/pages/ao-ashi/history");
    expect(screen.getAllByRole("link", { name: /^manga$/i })[0]).toHaveAttribute("href", "/pages?keyword=manga");
  });

  it("keeps article readable when history loading fails", async () => {
    mockFetchSequence([
      visitorResponse,
      { body: aoAshi },
      {
        status: 500,
        body: {
          timestamp: "2026-06-11T10:00:00",
          status: 500,
          error: "Internal Server Error",
          messages: ["Historico indisponivel."],
        },
      },
    ]);
    goTo("/pages/ao-ashi");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Ao Ashi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Informacoes editoriais" })).toBeInTheDocument();
    expect(screen.getByText("Autor original")).toBeInTheDocument();
    expect(screen.getByText("Slug permanente")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Ultima edicao")).not.toBeInTheDocument());
  });

  it("shows edit and delete actions for the original author", async () => {
    mockFetchSequence([{ body: user }, { body: aoAshi }, { body: aoAshiHistory }]);
    goTo("/pages/ao-ashi");

    render(<App />);

    expect(await screen.findByRole("link", { name: /editar pagina/i })).toHaveAttribute(
      "href",
      "/pages/ao-ashi/edit",
    );
    expect(screen.getByRole("button", { name: /deletar página/i })).toBeInTheDocument();
  });

  it("renders a dedicated history page with default inline comparison and preview", async () => {
    mockFetchSequence([visitorResponse, { body: aoAshi }, { body: aoAshiHistory }]);
    goTo("/pages/ao-ashi/history");

    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Historico de Ao Ashi" })).toBeInTheDocument();
    expect(screen.getByLabelText("Breadcrumb")).toHaveTextContent("Wiki-bol/Ao Ashi/Historico");
    expect(screen.getByRole("button", { name: /v3 ajuste de sinopse/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /v2 complemento de personagens/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/comparar de/i)).toHaveValue("2");
    expect(screen.getByLabelText(/comparar com/i)).toHaveValue("3");
    expect(screen.getByRole("heading", { name: /comparacao visual/i })).toBeInTheDocument();
    expect(screen.getByText("Titulo alterado")).toBeInTheDocument();
    expect(screen.getByText("Ao Ashi Antigo")).toBeInTheDocument();
    expect(screen.getAllByText("Ao Ashi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("personagem").length).toBeGreaterThan(0);
    expect(screen.getByText("- Profissional")).toBeInTheDocument();
    expect(screen.getByText("- Juvenil")).toBeInTheDocument();
    expect(container.querySelector(".diff-line-added")).not.toBeNull();
    expect(container.querySelector(".diff-line-removed")).not.toBeNull();
    expect(screen.getByRole("heading", { name: /preview da versao v3/i })).toBeInTheDocument();
    expect(screen.getByText("Profissional")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restaurar versao/i })).not.toBeInTheDocument();
  });

  it("shows an unavailable comparison state when a page has only one version", async () => {
    mockFetchSequence([visitorResponse, { body: aoAshi }, { body: [aoAshiHistory[0]] }]);
    goTo("/pages/ao-ashi/history");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Historico de Ao Ashi" })).toBeInTheDocument();
    expect(screen.getByText(/e necessario ter ao menos duas versoes/i)).toBeInTheDocument();
  });

  it("restores a selected version only after modal confirmation for the original author", async () => {
    const fetchMock = mockFetchSequence([
      { body: user },
      { body: aoAshi },
      { body: aoAshiHistory },
      { body: { ...aoAshi, currentVersion: 4, updatedAt: "2026-06-12T09:00:00" } },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/ao-ashi/history");

    render(<App />);

    await screen.findByRole("heading", { name: "Historico de Ao Ashi" });
    expect(screen.getByText("Versao atual")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restaurar versao v3/i })).not.toBeInTheDocument();

    await actor.click(screen.getByRole("button", { name: /v2 complemento de personagens/i }));
    expect(screen.queryByText("Versao atual")).not.toBeInTheDocument();
    await actor.click(screen.getByRole("button", { name: /restaurar versao v2/i }));

    const dialog = screen.getByRole("dialog", { name: /restaurar versao/i });
    expect(within(dialog).getByText(/uma nova versao sera criada/i)).toBeInTheDocument();

    await actor.click(within(dialog).getByRole("button", { name: /confirmar restore/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/pages/page-1/history/2/restore`,
        expect.objectContaining({ method: "POST", credentials: "include" }),
      ),
    );
    expect(await screen.findByRole("heading", { name: "Ao Ashi" })).toBeInTheDocument();
    expect(screen.getByText(/versao restaurada/i)).toBeInTheDocument();
  });

  it("keeps the history page visible when restore is rejected", async () => {
    mockFetchSequence([
      { body: admin },
      { body: aoAshi },
      { body: aoAshiHistory },
      {
        status: 403,
        body: {
          timestamp: "2026-06-11T10:00:00",
          status: 403,
          error: "Forbidden",
          messages: ["Voce nao pode restaurar esta versao."],
        },
      },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/ao-ashi/history");

    render(<App />);

    await screen.findByRole("heading", { name: "Historico de Ao Ashi" });
    await actor.click(screen.getByRole("button", { name: /v2 complemento de personagens/i }));
    await actor.click(screen.getByRole("button", { name: /restaurar versao v2/i }));
    await actor.click(screen.getByRole("button", { name: /confirmar restore/i }));

    expect(await screen.findByText("Voce nao pode restaurar esta versao.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Historico de Ao Ashi" })).toBeInTheDocument();
  });

  it("logs out from the session panel and returns to visitor state", async () => {
    const fetchMock = mockFetchSequence([
      { body: user },
      { body: [] },
      { status: 200, body: { message: "Logout realizado com sucesso." } },
    ]);
    const actor = userEvent.setup();
    goTo("/pages");

    render(<App />);

    const session = await screen.findByLabelText("Sessao do usuario");
    const navigation = screen.getByLabelText("Navegacao principal");

    expect(within(session).getByText("Pedro Araujo")).toBeInTheDocument();
    expect(within(navigation).queryByText("Pedro Araujo")).not.toBeInTheDocument();
    await actor.click(screen.getByRole("button", { name: /^sair$/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/logout`,
        expect.objectContaining({ method: "POST", credentials: "include" }),
      ),
    );
    expect(await within(session).findByText("Visitante")).toBeInTheDocument();
  });

  it("keeps the authenticated session visible when logout fails", async () => {
    mockFetchSequence([
      { body: user },
      { body: [] },
      {
        status: 500,
        body: {
          timestamp: "2026-06-11T10:00:00",
          status: 500,
          error: "Internal Server Error",
          messages: ["Falha ao encerrar sessao."],
        },
      },
    ]);
    const actor = userEvent.setup();
    goTo("/pages");

    render(<App />);

    expect(await screen.findByText("Pedro Araujo")).toBeInTheDocument();
    await actor.click(screen.getByRole("button", { name: /^sair$/i }));

    expect(await screen.findByText("Falha ao encerrar sessao.")).toBeInTheDocument();
    expect(screen.getByText("Pedro Araujo")).toBeInTheDocument();
  });

  it("creates a page with preview and local validation", async () => {
    const fetchMock = mockFetchSequence([
      { body: user },
      {
        status: 201,
        body: {
          ...aoAshi,
          id: "created-page",
          title: "Blue Lock",
          slug: "blue-lock",
          content: "# Blue Lock",
          keywords: ["manga"],
          currentVersion: 1,
        },
      },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    expect(screen.getByRole("toolbar", { name: /ferramentas markdown/i })).toBeInTheDocument();
    await actor.click(screen.getByRole("button", { name: /salvar pagina/i }));
    expect(screen.getByText(/titulo e conteudo sao obrigatorios/i)).toBeInTheDocument();

    await actor.type(screen.getByLabelText(/titulo/i), "Blue Lock");
    await actor.type(screen.getByLabelText(/conteudo/i), "# Blue Lock");
    await actor.type(screen.getByLabelText(/keywords/i), "mangá, manga, MANGÁS, futebol, blue   lock");
    expect(screen.queryByLabelText(/resumo da alteracao/i)).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Blue Lock" })).toBeInTheDocument();
    await actor.click(screen.getByRole("button", { name: /salvar pagina/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/pages`,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            title: "Blue Lock",
            content: "# Blue Lock",
            keywords: ["manga", "futebol", "blue lock"],
            changeSummary: "Criacao da pagina",
          }),
        }),
      ),
    );
    await waitFor(() => expect(screen.getAllByRole("heading", { name: "Blue Lock" }).length).toBeGreaterThan(0));
  });

  it("edits an existing page using its id and keeps the slug read-only", async () => {
    const fetchMock = mockFetchSequence([{ body: user }, { body: aoAshi }, { body: { ...aoAshi, title: "Ao Ashi Editado" } }]);
    const actor = userEvent.setup();
    goTo("/pages/ao-ashi/edit");

    render(<App />);

    expect(await screen.findByDisplayValue("ao-ashi")).toBeDisabled();
    expect(screen.getByLabelText(/resumo da alteracao/i)).toBeInTheDocument();
    await actor.clear(screen.getByLabelText(/titulo/i));
    await actor.type(screen.getByLabelText(/titulo/i), "Ao Ashi Editado");
    await actor.type(screen.getByLabelText(/resumo da alteracao/i), "Ajuste editorial");
    await actor.click(screen.getByRole("button", { name: /salvar alteracoes/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/pages/page-1`,
        expect.objectContaining({ method: "PUT", credentials: "include" }),
      ),
    );
  });

  it("adds an image locally for preview without uploading immediately", async () => {
    const createObjectURL = vi.fn(() => "blob:http://localhost/capa");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = createObjectURL;
        static revokeObjectURL = revokeObjectURL;
      },
    );
    const fetchMock = mockFetchSequence([{ body: user }]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    const { unmount } = render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    const contentInput = screen.getByLabelText(/conteudo/i);
    await actor.type(contentInput, "Inicio\nFim");
    fireEvent.select(contentInput, { target: { selectionStart: 7, selectionEnd: 7 } });

    await actor.upload(
      screen.getByLabelText(/enviar imagem/i),
      new File(["image"], "capa.png", { type: "image/png" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(contentInput).toHaveValue("Inicio\n![capa](blob:http://localhost/capa)\nFim"),
    );
    await actor.click(screen.getByRole("button", { name: /^preview$/i }));
    expect(screen.getByRole("img", { name: "capa" })).toHaveAttribute("src", "blob:http://localhost/capa");

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/capa");
  });

  it("uploads pending images before creating a page and saves markdown with public URLs", async () => {
    const createObjectURL = vi.fn(() => "blob:http://localhost/capa");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = createObjectURL;
        static revokeObjectURL = revokeObjectURL;
      },
    );
    const fetchMock = mockFetchSequence([
      { body: user },
      {
        body: {
          url: "https://example.com/image.png",
          markdown: "![capa](https://example.com/image.png)",
          path: "uploads/image.png",
          contentType: "image/png",
          size: 1234,
        },
      },
      {
        status: 201,
        body: {
          ...aoAshi,
          id: "created-page",
          title: "Blue Lock",
          slug: "blue-lock",
          content: "# Blue Lock\n![capa](https://example.com/image.png)",
          keywords: ["manga"],
          currentVersion: 1,
        },
      },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    await actor.type(screen.getByLabelText(/titulo/i), "Blue Lock");
    const contentInput = screen.getByLabelText(/conteudo/i);
    await actor.type(contentInput, "# Blue Lock\n");
    await actor.upload(
      screen.getByLabelText(/enviar imagem/i),
      new File(["image"], "capa.png", { type: "image/png" }),
    );
    await actor.click(screen.getByRole("button", { name: /salvar pagina/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/uploads/images`,
      expect.objectContaining({ method: "POST", credentials: "include", body: expect.any(FormData) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${API_BASE_URL}/api/pages`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          title: "Blue Lock",
          content: "# Blue Lock\n![capa](https://example.com/image.png)",
          keywords: [],
          changeSummary: "Criacao da pagina",
        }),
      }),
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/capa");
  });

  it("does not save the page when a pending image upload fails", async () => {
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = vi.fn(() => "blob:http://localhost/capa");
        static revokeObjectURL = vi.fn();
      },
    );
    const fetchMock = mockFetchSequence([
      { body: user },
      {
        status: 400,
        body: {
          timestamp: "2026-06-17T10:00:00",
          status: 400,
          error: "Bad Request",
          messages: ["Falha ao enviar imagem para o Supabase Storage."],
        },
      },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    await actor.type(screen.getByLabelText(/titulo/i), "Blue Lock");
    await actor.type(screen.getByLabelText(/conteudo/i), "# Blue Lock\n");
    await actor.upload(
      screen.getByLabelText(/enviar imagem/i),
      new File(["image"], "capa.png", { type: "image/png" }),
    );
    await actor.click(screen.getByRole("button", { name: /salvar pagina/i }));

    expect(await screen.findByText("Falha ao enviar imagem para o Supabase Storage.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalledWith(
      `${API_BASE_URL}/api/pages`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not upload a pending image removed from content before saving", async () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = vi.fn(() => "blob:http://localhost/capa");
        static revokeObjectURL = revokeObjectURL;
      },
    );
    const fetchMock = mockFetchSequence([
      { body: user },
      {
        status: 201,
        body: {
          ...aoAshi,
          id: "created-page",
          title: "Blue Lock",
          slug: "blue-lock",
          content: "# Blue Lock",
          keywords: [],
          currentVersion: 1,
        },
      },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    await actor.type(screen.getByLabelText(/titulo/i), "Blue Lock");
    const contentInput = screen.getByLabelText(/conteudo/i);
    await actor.type(contentInput, "# Blue Lock\n");
    await actor.upload(
      screen.getByLabelText(/enviar imagem/i),
      new File(["image"], "capa.png", { type: "image/png" }),
    );
    await actor.clear(contentInput);
    await actor.type(contentInput, "# Blue Lock");
    await actor.click(screen.getByRole("button", { name: /salvar pagina/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/pages`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      `${API_BASE_URL}/api/uploads/images`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/capa");
  });

  it("uses the markdown toolbar to insert formatting and toggle preview", async () => {
    const promptSpy = vi.spyOn(window, "prompt");
    mockFetchSequence([{ body: user }]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    const contentInput = screen.getByLabelText(/conteudo/i);

    await actor.click(contentInput);
    await actor.click(screen.getByRole("button", { name: /^negrito$/i }));
    expect(contentInput).toHaveValue("**texto**");

    await actor.click(screen.getByRole("button", { name: /^link$/i }));
    const linkDialog = screen.getByRole("dialog", { name: /inserir link/i });
    await actor.clear(within(linkDialog).getByLabelText(/texto do link/i));
    await actor.type(within(linkDialog).getByLabelText(/texto do link/i), "Site oficial");
    await actor.clear(within(linkDialog).getByLabelText(/^url$/i));
    await actor.type(within(linkDialog).getByLabelText(/^url$/i), "https://example.com");
    await actor.click(within(linkDialog).getByRole("button", { name: /inserir link/i }));
    expect(contentInput).toHaveValue("**texto**[Site oficial](https://example.com)");
    expect(promptSpy).not.toHaveBeenCalled();

    await actor.click(screen.getByRole("button", { name: /^preview$/i }));
    expect(screen.getByRole("heading", { name: /preview do artigo/i })).toBeInTheDocument();

    await actor.click(screen.getByRole("button", { name: /^editor$/i }));
    expect(contentInput).toBeInTheDocument();
  });

  it("prefills the link modal from the selected editor text and validates the URL", async () => {
    mockFetchSequence([{ body: user }]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    const contentInput = screen.getByLabelText(/conteudo/i);
    await actor.type(contentInput, "Leia Ao Ashi");
    fireEvent.select(contentInput, { target: { selectionStart: 5, selectionEnd: 12 } });

    await actor.click(screen.getByRole("button", { name: /^link$/i }));
    const linkDialog = screen.getByRole("dialog", { name: /inserir link/i });
    expect(within(linkDialog).getByLabelText(/texto do link/i)).toHaveValue("Ao Ashi");

    await actor.clear(within(linkDialog).getByLabelText(/^url$/i));
    await actor.type(within(linkDialog).getByLabelText(/^url$/i), "example.com");
    await actor.click(within(linkDialog).getByRole("button", { name: /inserir link/i }));
    expect(await within(linkDialog).findByText(/use uma url iniciando/i)).toBeInTheDocument();
    expect(contentInput).toHaveValue("Leia Ao Ashi");

    await actor.clear(within(linkDialog).getByLabelText(/^url$/i));
    await actor.type(within(linkDialog).getByLabelText(/^url$/i), "/pages/ao-ashi");
    await actor.click(within(linkDialog).getByRole("button", { name: /inserir link/i }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: /inserir link/i })).not.toBeInTheDocument());
    expect(contentInput).toHaveValue("Leia [Ao Ashi](/pages/ao-ashi)");
  });

  it("deletes a page only after modal confirmation", async () => {
    const fetchMock = mockFetchSequence([
      { body: admin },
      { body: aoAshi },
      { body: aoAshiHistory },
      { status: 204 },
      { body: summaries },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/ao-ashi");

    render(<App />);

    await actor.click(await screen.findByRole("button", { name: /deletar página/i }));
    const dialog = screen.getByRole("dialog", { name: /deletar página/i });
    expect(within(dialog).getByText(/tem certeza que quer deletar essa página/i)).toBeInTheDocument();

    await actor.click(within(dialog).getByRole("button", { name: /confirmar delete/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/pages/page-1`,
        expect.objectContaining({ method: "DELETE", credentials: "include" }),
      ),
    );
    expect(await screen.findByText(/pagina deletada/i)).toBeInTheDocument();
  });
});
