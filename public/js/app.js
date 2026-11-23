const toast = document.querySelector("#toast");

const internalSidebar = document.querySelector(".unified-sidebar");

if (internalSidebar) {
  if (!document.querySelector('link[href="/static/css/shell.css"]')) {
    const shellStyles = document.createElement("link");
    shellStyles.rel = "stylesheet";
    shellStyles.href = "/static/css/shell.css";
    document.head.append(shellStyles);
  }

  const navbar = document.createElement("header");
  navbar.className = "app-navbar";
  navbar.innerHTML = `
    <div class="app-navbar-inner">
      <a class="app-brand" href="/tela-inicial.html" aria-label="Conexão Redação - início">
        <span class="app-brand-mark"><span class="material-symbols-rounded" aria-hidden="true">ink_pen</span></span>
        <span>Conexão Redação</span>
      </a>
      <a class="app-profile-link" href="/perfil.html" aria-label="Acessar meu perfil">
        <img class="app-profile-photo" src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=96&h=96&q=80" alt="" />
        <span class="app-profile-copy"><strong>Mariana Souza</strong><small>Ver meu perfil</small></span>
      </a>
    </div>`;
  document.body.prepend(navbar);

  const internalMain = internalSidebar.parentElement?.querySelector(":scope > main");
  const hasCustomContainer =
    internalMain?.classList.contains("account-main") ||
    internalMain?.classList.contains("prompt-main") ||
    internalMain?.classList.contains("settings-main");

  if (internalMain && !hasCustomContainer) {
    internalMain.classList.add("standard-main");
    const contentContainer = document.createElement("div");
    contentContainer.className = "app-content-container";
    while (internalMain.firstChild) contentContainer.append(internalMain.firstChild);
    internalMain.append(contentContainer);

    const title = contentContainer.querySelector("h1");
    if (title) {
      const titleParent = title.parentElement;
      const eyebrow = document.createElement("span");
      eyebrow.className = "page-eyebrow";
      eyebrow.textContent =
        internalSidebar.querySelector("a.active span:last-child")?.textContent?.trim() ??
        "Conexão Redação";
      titleParent?.insertBefore(eyebrow, title);
    }

    const searchRow = contentContainer.querySelector(":scope > .search-row");
    const titleBlock =
      contentContainer.querySelector(":scope > .dash-title-row") ??
      contentContainer.querySelector(":scope > .dash-lead");
    if (searchRow && titleBlock) titleBlock.after(searchRow);
  }
}

const legacyAccountRoutes = {
  "/notificacoes.html": "notificacoes",
  "/configuracoes.html": "configuracoes",
  "/privacidade.html": "privacidade",
};

if (legacyAccountRoutes[window.location.pathname]) {
  window.location.replace(`/perfil.html#${legacyAccountRoutes[window.location.pathname]}`);
}

function notify(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

document.querySelectorAll("[data-notify]").forEach((button) => {
  button.addEventListener("click", () => notify(button.dataset.notify));
});

document.querySelectorAll(".notify-action").forEach((button) => {
  button.addEventListener("click", () => notify("Ação demonstrativa do front-end."));
});

document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.closest("label")?.querySelector("input");
    const symbol = button.querySelector(".material-symbols-rounded");
    if (!input || !symbol) return;

    const willShow = input.type === "password";
    input.type = willShow ? "text" : "password";
    symbol.textContent = willShow ? "visibility" : "visibility_off";
    button.setAttribute("aria-label", willShow ? "Ocultar senha" : "Mostrar senha");
  });
});

document.querySelectorAll(".accordion-title").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".accordion-item")?.classList.toggle("open");
  });
});

document.querySelectorAll(".filters button").forEach((button) => {
  button.addEventListener("click", () => {
    button.parentElement
      ?.querySelectorAll("button")
      .forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  });
});

document.querySelectorAll(".copy").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.closest(".prompt-card")?.querySelector("p")?.textContent ?? "";
    await navigator.clipboard?.writeText(text);
    document.querySelector(".copy-banner")?.classList.add("visible");
  });
});

document.querySelector(".copy-banner button")?.addEventListener("click", (event) => {
  event.currentTarget.parentElement?.classList.remove("visible");
});

document.querySelectorAll(".profile-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    notify("Alterações salvas com sucesso.");
  });
});

const accountTabs = [...document.querySelectorAll("[data-account-tab]")];
const accountPanels = [...document.querySelectorAll(".account-panel")];

function activateAccountTab(tabName, updateHash = true) {
  if (!accountTabs.length) return;
  const validTab = accountTabs.some((tab) => tab.dataset.accountTab === tabName)
    ? tabName
    : "perfil";

  accountTabs.forEach((tab) => {
    const isActive = tab.dataset.accountTab === validTab;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
  accountPanels.forEach((panel) => {
    panel.hidden = panel.id !== validTab;
  });
  if (updateHash) history.replaceState(null, "", `#${validTab}`);
}

accountTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateAccountTab(tab.dataset.accountTab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = accountTabs[(index + direction + accountTabs.length) % accountTabs.length];
    activateAccountTab(nextTab.dataset.accountTab);
    nextTab.focus();
  });
});

if (accountTabs.length) {
  activateAccountTab(window.location.hash.slice(1) || "perfil", false);
  window.addEventListener("hashchange", () => activateAccountTab(window.location.hash.slice(1), false));
}

const promptDialog = document.querySelector("#prompt-dialog");
const promptForm = document.querySelector("#prompt-form");
const promptList = document.querySelector("#teacher-prompt-list");
const promptSearch = document.querySelector("#prompt-search");
let editingPrompt = null;

function updatePromptMetrics() {
  const cards = [...(promptList?.querySelectorAll(".teacher-prompt") ?? [])];
  const totalMetric = document.querySelector("[data-prompt-total]");
  const publishedMetric = document.querySelector("[data-prompt-published]");
  if (totalMetric) totalMetric.textContent = String(cards.length);
  if (publishedMetric) {
    publishedMetric.textContent = String(
      cards.filter((card) => !card.querySelector(".status.draft")).length,
    );
  }
}

function filterTeacherPrompts() {
  if (!promptList) return;
  const term = promptSearch?.value.trim().toLocaleLowerCase("pt-BR") ?? "";
  const selectedCategory = document.querySelector(".filters button.selected")?.dataset.category ?? "Todos";
  let visibleCount = 0;

  promptList.querySelectorAll(".teacher-prompt").forEach((card) => {
    const matchesTerm = card.textContent.toLocaleLowerCase("pt-BR").includes(term);
    const matchesCategory = selectedCategory === "Todos" || card.dataset.category === selectedCategory;
    card.hidden = !(matchesTerm && matchesCategory);
    if (!card.hidden) visibleCount += 1;
  });
  const emptyState = document.querySelector("#prompt-empty");
  if (emptyState) emptyState.hidden = visibleCount > 0;
}

function openPromptDialog(card = null) {
  if (!promptDialog) return;
  editingPrompt = card;
  document.querySelector("#prompt-dialog-title").textContent = card ? "Editar prompt" : "Novo prompt";
  document.querySelector("#prompt-title").value = card?.querySelector("h2")?.textContent ?? "";
  document.querySelector("#prompt-category").value = card?.dataset.category ?? "Introdução";
  document.querySelector("#prompt-content").value = card?.querySelector("p")?.textContent ?? "";
  promptDialog.showModal();
  window.setTimeout(() => document.querySelector("#prompt-title")?.focus(), 0);
}

document.querySelector("[data-open-prompt]")?.addEventListener("click", () => openPromptDialog());
promptSearch?.addEventListener("input", filterTeacherPrompts);

document.querySelectorAll(".filters button").forEach((button) => {
  button.addEventListener("click", filterTeacherPrompts);
});

promptList?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-prompt]");
  const deleteButton = event.target.closest("[data-delete-prompt]");
  const card = event.target.closest(".teacher-prompt");
  if (editButton && card) openPromptDialog(card);
  if (deleteButton && card) {
    card.remove();
    updatePromptMetrics();
    filterTeacherPrompts();
    notify("Prompt excluído da biblioteca.");
  }
});

promptForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitter = event.submitter;
  if (submitter?.value === "cancel") {
    promptDialog.close();
    return;
  }

  const title = document.querySelector("#prompt-title").value.trim();
  const category = document.querySelector("#prompt-category").value;
  const content = document.querySelector("#prompt-content").value.trim();
  if (!title || !content) return;

  const categoryClass = category.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (editingPrompt) {
    editingPrompt.dataset.category = category;
    editingPrompt.querySelector("h2").textContent = title;
    editingPrompt.querySelector("p").textContent = content;
    const badge = editingPrompt.querySelector(".category");
    badge.textContent = category;
    badge.className = `category ${categoryClass}`;
  } else {
    const card = document.createElement("article");
    card.className = "teacher-prompt";
    card.dataset.category = category;
    card.innerHTML = `
      <div class="prompt-icon"><span class="material-symbols-rounded">edit_note</span></div>
      <div class="prompt-copy"><div><span class="category ${categoryClass}">${category}</span><span class="status draft">Rascunho</span></div><h2></h2><p></p><small>Criado agora · ainda não utilizado</small></div>
      <div class="prompt-actions"><button aria-label="Editar prompt" data-edit-prompt><span class="material-symbols-rounded">edit</span></button><button aria-label="Excluir prompt" data-delete-prompt><span class="material-symbols-rounded">delete</span></button></div>`;
    card.querySelector("h2").textContent = title;
    card.querySelector("p").textContent = content;
    promptList.prepend(card);
  }
  promptDialog.close();
  promptForm.reset();
  updatePromptMetrics();
  filterTeacherPrompts();
  notify(editingPrompt ? "Prompt atualizado com sucesso." : "Novo prompt adicionado à biblioteca.");
  editingPrompt = null;
});

updatePromptMetrics();

const essay = document.querySelector("#essay");
essay?.addEventListener("input", () => {
  const lineCount = Math.max(0, essay.value.split("\n").length - 1);
  const counter = document.querySelector("#line-count");
  if (counter) counter.textContent = `${lineCount}/30 linhas`;
});
