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

describe("Wiki Bol frontend", () => {
  beforeEach(() => {
    goTo("/");
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
    expect(screen.getByText(/Pedro Araujo/)).toBeInTheDocument();
    expect(screen.getByText("v3")).toBeInTheDocument();
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

  it("filters the listing from a keyword URL and keeps keyword chips navigable", async () => {
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

    expect(screen.getAllByRole("link", { name: /^manga$/i })[0]).toHaveAttribute("href", "/pages?keyword=manga");
    await actor.clear(screen.getByRole("searchbox", { name: /buscar paginas/i }));
    await actor.click(screen.getByRole("button", { name: /^buscar$/i }));

    expect(await screen.findByText("Paginas recentes")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/pages");
    expect(window.location.search).toBe("");
  });

  it("canonicalizes accented keyword chips before navigating to the filtered listing", async () => {
    const legacyKeywordPage = { ...summaries[0], keywords: ["mangá", "futebol"] };
    const fetchMock = mockFetchSequence([visitorResponse, { body: [legacyKeywordPage] }, { body: [legacyKeywordPage] }]);
    goTo("/pages");

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
    expect(screen.queryByRole("button", { name: /deletar pagina/i })).not.toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: /deletar pagina/i })).toBeInTheDocument();
  });

  it("renders a dedicated history page with default inline comparison and preview", async () => {
    mockFetchSequence([visitorResponse, { body: aoAshi }, { body: aoAshiHistory }]);
    goTo("/pages/ao-ashi/history");

    const { container } = render(<App />);

    expect(await screen.findByRole("heading", { name: "Historico de Ao Ashi" })).toBeInTheDocument();
    expect(screen.getByLabelText("Breadcrumb")).toHaveTextContent("Wiki Bol/Ao Ashi/Historico");
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

  it("uploads an image and inserts the returned markdown in the editor", async () => {
    mockFetchSequence([
      { body: user },
      {
        body: {
          url: "https://example.com/image.png",
          markdown: "![Capa](https://example.com/image.png)",
          path: "pages/image.png",
          contentType: "image/png",
          size: 1234,
        },
      },
    ]);
    const actor = userEvent.setup();
    goTo("/pages/new");

    render(<App />);

    await screen.findByRole("heading", { name: /criar pagina/i });
    const contentInput = screen.getByLabelText(/conteudo/i);
    await actor.type(contentInput, "Inicio\nFim");
    fireEvent.select(contentInput, { target: { selectionStart: 7, selectionEnd: 7 } });

    await actor.upload(
      screen.getByLabelText(/enviar imagem/i),
      new File(["image"], "capa.png", { type: "image/png" }),
    );

    await waitFor(() =>
      expect(contentInput).toHaveValue("Inicio\n![Capa](https://example.com/image.png)\nFim"),
    );
  });

  it("uses the markdown toolbar to insert formatting and toggle preview", async () => {
    vi.spyOn(window, "prompt")
      .mockReturnValueOnce("Site oficial")
      .mockReturnValueOnce("https://example.com");
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
    expect(contentInput).toHaveValue("**texto**[Site oficial](https://example.com)");

    await actor.click(screen.getByRole("button", { name: /^preview$/i }));
    expect(screen.getByRole("heading", { name: /preview do artigo/i })).toBeInTheDocument();

    await actor.click(screen.getByRole("button", { name: /^editor$/i }));
    expect(contentInput).toBeInTheDocument();
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

    await actor.click(await screen.findByRole("button", { name: /deletar pagina/i }));
    const dialog = screen.getByRole("dialog", { name: /deletar pagina/i });
    expect(within(dialog).getByText(/essa acao remove a pagina da listagem publica/i)).toBeInTheDocument();

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
