# Versioning & releases (SemVer)

Folio follows [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`.

## Roles

| Label | Tag example | GitHub | Who |
|--------|-------------|--------|-----|
| **Production (live)** | `folio-1.0.7` | Stable release, can be **Latest** | End users on the current shipped build |
| **Next release (test)** | `folio-1.0.8-rc.1`, `folio-1.0.8-rc.2` | **Pre-release** (not Latest) | You test before calling 1.0.8 final |
| **Next release (ship)** | `folio-1.0.8` | Stable **Latest** once | Promoted after testing |

## Rules (industry standard)

1. **Never replace** an installer on an existing stable tag (e.g. do not re-upload `folio-1.0.7`).
2. **Bugfixes while testing 1.0.8** → new **rc** tag (`1.0.8-rc.2`), not `1.0.9`.
3. **Bump PATCH** (`1.0.9`) only when **1.0.8 is already shipped** stable and you start a *new* release line.
4. **App menu** shows the full version from `src-tauri/tauri.conf.json` (including `-rc.N`) so testers see what they run.
5. **GitHub `releases/latest`** stays on the newest **stable**; rc builds are pre-releases on the [Releases](https://github.com/samwe20/Folio/releases) page.

## Maintainer workflow

1. Set version in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` — e.g. `1.0.8-rc.2`.
2. Update `docs/release-latest.md` for that tag.
3. Merge to `main` → CI publishes `folio-1.0.8-rc.2` as **pre-release**.
4. When tests pass, set version to `1.0.8` (no suffix), finalize notes, merge → CI publishes stable `folio-1.0.8` and marks **Latest**.

## CI artifacts (no version bump)

For a one-off build from a PR without a release tag: download **`folio-windows`** from the [Actions](https://github.com/samwe20/Folio/actions) run (same app version as in the branch).

---

## Česky

| Stav | Příklad tagu | GitHub |
|------|----------------|--------|
| **Produkce** | `folio-1.0.7` | Stabilní (Latest) |
| **Test další verze** | `folio-1.0.8-rc.2` | Pre-release |
| **Vydání** | `folio-1.0.8` | Stabilní Latest |

Opravy během testování **1.0.8** = další **rc**, ne skok na **1.0.9**. Na existující stabilní tag se instalátor znovu nenahrává.
