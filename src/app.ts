import { renderMarkdown } from "./lib/preview";
import { forgetDraft, migrateLegacyDrafts, readDraft, rememberDraft } from "./lib/drafts";
import { ensureLibraryFsScope } from "./lib/libraryScope";
import { createEditor, FolioEditor } from "./editor/setup";
import {
  createDemoLibrary,
  createNote,
  deleteNote,
  ensureEnglishTutorialIfNeeded,
  getDefaultLibraryPath,
  listNotes,
  repairWelcomeTutorialLibrary,
  readNote,
  renameNote,
  writeLibraryImage,
  writeLibraryImageBytes,
  writeNote,
} from "./lib/fs";
import {
  altTextFromFileName,
  imageMarkdown,
  imageMimeFromPath,
  isImageFile,
  isLocalPreviewImageSrc,
  joinLibraryRelativePath,
  libraryImageRefCandidates,
  normalizeLibraryImageRef,
  resolveImageMime,
} from "./lib/imageAssets";
import {
  canUseDirectoryPicker,
  exportLibraryToDisk,
  exportNoteToDisk,
  importMarkdownFiles,
  saveLibraryToDirectory,
} from "./lib/disk";
import { EDITOR_FONTS, fontCss, type EditorFontId } from "./lib/fonts";
import { enterFullscreen, exitFullscreen } from "./lib/fullscreen";
import { NoteIndex } from "./lib/noteIndex";
import { isAppleMobile, isMobileUi } from "./lib/platform";
import {
  isDesktopUi,
  isMarketingDesktopCapture,
  isTauri,
  MARKETING_DESKTOP_LIBRARY_LABEL,
} from "./lib/runtime";
import {
  applyStaticUi,
  defaultNoteTitle,
  formatCharCount,
  formatWordCount,
  setUiLocale,
  sortLocaleTag,
  t,
} from "./lib/i18n";
import { loadSettings, saveSettings } from "./lib/settings";
import { sortNotes } from "./lib/sortNotes";
import { getAppVersion } from "./lib/appVersion";
import { openFolioReleaseUrl } from "./lib/openRelease";
import { createSidebarMenu, type SidebarMenuController } from "./lib/sidebarMenu";
import {
  dismissUpdateVersion,
  runManualUpdateCheck,
  scheduleDesktopUpdateCheck,
  type UpdateNoticeUi,
  type UpdateOffer,
} from "./lib/updateNotice";
import type { AppSettings, NoteMeta } from "./types";

type FolderNode = {
  name: string;
  path: string;
  folders: Map<string, FolderNode>;
  notes: NoteMeta[];
};

function folderNode(name: string, path: string): FolderNode {
  return { name, path, folders: new Map(), notes: [] };
}

export class FolioApp {
  private settings!: AppSettings;
  private notes: NoteMeta[] = [];
  private current: NoteMeta | null = null;
  private editor!: FolioEditor;
  private index = new NoteIndex();
  private saveTimer: number | null = null;
  private dirty = false;
  private revision = 0;
  private saveQueue: Promise<void> = Promise.resolve();
  private actionQueue: Promise<void> = Promise.resolve();
  private busy = false;
  private suppressChange = false;
  private renaming = false;
  private previewOn = false;
  private commandIndex = 0;
  private commandItems: NoteMeta[] = [];
  private collapsedFolders = new Set<string>();
  private mobile = isMobileUi();
  private appleMobile = isAppleMobile();
  private native = isTauri();
  private webOnly = !isDesktopUi();
  /** Snapshot restored when leaving immersive Focus. */
  private sidebarMenu: SidebarMenuController | null = null;
  private appMenu: SidebarMenuController | null = null;
  private updateOffer: UpdateOffer | null = null;
  private updateNoticeUi: UpdateNoticeUi | null = null;
  private updateStatusPinnedUntil = 0;
  private focusSnapshot: {
    showBacklinks: boolean;
    sidebarCollapsed: boolean;
    previewOn: boolean;
  } | null = null;

  private els = {
    app: document.getElementById("app")!,
    sidebar: document.getElementById("sidebar")!,
    scrim: document.getElementById("scrim")!,
    noteList: document.getElementById("note-list")!,
    sortBy: document.getElementById("sort-by") as HTMLSelectElement,
    sortDirection: document.getElementById("sort-direction") as HTMLSelectElement,
    libraryPath: document.getElementById("library-path")!,
    titleInput: document.getElementById("note-title") as HTMLInputElement,
    editorRoot: document.getElementById("editor-root")!,
    previewRoot: document.getElementById("preview-root")!,
    previewPane: document.getElementById("preview-pane")!,
    menuRemoteImagesGlobal: document.getElementById("menu-remote-images-global")!,
    menuRemoteImagesNote: document.getElementById("menu-remote-images-note")!,
    appMenuVersion: document.getElementById("app-menu-version")!,
    backlinksPane: document.getElementById("backlinks-pane")!,
    backlinksList: document.getElementById("backlinks-list")!,
    outgoingList: document.getElementById("outgoing-list")!,
    backlinksCount: document.getElementById("backlinks-count")!,
    statusWords: document.getElementById("status-words")!,
    statusChars: document.getElementById("status-chars")!,
    statusSave: document.getElementById("status-save")!,
    welcome: document.getElementById("welcome")!,
    welcomeCopy: document.getElementById("welcome-copy")!,
    commandPalette: document.getElementById("command-palette")!,
    commandInput: document.getElementById("command-input") as HTMLInputElement,
    commandResults: document.getElementById("command-results")!,
    btnFocus: document.getElementById("btn-focus")!,
    btnExitFocus: document.getElementById("btn-exit-focus")!,
    btnTypewriter: document.getElementById("btn-typewriter")!,
    btnPreview: document.getElementById("btn-preview")!,
    btnTheme: document.getElementById("btn-theme")!,
    btnBacklinks: document.getElementById("btn-backlinks")!,
    btnLocale: document.getElementById("btn-locale")!,
    fontSelect: document.getElementById("font-select") as HTMLButtonElement,
    fontSelectLabel: document.getElementById("font-select-label")!,
    fontMenu: document.getElementById("font-menu")!,
    fontPicker: document.querySelector(".font-picker") as HTMLElement,
  };

  async init() {
    await migrateLegacyDrafts();
    this.settings = await loadSettings();
    if (!this.settings.uiLocale) this.settings.uiLocale = "en";
    setUiLocale(this.settings.uiLocale);
    this.els.sortBy.value = this.settings.sortBy;
    this.els.sortDirection.value = this.settings.sortDirection;
    applyStaticUi();
    this.applyTheme(this.settings.theme);

    this.editor = createEditor(
      this.els.editorRoot,
      this.index,
      {
        onChange: (text) => this.handleEditorChange(text),
        onOpenWiki: (title, createIfMissing) => void this.runAction(() => this.openWiki(title, createIfMissing)),
        onImageDrop: {
          onFile: (file) => this.insertImageFromFile(file),
          onPath: (path) => this.insertImageFromPath(path),
          onRejected: () => {
            this.els.statusSave.textContent = t("status.imageUnsupported");
          },
        },
      },
      this.settings.theme,
      t("editor.placeholder"),
    );

    this.editor.setReadOnly(true);
    this.setupMobileShell();
    this.applyFont(this.settings.editorFont);
    this.applyChrome();
    this.bindUi();
    this.bindShortcuts();
    this.bindLifecycle();
    this.applyWelcomeTexts();
    this.updateLocaleChip();
    this.syncRemoteImageChips();

    if (this.settings.libraryPath) {
      await this.openLibrary(this.settings.libraryPath, this.settings.lastOpenPath);
    } else if (this.webOnly || this.appleMobile || isMarketingDesktopCapture()) {
      await this.createDemo();
    } else {
      this.showWelcome(true);
    }
    this.setupUpdateNotice();
    void this.syncAppMenuVersion();
    if (this.native) void this.previewAssetReady;
  }

  private reportError(error: unknown) {
    console.error(error);
    this.els.statusSave.textContent = this.dirty
      ? t("status.saveFailedDirty")
      : t("status.operationFailed");
  }

  private applyLocale() {
    setUiLocale(this.settings.uiLocale);
    applyStaticUi();
    this.updateLocaleChip();
    this.applyWelcomeTexts();
    this.applyTheme(this.settings.theme);
    this.editor.setPlaceholder(t("editor.placeholder"));
    if (!this.dirty && !this.busy) this.els.statusSave.textContent = t("status.ready");
    if (this.webOnly && this.settings.libraryPath) {
      this.els.libraryPath.textContent = t("library.browserLabel");
    }
    const hint = document.getElementById("status-hint");
    if (hint) hint.textContent = t("status.hintDesktop");
    this.renderNoteList();
    this.renderLinks();
    this.updateStats(this.editor.getText());
    this.syncRemoteImageChips();
    this.sidebarMenu?.syncItems();
    void this.syncAppMenuVersion();
  }

  private updateLocaleChip() {
    this.els.btnLocale.textContent =
      this.settings.uiLocale === "cs" ? t("chip.localeToEn") : t("chip.localeToCs");
    this.els.btnLocale.title = this.settings.uiLocale === "cs" ? "English" : "Čeština";
  }

  private applyWelcomeTexts() {
    if (this.webOnly) {
      this.els.welcomeCopy.textContent = t("welcome.taglineWeb");
      const demoBtn = document.getElementById("welcome-demo");
      if (demoBtn) demoBtn.textContent = t("welcome.demoWeb");
    } else if (this.mobile && !this.webOnly) {
      this.els.welcomeCopy.textContent = t("welcome.taglineMobile");
    } else {
      this.els.welcomeCopy.textContent = t("welcome.tagline");
    }
  }

  // Serialize navigation, rename, deletion and import. Autosave has its own queue.
  private runAction(action: () => Promise<unknown>) {
    this.actionQueue = this.actionQueue.then(async () => {
      this.busy = true;
      this.editor.setReadOnly(true);
      this.els.titleInput.disabled = true;
      this.els.app.setAttribute("aria-busy", "true");
      try { await action(); } catch (error) { this.reportError(error); }
      finally {
        this.busy = false;
        this.editor.setReadOnly(!this.current);
        this.els.titleInput.disabled = false;
        this.els.app.removeAttribute("aria-busy");
      }
    });
    return this.actionQueue;
  }

  private bindLifecycle() {
    window.addEventListener("beforeunload", (event) => {
      if (!this.dirty && !this.busy) return;
      event.preventDefault();
      event.returnValue = "";
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && this.dirty) {
        void this.saveCurrent(false).catch((error) => this.reportError(error));
      }
    });
    if (this.native) {
      void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        return appWindow.onCloseRequested((event) => {
          event.preventDefault();
          void this.runAction(async () => {
            await this.flushCurrent();
            await appWindow.destroy();
          });
        });
      }).catch((error) => this.reportError(error));
    }
  }

  private async flushCurrent() {
    await this.saveQueue.catch(() => undefined);
    while (this.current && this.dirty) await this.saveCurrent(true);
  }

  private setupUpdateNotice() {
    const bar = document.getElementById("update-notice");
    const text = document.getElementById("update-notice-text");
    const download = document.getElementById("btn-update-download");
    const later = document.getElementById("btn-update-later");
    if (!bar || !text || !download || !later) return;

    const resetUpdateNotice = () => {
      download.classList.remove("hidden");
      later.textContent = t("update.later");
      bar.classList.remove("is-info");
      bar.setAttribute("aria-label", t("update.region"));
    };

    const hide = () => {
      this.updateOffer = null;
      bar.classList.add("hidden");
      resetUpdateNotice();
    };

    download.addEventListener("click", () => {
      const url = this.updateOffer?.url;
      if (url) void openFolioReleaseUrl(url);
    });
    later.addEventListener("click", () => {
      if (this.updateOffer) dismissUpdateVersion(this.updateOffer.version);
      hide();
    });

    this.updateNoticeUi = {
      show: (offer) => {
        resetUpdateNotice();
        this.updateOffer = offer;
        text.textContent = t("update.available", { version: offer.version });
        bar.classList.remove("hidden");
      },
      showNoUpdate: (version: string) => {
        this.updateOffer = null;
        resetUpdateNotice();
        text.textContent = t("update.noneDetail", { version });
        download.classList.add("hidden");
        later.textContent = t("update.ok");
        bar.classList.add("is-info");
        bar.setAttribute("aria-label", t("update.regionNone"));
        bar.classList.remove("hidden");
      },
    };
    if (this.native) scheduleDesktopUpdateCheck(this.updateNoticeUi);
  }

  private setPinnedStatus(text: string, pinMs = 0) {
    this.els.statusSave.textContent = text;
    this.updateStatusPinnedUntil = pinMs > 0 ? Date.now() + pinMs : 0;
  }

  private setStatusSave(text: string) {
    if (this.updateStatusPinnedUntil > Date.now()) return;
    this.els.statusSave.textContent = text;
  }

  private async syncAppMenuVersion() {
    const version = await getAppVersion();
    this.els.appMenuVersion.textContent = t("menu.versionLabel", { version });
  }

  private async checkUpdatesManually() {
    const btn = document.getElementById("menu-check-updates") as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("menu.checkingUpdates");
    }
    this.els.statusSave.textContent = t("menu.checkingUpdates");
    try {
      const result = await runManualUpdateCheck(this.updateNoticeUi ?? undefined);
      if (result.status === "offer") {
        this.setPinnedStatus(t("update.available", { version: result.offer.version }));
      } else if (result.status === "current") {
        const label = result.latestTag ?? result.current;
        this.updateNoticeUi?.showNoUpdate?.(label);
        this.setPinnedStatus(t("update.noneDetail", { version: label }), 12_000);
      } else {
        this.setPinnedStatus(t("menu.updateCheckFailed"), 8000);
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("menu.checkUpdates");
      }
    }
  }

  private setupMobileShell() {
    this.els.app.classList.toggle("is-mobile", this.mobile);
    this.els.app.classList.toggle("is-web", this.webOnly);

    if (this.webOnly) {
      document.getElementById("btn-open-library")?.classList.add("mobile-hide");
      document.getElementById("welcome-open")?.classList.add("mobile-hide");
      document.getElementById("sidebar-overflow")?.classList.remove("hidden");
      const folderItem = document.getElementById("menu-save-folder");
      if (folderItem && !canUseDirectoryPicker()) {
        folderItem.classList.add("is-unsupported");
      }
      this.sidebarMenu?.syncItems();
    }

    if (!this.mobile) return;

    this.els.app.classList.add("sidebar-collapsed");
    this.settings.showBacklinks = false;
    if (!this.webOnly) {
      document.getElementById("btn-open-library")?.classList.add("mobile-hide");
      document.getElementById("welcome-open")?.classList.add("mobile-hide");
    }
  }

  private setLibraryOpen(open: boolean) {
    this.els.app.classList.toggle("sidebar-collapsed", !open);
    if (!open) this.sidebarMenu?.close();
    this.syncScrim();
  }

  private setLinksOpen(open: boolean) {
    this.settings.showBacklinks = open;
    this.syncChip(this.els.btnBacklinks, open);
    this.els.app.classList.toggle("backlinks-hidden", !open);
    this.syncScrim();
  }

  private syncScrim() {
    if (!this.mobile) {
      this.els.scrim.classList.add("hidden");
      return;
    }
    const libraryOpen = !this.els.app.classList.contains("sidebar-collapsed");
    const linksOpen = !this.els.app.classList.contains("backlinks-hidden");
    this.els.scrim.classList.toggle("hidden", !(libraryOpen || linksOpen));
  }

  private closeMobileOverlays() {
    if (!this.mobile) return;
    this.setLibraryOpen(false);
    this.setLinksOpen(false);
  }

  private bindUi() {
    document.getElementById("btn-new-note")!.addEventListener("click", () => void this.runAction(() => this.newNote()));
    document.getElementById("btn-open-library")!.addEventListener("click", () => void this.runAction(() => this.pickLibrary()));
    document.getElementById("btn-refresh")!.addEventListener("click", () => void this.runAction(() => this.refreshLibrary()));
    document.getElementById("btn-toggle-sidebar")!.addEventListener("click", () => {
      if (this.mobile) {
        const open = this.els.app.classList.contains("sidebar-collapsed");
        if (open) this.setLinksOpen(false);
        this.setLibraryOpen(open);
      } else {
        this.els.app.classList.toggle("sidebar-collapsed");
      }
    });
    document.getElementById("btn-close-sidebar")?.addEventListener("click", () => this.setLibraryOpen(false));
    document.getElementById("btn-close-backlinks")?.addEventListener("click", () => this.setLinksOpen(false));
    this.els.scrim.addEventListener("click", () => this.closeMobileOverlays());
    document.getElementById("welcome-open")!.addEventListener("click", () => void this.runAction(() => this.pickLibrary()));
    document.getElementById("welcome-demo")!.addEventListener("click", () => void this.runAction(() => this.createDemo()));

    const menuTrigger = document.getElementById("btn-sidebar-menu") as HTMLButtonElement | null;
    const menuPanel = document.getElementById("sidebar-menu");
    if (menuTrigger && menuPanel) {
      this.sidebarMenu = createSidebarMenu(menuTrigger, menuPanel);
    }
    document.getElementById("menu-export-library")?.addEventListener("click", () => void this.runAction(() => this.exportLibrary()));
    document.getElementById("menu-export-note")?.addEventListener("click", () => void this.runAction(() => this.exportCurrentNote()));
    document.getElementById("menu-import-md")?.addEventListener("click", () => {
      document.getElementById("import-files")?.dispatchEvent(new MouseEvent("click"));
    });
    document.getElementById("import-files")?.addEventListener("change", (e) => {
      const input = e.target as HTMLInputElement;
      const files = Array.from(input.files ?? []);
      if (files.length) void this.runAction(() => this.importFiles(files));
      input.value = "";
    });
    document.getElementById("menu-save-folder")?.addEventListener("click", () => void this.runAction(() => this.saveToFolder()));

    const appMenuTrigger = document.getElementById("btn-app-menu") as HTMLButtonElement | null;
    const appMenuPanel = document.getElementById("app-menu");
    if (appMenuTrigger && appMenuPanel) {
      this.appMenu = createSidebarMenu(appMenuTrigger, appMenuPanel);
      appMenuTrigger.addEventListener("click", () => {
        if (!this.appMenu?.isOpen()) void this.syncAppMenuVersion();
      });
    }
    document.getElementById("menu-check-updates")?.addEventListener("click", () => {
      void this.checkUpdatesManually();
    });
    document.getElementById("app-menu-export-library")?.addEventListener("click", () => {
      void this.runAction(() => this.exportLibrary());
    });
    document.getElementById("app-menu-export-note")?.addEventListener("click", () => {
      void this.runAction(() => this.exportCurrentNote());
    });

    const changeSort = () => {
      this.settings.sortBy = this.els.sortBy.value === "createdAt" ? "createdAt" : "title";
      this.settings.sortDirection = this.els.sortDirection.value === "desc" ? "desc" : "asc";
      this.renderNoteList();
      void saveSettings(this.settings).catch(error => this.reportError(error));
    };
    this.els.sortBy.addEventListener("change", changeSort);
    this.els.sortDirection.addEventListener("change", changeSort);

    this.els.btnFocus.addEventListener("click", () => {
      void this.setImmersiveFocus(!this.settings.focusMode);
    });
    this.els.btnExitFocus.addEventListener("click", () => {
      void this.setImmersiveFocus(false);
    });

    this.els.btnTypewriter.addEventListener("click", () => {
      if (this.settings.focusMode) return;
      this.settings.typewriter = !this.settings.typewriter;
      this.editor.setTypewriter(this.settings.typewriter);
      this.syncChip(this.els.btnTypewriter, this.settings.typewriter);
      void saveSettings(this.settings);
    });

    this.els.btnPreview.addEventListener("click", () => this.togglePreview());
    this.els.btnTheme.addEventListener("click", () => {
      const next = this.settings.theme === "light" ? "dark" : "light";
      this.settings.theme = next;
      this.applyTheme(next);
      this.editor.setTheme(next);
      void saveSettings(this.settings);
    });

    this.els.menuRemoteImagesGlobal.addEventListener("click", () => {
      this.settings.previewRemoteImagesGlobal = !this.settings.previewRemoteImagesGlobal;
      void saveSettings(this.settings);
      this.syncRemoteImageChips();
      if (this.previewOn) void this.renderPreview(this.editor.getText());
    });
    this.els.menuRemoteImagesNote.addEventListener("click", () => {
      if (!this.current) return;
      const path = this.current.path;
      const overrides = { ...this.settings.previewRemoteImagesNotes };
      if (this.previewImagesEnabledForNote()) overrides[path] = false;
      else delete overrides[path];
      this.settings.previewRemoteImagesNotes = overrides;
      void saveSettings(this.settings);
      this.syncRemoteImageChips();
      if (this.previewOn) void this.renderPreview(this.editor.getText());
    });

    this.els.btnLocale.addEventListener("click", () => {
      this.settings.uiLocale = this.settings.uiLocale === "cs" ? "en" : "cs";
      this.applyLocale();
      void saveSettings(this.settings);
    });

    this.els.btnBacklinks.addEventListener("click", () => {
      if (this.mobile) {
        const open = this.els.app.classList.contains("backlinks-hidden");
        if (open) this.setLibraryOpen(false);
        this.setLinksOpen(open);
        return;
      }
      this.settings.showBacklinks = !this.settings.showBacklinks;
      this.applyChrome();
      void saveSettings(this.settings);
    });

    this.els.fontMenu.innerHTML = EDITOR_FONTS.map(
      (f) =>
        `<button type="button" class="font-option" role="option" data-font="${f.id}" aria-selected="${
          f.id === this.settings.editorFont
        }" style="font-family:${f.css}">${f.label}</button>`,
    ).join("");
    this.els.fontSelect.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleFontMenu();
    });
    this.els.fontMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = (e.target as HTMLElement).closest(".font-option") as HTMLElement | null;
      if (!btn?.dataset.font) return;
      const next = btn.dataset.font as EditorFontId;
      this.settings.editorFont = next;
      this.applyFont(next);
      void saveSettings(this.settings);
      this.closeFontMenu();
    });
    this.els.fontPicker.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => this.closeFontMenu());

    this.els.titleInput.addEventListener("input", () => this.previewSidebarTitle());
    this.els.titleInput.addEventListener("blur", () => void this.runAction(() => this.renameCurrent()));
    this.els.titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.els.titleInput.blur();
        this.editor.focus();
      }
    });

    this.els.commandInput.addEventListener("input", () => { this.commandIndex = 0; this.renderCommandResults(); });
    this.els.commandInput.addEventListener("keydown", (e) => this.onCommandKey(e));
    this.els.commandPalette.addEventListener("click", (e) => {
      if (e.target === this.els.commandPalette) this.closeCommandPalette();
    });
  }

  private bindShortcuts() {
    window.addEventListener("keydown", (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        void this.runAction(() => this.newNote());
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void this.saveCurrent(true).catch((error) => this.reportError(error));
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        void this.setImmersiveFocus(!this.settings.focusMode);
      } else if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        this.togglePreview();
      } else if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        this.openCommandPalette();
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (this.settings.focusMode) return;
        document.getElementById("btn-toggle-sidebar")!.click();
      } else if (e.key === "Escape") {
        if (this.settings.focusMode) {
          e.preventDefault();
          void this.setImmersiveFocus(false);
          return;
        }
        this.closeCommandPalette();
        this.closeMobileOverlays();
        this.closeFontMenu();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      // Browser Esc / OS exit: keep immersive chrome in sync only when leaving FS while Focus is on.
      if (!document.fullscreenElement && this.settings.focusMode && this.webOnly) {
        // Stay in immersive UI without FS — user can still leave via the exit button.
      }
    });
  }

  /** Immersive Focus hides chrome; Typewriter remains an independent preference. */
  private async setImmersiveFocus(enabled: boolean) {
    if (enabled === this.settings.focusMode && this.els.app.classList.contains("immersive-focus") === enabled) {
      return;
    }

    if (enabled) {
      this.focusSnapshot = {
        showBacklinks: this.settings.showBacklinks,
        sidebarCollapsed: this.els.app.classList.contains("sidebar-collapsed"),
        previewOn: this.previewOn,
      };

      this.settings.focusMode = true;

      if (this.previewOn) this.togglePreview();
      this.closeCommandPalette();
      this.closeFontMenu();
      this.closeMobileOverlays();

      this.els.app.classList.add("immersive-focus", "sidebar-collapsed", "backlinks-hidden");
      this.els.btnExitFocus.classList.remove("hidden");

      this.editor.setFocusMode(true);
      this.editor.setTypewriter(this.settings.typewriter);
      this.syncChip(this.els.btnFocus, true);
      this.syncChip(this.els.btnTypewriter, this.settings.typewriter);
      this.syncChip(this.els.btnBacklinks, false);

      await enterFullscreen();
      this.editor.focus();
    } else {
      const snap = this.focusSnapshot;
      this.focusSnapshot = null;
      this.settings.focusMode = false;

      const showBacklinks = snap?.showBacklinks ?? this.settings.showBacklinks;
      this.settings.showBacklinks = showBacklinks;

      this.els.app.classList.remove("immersive-focus");
      this.els.btnExitFocus.classList.add("hidden");
      if (snap) {
        this.els.app.classList.toggle("sidebar-collapsed", snap.sidebarCollapsed);
      }
      this.els.app.classList.toggle("backlinks-hidden", !showBacklinks);

      this.editor.setFocusMode(false);
      this.editor.setTypewriter(this.settings.typewriter);
      this.syncChip(this.els.btnFocus, false);
      this.syncChip(this.els.btnTypewriter, this.settings.typewriter);
      this.syncChip(this.els.btnBacklinks, showBacklinks);

      await exitFullscreen();
      this.syncScrim();
      this.editor.focus();
    }

    void saveSettings(this.settings);
  }

  private applyTheme(theme: "light" | "dark") {
    this.els.app.dataset.theme = theme;
    this.els.btnTheme.textContent = theme === "light" ? t("chip.themeDark") : t("chip.themeLight");
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#000000" : "#f3efe4",
    );
  }

  private applyFont(font: EditorFontId) {
    this.els.app.dataset.font = font;
    this.els.app.style.setProperty("--font-body", fontCss(font));
    const label = EDITOR_FONTS.find((f) => f.id === font)?.label ?? font;
    this.els.fontSelectLabel.textContent = label;
    this.els.fontMenu.querySelectorAll(".font-option").forEach((el) => {
      const btn = el as HTMLElement;
      btn.setAttribute("aria-selected", String(btn.dataset.font === font));
    });
  }

  private toggleFontMenu() {
    const open = this.els.fontMenu.classList.contains("hidden");
    this.els.fontMenu.classList.toggle("hidden", !open);
    this.els.fontPicker.classList.toggle("open", open);
    this.els.fontSelect.setAttribute("aria-expanded", String(open));
  }

  private closeFontMenu() {
    this.els.fontMenu.classList.add("hidden");
    this.els.fontPicker.classList.remove("open");
    this.els.fontSelect.setAttribute("aria-expanded", "false");
  }

  private applyChrome() {
    this.syncChip(this.els.btnFocus, this.settings.focusMode);
    this.syncChip(this.els.btnTypewriter, this.settings.typewriter);
    this.syncChip(this.els.btnBacklinks, this.settings.showBacklinks);
    this.els.app.classList.toggle("backlinks-hidden", !this.settings.showBacklinks);

    if (this.settings.focusMode) {
      // Rehydrate immersive chrome after reload (fullscreen needs a fresh user gesture).
      this.focusSnapshot = this.focusSnapshot ?? {
        showBacklinks: this.settings.showBacklinks,
        sidebarCollapsed: this.els.app.classList.contains("sidebar-collapsed"),
        previewOn: this.previewOn,
      };
      this.els.app.classList.add("immersive-focus", "sidebar-collapsed", "backlinks-hidden");
      this.els.btnExitFocus.classList.remove("hidden");
      this.editor?.setFocusMode(true);
      this.editor?.setTypewriter(this.settings.typewriter);
      this.syncChip(this.els.btnBacklinks, false);
    } else {
      this.els.app.classList.remove("immersive-focus");
      this.els.btnExitFocus.classList.add("hidden");
      this.editor?.setFocusMode(false);
      this.editor?.setTypewriter(this.settings.typewriter);
    }

    this.syncScrim();
  }

  private syncChip(el: HTMLElement, active: boolean) {
    el.dataset.active = String(active);
  }

  private showWelcome(show: boolean) {
    this.els.welcome.classList.toggle("hidden", !show);
    this.els.app.classList.toggle("welcome-open", show);
  }

  private async pickLibrary() {
    if (!this.native) {
      await this.createDemo();
      return;
    }
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      directory: true,
      recursive: true,
      multiple: false,
      title: t("dialog.pickLibrary"),
    });
    if (!selected || Array.isArray(selected)) return;
    await this.openLibrary(selected);
  }

  private async createDemo() {
    const path = await getDefaultLibraryPath();
    if (this.native) await ensureLibraryFsScope(path);
    const first = await createDemoLibrary(path);
    await this.openLibrary(path, first);
  }

  private async exportLibrary() {
    if (!this.settings.libraryPath) return;
    await this.flushCurrent();
    try {
      this.els.statusSave.textContent = t("status.exporting");
      const mode = await exportLibraryToDisk(this.settings.libraryPath);
      this.els.statusSave.textContent =
        mode === "shared" ? t("status.exportShared") : t("status.exportDownloaded");
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        this.els.statusSave.textContent = t("status.exportCancelled");
        return;
      }
      console.error(error);
      this.els.statusSave.textContent = t("status.exportFailed");
    }
  }

  private async importFiles(files: File[]) {
    await this.flushCurrent();
    if (!this.settings.libraryPath) {
      await this.createDemo();
    }
    try {
      const imported = await importMarkdownFiles(files, this.settings.libraryPath!);
      await this.refreshLibrary(imported[0] ?? this.settings.lastOpenPath);
      this.els.statusSave.textContent =
        imported.length === 1 ? t("status.importOne") : t("status.importMany", { count: imported.length });
    } catch (error) {
      console.error(error);
      this.els.statusSave.textContent = t("status.importFailed");
    }
  }

  private async saveToFolder() {
    if (!this.settings.libraryPath) return;
    await this.flushCurrent();
    try {
      const count = await saveLibraryToDirectory(this.settings.libraryPath);
      this.els.statusSave.textContent = t("status.savedManyToFolder", { count });
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        this.els.statusSave.textContent = t("status.saveFolderCancelled");
        return;
      }
      console.error(error);
      this.els.statusSave.textContent = t("status.saveFolderFailed");
    }
  }

  async exportCurrentNote() {
    if (!this.current) return;
    await this.flushCurrent();
    try {
      const mode = await exportNoteToDisk(this.current.path, this.current.title);
      this.els.statusSave.textContent =
        mode === "shared" ? t("status.noteShared") : t("status.noteDownloaded");
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return;
      console.error(error);
    }
  }

  private async openLibrary(path: string, openPath?: string | null) {
    await this.flushCurrent();
    if (this.native) await ensureLibraryFsScope(path);
    this.settings.libraryPath = path;
    const label = this.webOnly
      ? t("library.browserLabel")
      : isMarketingDesktopCapture()
        ? MARKETING_DESKTOP_LIBRARY_LABEL
        : path;
    this.els.libraryPath.textContent = label;
    this.els.libraryPath.title = path;
    this.showWelcome(false);
    await this.refreshLibrary(openPath ?? this.settings.lastOpenPath);
    await saveSettings(this.settings);
  }

  private async refreshLibrary(preferredPath?: string | null) {
    if (!this.settings.libraryPath) return;
    await this.flushCurrent();
    const migrated = await ensureEnglishTutorialIfNeeded(this.settings.libraryPath);
    const welcomeRepaired =
      this.native && (await repairWelcomeTutorialLibrary(this.settings.libraryPath));
    const keepPath = migrated ?? preferredPath ?? this.current?.path;
    this.notes = await listNotes(this.settings.libraryPath);
    this.index.setNotes(this.notes);

    // Index contents for backlinks
    await Promise.all(
      this.notes.map(async (note) => {
        try {
          const text = await readNote(note.path);
          this.index.setContent(note.path, text);
        } catch {
          /* ignore unreadable */
        }
      }),
    );

    this.renderNoteList();
    this.editor.reconfigureWiki();

    const target =
      this.notes.find((n) => n.path === keepPath) ??
      this.notes[0] ??
      null;

    if (target) {
      await this.openNote(target);
    } else {
      this.current = null;
      this.dirty = false;
      this.clearSaveTimer();
      this.els.titleInput.value = "";
      this.suppressChange = true;
      this.editor.setText("");
      this.suppressChange = false;
      this.renderLinks();
      this.updateStats("");
      this.els.previewRoot.replaceChildren();
    }
  }

  private renderNoteList() {
    this.notes = sortNotes(this.notes, this.settings);
    this.els.noteList.replaceChildren();
    if (!this.notes.length) {
      const empty = document.createElement("div");
      empty.className = "note-empty";
      empty.textContent = t("empty.notes");
      this.els.noteList.appendChild(empty);
      return;
    }
    if (this.current) this.expandFoldersAround(this.current.relativePath);
    this.renderFolder(this.fileTree(this.notes), this.els.noteList, 0);
  }

  private expandFoldersAround(relativePath: string) {
    const parts = relativePath.split("/").filter(Boolean);
    parts.pop();
    let path = "";
    for (const part of parts) {
      path = path ? `${path}/${part}` : part;
      this.collapsedFolders.delete(path);
    }
  }

  private fileTree(notes: NoteMeta[]) {
    const root = folderNode("", "");
    for (const note of notes) {
      const parts = note.relativePath.split("/").filter(Boolean);
      parts.pop();
      let node = root;
      let path = "";
      for (const part of parts) {
        path = path ? `${path}/${part}` : part;
        let child = node.folders.get(part);
        if (!child) {
          child = folderNode(part, path);
          node.folders.set(part, child);
        }
        node = child;
      }
      node.notes.push(note);
    }
    return root;
  }

  private renderFolder(node: FolderNode, parent: HTMLElement, depth: number) {
    const direction = this.settings.sortDirection === "desc" ? -1 : 1;
    const folders = [...node.folders.values()].sort(
      (a, b) =>
        a.name.localeCompare(b.name, sortLocaleTag(this.settings.uiLocale), {
          sensitivity: "base",
          numeric: true,
        }) * direction,
    );
    for (const folder of folders) {
      const collapsed = this.collapsedFolders.has(folder.path);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "tree-folder";
      row.style.setProperty("--depth", String(depth));
      row.setAttribute("aria-expanded", collapsed ? "false" : "true");
      const chevron = document.createElement("span");
      chevron.className = "tree-chevron";
      chevron.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "tree-label";
      label.textContent = folder.name;
      row.append(chevron, label);
      row.addEventListener("click", () => {
        if (this.collapsedFolders.has(folder.path)) this.collapsedFolders.delete(folder.path);
        else this.collapsedFolders.add(folder.path);
        this.renderNoteList();
      });
      parent.appendChild(row);
      if (!collapsed) this.renderFolder(folder, parent, depth + 1);
    }
    for (const note of node.notes) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "note-item";
      item.style.setProperty("--depth", String(depth));
      if (this.current?.path === note.path) item.classList.add("active");
      const title = document.createElement("span");
      title.className = "note-item-title";
      title.textContent = note.title;
      item.append(title);
      item.addEventListener("click", () => void this.runAction(() => this.openNote(note)));
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (confirm(t("confirm.delete", { title: note.title }))) void this.runAction(() => this.removeNote(note));
      });
      parent.appendChild(item);
    }
  }

  private async openNote(note: NoteMeta) {
    await this.flushCurrent();
    const stored = await readNote(note.path);
    const draft = await readDraft(note.path);
    const text = draft ?? stored;
    const sameDocument = this.current?.path === note.path && this.editor.getText() === text;
    this.current = note;
    this.settings.lastOpenPath = note.path;
    void saveSettings(this.settings);

    this.els.titleInput.value = note.title;
    this.suppressChange = true;
    if (!sameDocument) {
      this.editor.setText(text);
      this.els.previewPane.scrollTop = 0;
    }
    this.suppressChange = false;
    this.index.setContent(note.path, text);
    this.dirty = text !== stored;
    this.revision += 1;
    this.els.statusSave.textContent = this.dirty ? t("status.draftRecovering") : t("status.ready");
    if (this.dirty) this.scheduleSave();
    else await forgetDraft(note.path, stored);
    this.renderNoteList();
    this.renderLinks();
    this.updateStats(text);
    if (this.previewOn) void this.renderPreview(text);
    this.syncRemoteImageChips();
    this.closeMobileOverlays();
    if (!this.busy) this.editor.setReadOnly(false);
    if (this.previewOn) this.els.previewPane.focus({ preventScroll: true });
    else this.editor.focus();
  }

  private async openWiki(title: string, createIfMissing: boolean) {
    const existing = this.index.resolve(title);
    if (existing) {
      await this.openNote(existing);
      return;
    }
    if (!createIfMissing || !this.settings.libraryPath) return;
    if (!confirm(t("confirm.createWiki", { title }))) return;
    const path = await createNote(this.settings.libraryPath, title, `# ${title}\n\n`);
    await this.refreshLibrary(path);
  }

  private async newNote() {
    if (!this.settings.libraryPath) {
      await this.pickLibrary();
      if (!this.settings.libraryPath) return;
    }
    await this.flushCurrent();
    const untitled = defaultNoteTitle();
    const path = await createNote(this.settings.libraryPath, untitled, `# ${untitled}\n\n`);
    await this.refreshLibrary(path);
  }

  private async removeNote(note: NoteMeta) {
    await this.flushCurrent();
    this.clearSaveTimer();
    await deleteNote(note.path);
    await forgetDraft(note.path);
    this.index.removeNote(note.path);
    if (this.current?.path === note.path) {
      this.current = null;
      this.dirty = false;
      this.settings.lastOpenPath = null;
    }
    await this.refreshLibrary();
  }

  private previewSidebarTitle() {
    if (!this.current) return;
    const draft = this.els.titleInput.value.trim() || defaultNoteTitle();
    const active = this.els.noteList.querySelector(".note-item.active .note-item-title");
    if (active) active.textContent = draft;
  }

  private async renameCurrent() {
    if (!this.current || this.renaming) return;
    const nextTitle = this.els.titleInput.value.trim();
    if (!nextTitle) {
      this.els.titleInput.value = this.current.title;
      this.previewSidebarTitle();
      return;
    }
    if (nextTitle === this.current.title) return;

    const previous = this.current;
    this.renaming = true;
    try {
      await this.flushCurrent();
      this.clearSaveTimer();
      const newPath = await renameNote(previous.path, nextTitle);
      await forgetDraft(previous.path);
      const renamedTitle = newPath.split(/[/\\]/).pop()?.replace(/\.md$/i, "") || nextTitle;

      // Update in-memory list immediately so the sidebar never lags.
      const note = this.notes.find((n) => n.path === previous.path);
      if (note) {
        note.path = newPath;
        note.title = renamedTitle;
        note.relativePath = note.relativePath.includes("/")
          ? `${note.relativePath.slice(0, note.relativePath.lastIndexOf("/") + 1)}${renamedTitle}.md`
          : `${renamedTitle}.md`;
        note.id = note.relativePath.replace(/\.md$/i, "").toLowerCase();
      }
      this.current = note ?? { ...previous, path: newPath, title: renamedTitle };
      this.settings.lastOpenPath = newPath;
      this.els.titleInput.value = this.current.title;
      this.index.setNotes(this.notes);
      this.renderNoteList();
      this.editor.reconfigureWiki();
      void saveSettings(this.settings);
      await this.refreshLibrary(newPath);
    } catch (error) {
      console.error("Rename failed", error);
      this.els.titleInput.value = previous.title;
      this.renderNoteList();
      this.els.statusSave.textContent = t("status.renameFailed");
    } finally {
      this.renaming = false;
    }
  }

  private handleEditorChange(text: string) {
    if (this.suppressChange || !this.current) return;
    this.dirty = true;
    this.revision += 1;
    void rememberDraft(this.current.path, text).then((journaled) => {
      if (!this.current || this.suppressChange) return;
      this.els.statusSave.textContent = journaled ? t("status.unsaved") : t("status.unsavedNoJournal");
    });
    this.index.setContent(this.current.path, text);
    this.renderLinks();
    this.updateStats(text);
    if (this.previewOn) void this.renderPreview(text);

    this.scheduleSave();
  }

  private clearSaveTimer() {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }

  private scheduleSave() {
    this.clearSaveTimer();
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.saveCurrent(false).catch((error) => this.reportError(error));
    }, 450);
  }

  private saveCurrent(manual: boolean): Promise<void> {
    if (!this.current || !this.dirty) return this.saveQueue;
    this.clearSaveTimer();
    const path = this.current.path;
    const text = this.editor.getText();
    const revision = this.revision;
    const save = this.saveQueue.catch(() => undefined).then(async () => {
      await writeNote(path, text);
      await forgetDraft(path, text);
      if (this.current?.path === path && this.revision === revision) {
        this.index.setContent(path, text);
        this.dirty = false;
        this.setStatusSave(manual ? t("status.saved") : t("status.autosaved"));
      }
      const note = this.notes.find((n) => n.path === path);
      if (note) note.mtime = Date.now();
    });
    this.saveQueue = save;
    return save;
  }

  private renderLinks() {
    if (!this.current) {
      this.els.backlinksList.innerHTML = "";
      this.els.outgoingList.innerHTML = "";
      this.els.backlinksCount.textContent = "0";
      return;
    }

    const backlinks = this.index.getBacklinks(this.current.path);
    this.els.backlinksCount.textContent = String(backlinks.length);
    this.els.backlinksList.innerHTML = "";
    if (!backlinks.length) {
      const empty = document.createElement("div");
      empty.className = "link-empty";
      empty.textContent = t("empty.backlinks");
      this.els.backlinksList.appendChild(empty);
    } else {
      for (const note of backlinks) {
        this.els.backlinksList.appendChild(this.linkButton(note.title, () => void this.runAction(() => this.openNote(note))));
      }
    }

    const outgoing = this.index.getOutgoing(this.current.path);
    this.els.outgoingList.innerHTML = "";
    if (!outgoing.length) {
      const empty = document.createElement("div");
      empty.className = "link-empty";
      empty.textContent = t("empty.outgoing");
      this.els.outgoingList.appendChild(empty);
    } else {
      for (const item of outgoing) {
        const label = item.note ? item.title : t("links.missing", { title: item.title });
        this.els.outgoingList.appendChild(
          this.linkButton(label, () => void this.runAction(() => this.openWiki(item.title, true)), !item.note),
        );
      }
    }
  }

  private linkButton(label: string, onClick: () => void, missing = false) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `link-item${missing ? " missing" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  private updateStats(text: string) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.els.statusWords.textContent = formatWordCount(words);
    this.els.statusChars.textContent = formatCharCount(text.length);
  }

  /** Per-note “load images” — when off, block local and remote images in preview. */
  private previewImagesEnabledForNote(): boolean {
    if (!this.current) return true;
    return this.settings.previewRemoteImagesNotes[this.current.path] !== false;
  }

  private allowRemoteImagesForCurrent(): boolean {
    if (!this.previewImagesEnabledForNote()) return false;
    return this.settings.previewRemoteImagesGlobal;
  }

  private syncRemoteImageChips() {
    const globalOn = this.settings.previewRemoteImagesGlobal;
    this.els.menuRemoteImagesGlobal.setAttribute("aria-checked", String(globalOn));
    const noteOn = this.previewImagesEnabledForNote();
    this.els.menuRemoteImagesNote.setAttribute("aria-checked", String(noteOn));
    this.els.menuRemoteImagesNote.toggleAttribute("disabled", !this.current);
    const hasLibrary = Boolean(this.settings.libraryPath);
    document.getElementById("app-menu-export-library")?.toggleAttribute("disabled", !hasLibrary);
    document.getElementById("app-menu-export-note")?.toggleAttribute("disabled", !this.current);
  }

  private togglePreview() {
    this.previewOn = !this.previewOn;
    this.syncChip(this.els.btnPreview, this.previewOn);
    this.els.editorRoot.classList.toggle("hidden", this.previewOn);
    this.els.previewPane.classList.toggle("hidden", !this.previewOn);
    if (this.previewOn) {
      this.syncRemoteImageChips();
      void this.renderPreview(this.editor.getText());
      this.els.previewPane.focus({ preventScroll: true });
    }
    else this.editor.focus();
  }

  private convertFileSrcFn: ((path: string) => string) | null = null;
  private previewAssetReady: Promise<void> = this.native
    ? import("@tauri-apps/api/core").then(({ convertFileSrc }) => {
        this.convertFileSrcFn = convertFileSrc;
      })
    : Promise.resolve();

  private async hydratePreviewLocalImages() {
    if (!this.previewImagesEnabledForNote()) return;
    if (!this.native || !this.settings.libraryPath || !this.convertFileSrcFn) return;
    const { exists } = await import("@tauri-apps/plugin-fs");
    const libraryPath = this.settings.libraryPath;
    const convert = this.convertFileSrcFn;
    const imgs = [...this.els.previewRoot.querySelectorAll("img")];
    await Promise.all(
      imgs.map(async (img) => {
        const rel = img.getAttribute("src") ?? "";
        if (!isLocalPreviewImageSrc(rel)) return;
        for (const cand of libraryImageRefCandidates(rel)) {
          const abs = joinLibraryRelativePath(libraryPath, cand);
          try {
            if (await exists(abs)) {
              img.src = convert(abs);
              return;
            }
          } catch {
            /* try next extension */
          }
        }
      }),
    );
  }

  private async insertImageFromFile(file: File): Promise<string | null> {
    if (!this.settings.libraryPath || !this.current) return null;
    if (this.editor.view.state.readOnly) return null;
    if (!isImageFile(file)) {
      this.els.statusSave.textContent = t("status.imageUnsupported");
      return null;
    }
    try {
      const src = await writeLibraryImage(this.settings.libraryPath, file);
      this.els.statusSave.textContent = t("status.imageInserted");
      const label = file.name || `image.${resolveImageMime(file).split("/")[1] ?? "png"}`;
      return imageMarkdown(src, altTextFromFileName(label));
    } catch (error) {
      console.error(error);
      this.els.statusSave.textContent = t("status.imageInsertFailed");
      return null;
    }
  }

  private async insertImageFromPath(path: string): Promise<string | null> {
    if (!this.native || !this.settings.libraryPath || !this.current) return null;
    if (this.editor.view.state.readOnly) return null;
    const mime = imageMimeFromPath(path);
    if (!mime) {
      this.els.statusSave.textContent = t("status.imageUnsupported");
      return null;
    }
    const name = path.split(/[/\\]/).pop() ?? "image.png";
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const bytes = await invoke<number[]>("read_dropped_image_file", { path });
      const src = await writeLibraryImageBytes(
        this.settings.libraryPath,
        new Uint8Array(bytes),
        name,
        mime,
      );
      this.els.statusSave.textContent = t("status.imageInserted");
      return imageMarkdown(src, altTextFromFileName(name));
    } catch (error) {
      console.error(error);
      this.els.statusSave.textContent = t("status.imageInsertFailed");
      return null;
    }
  }

  private async renderPreview(text: string) {
    if (this.native) await this.previewAssetReady;
    this.els.previewRoot.innerHTML = renderMarkdown(text, this.index, {
      allowRemoteImages: this.allowRemoteImagesForCurrent(),
      allowLocalImages: this.previewImagesEnabledForNote(),
      blockedImageLabel: t("preview.remoteBlocked"),
      resolveAssetSrc: (src) => (isLocalPreviewImageSrc(src) ? normalizeLibraryImageRef(src) : src),
    });
    await this.hydratePreviewLocalImages();
    this.els.previewRoot.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      if (a.dataset.wikiTitle) {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const title = a.dataset.wikiTitle!;
          void this.runAction(() => this.openWiki(title, true));
        });
        return;
      }
      if (!/^(https?:|mailto:|#)/i.test(href)) a.removeAttribute("href");
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noreferrer");
    });
  }

  private openCommandPalette() {
    this.els.commandPalette.classList.remove("hidden");
    this.els.commandInput.value = "";
    this.commandIndex = 0;
    this.renderCommandResults();
    this.els.commandInput.focus();
  }

  private closeCommandPalette() {
    this.els.commandPalette.classList.add("hidden");
  }

  private renderCommandResults() {
    this.commandItems = this.index.search(this.els.commandInput.value, 10);
    this.els.commandResults.innerHTML = "";
    this.commandItems.forEach((note, i) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = `command-row${i === this.commandIndex ? " active" : ""}`;
      row.innerHTML = `<span>${escapeHtml(note.title)}</span><small>${escapeHtml(note.relativePath)}</small>`;
      row.addEventListener("click", () => {
        this.closeCommandPalette();
        void this.runAction(() => this.openNote(note));
      });
      this.els.commandResults.appendChild(row);
    });
  }

  private onCommandKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.commandIndex = Math.min(this.commandIndex + 1, Math.max(this.commandItems.length - 1, 0));
      this.renderCommandResults();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.commandIndex = Math.max(this.commandIndex - 1, 0);
      this.renderCommandResults();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const note = this.commandItems[this.commandIndex];
      if (note) {
        this.closeCommandPalette();
        void this.runAction(() => this.openNote(note));
      } else if (this.els.commandInput.value.trim()) {
        this.closeCommandPalette();
        void this.runAction(() => this.openWiki(this.els.commandInput.value.trim(), true));
      }
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
