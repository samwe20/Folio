/** Accessible sidebar overflow menu (focus trap, arrows, Escape, click-outside). */
export type SidebarMenuController = {
  open(): void;
  close(): void;
  isOpen(): boolean;
  syncItems(): void;
};

export function createSidebarMenu(
  trigger: HTMLButtonElement,
  panel: HTMLElement,
  onClose?: () => void,
): SidebarMenuController {
  const itemSelector =
    '[role="menuitem"]:not(.hidden):not([hidden]), [role="menuitemcheckbox"]:not(.hidden):not([hidden])';

  const items = () =>
    [...panel.querySelectorAll<HTMLElement>(itemSelector)].filter(
      (el) => !el.classList.contains("is-unsupported"),
    );

  let open = false;

  const setExpanded = (value: boolean) => {
    open = value;
    trigger.setAttribute("aria-expanded", String(value));
    panel.classList.toggle("hidden", !value);
    panel.classList.toggle("open", value);
  };

  const focusItem = (index: number) => {
    const list = items();
    if (!list.length) return;
    const next = ((index % list.length) + list.length) % list.length;
    list[next].focus();
  };

  const close = () => {
    if (!open) return;
    setExpanded(false);
    onClose?.();
  };

  const openMenu = () => {
    if (open) return;
    setExpanded(true);
    const list = items();
    if (list.length) list[0].focus();
  };

  const onDocPointer = (event: MouseEvent) => {
    if (!open) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || trigger.contains(target)) return;
    close();
  };

  const onDocKey = (event: KeyboardEvent) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      trigger.focus();
    }
  };

  const onPanelKey = (event: KeyboardEvent) => {
    if (!open) return;
    const list = items();
    if (!list.length) return;
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(index < 0 ? 0 : index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(index < 0 ? list.length - 1 : index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(list.length - 1);
    } else if (event.key === "Tab") {
      event.preventDefault();
      focusItem(index < 0 ? 0 : index + (event.shiftKey ? -1 : 1));
    } else if (event.key === "Enter" || event.key === " ") {
      const active = document.activeElement as HTMLElement | null;
      const role = active?.getAttribute("role");
      if (role === "menuitem" || role === "menuitemcheckbox") {
        event.preventDefault();
        active.click();
        if (active.dataset.menuKeepOpen !== "true") {
          close();
          trigger.focus();
        }
      }
    }
  };

  const onTriggerKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
    } else if (event.key === "Escape") {
      close();
    }
  };

  trigger.addEventListener("click", () => {
    if (open) close();
    else openMenu();
  });
  trigger.addEventListener("keydown", onTriggerKey);
  panel.addEventListener("keydown", onPanelKey);
  document.addEventListener("mousedown", onDocPointer);
  document.addEventListener("keydown", onDocKey);

  panel.querySelectorAll(itemSelector).forEach((item) => {
    item.addEventListener("click", () => {
      if (item instanceof HTMLElement && item.dataset.menuKeepOpen === "true") return;
      close();
      trigger.focus();
    });
  });

  return {
    open: openMenu,
    close,
    isOpen: () => open,
    syncItems: () => {
      if (open && !items().length) close();
    },
  };
}
