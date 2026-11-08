# Návrh: podpis Windows instalátoru Folio (Authenticode)

**Stav:** otevřeno (audit MEDIUM-07)  
**Cíl:** instalátor a `folio.exe` s platným Authenticode podpisem → méně blokování SmartScreen / Smart App Control, zobrazitelný **vydavatel** v dialogu.

## Proč to teď bolí

| Mechanismus | Chování u nepodepsaného `.exe` |
|-------------|--------------------------------|
| **SmartScreen** (download z browseru) | Varování, často „Spustit přesto“ |
| **Smart App Control** (Win 11) | Tvrdý blok, bez per-app výjimky |
| **Podpis + reputace** | Postupně méně varování; SAC typicky vyžaduje důvěryhodný podpis |

Folio už má v `tauri.conf.json` `digestAlgorithm: sha256` a HTTPS distribuci; chybí **kryptografický podpis** buildu v CI.

## Doporučená cesta (maintainer)

### Krok 1 — Zvolit zdroj certifikátu

| Varianta | Vhodné pro | Poznámka |
|----------|------------|----------|
| **Standard Code Signing (OV)** | FOSS / malý tým | řádově stovky USD/rok; reputace SmartScreen se buduje stažením |
| **EV Code Signing** | Pokud issuer pořád nabízí USB/HSM | od 2024 už **automatická** reputace není jistá — viz [Microsoft](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/code-signing-for-smart-app-control) |
| **[Azure Trusted Signing](https://learn.microsoft.com/en-us/azure/trusted-signing/)** | Projekty v Azure | vhodné pro CI bez lokálního USB tokenu; nutný billing + registrace |

Pro **samwe20/Folio** je pragmatický start: **OV** uznávaného CA (Sectigo, SSL.com, DigiCert…) **nebo** Azure Trusted Signing, pokud chceš čistě cloudové podepisování v GitHub Actions.

### Krok 2 — Integrovat do Tauri buildu

Oficiální postup: [Tauri – Windows code signing](https://v2.tauri.app/distribute/sign/windows/).

Po importu certifikátu do store (lokálně) nebo přes `sign_command` v CI:

```json
"bundle": {
  "windows": {
    "digestAlgorithm": "sha256",
    "certificateThumbprint": "<SHA1 thumbprint z certmgr>",
    "timestampUrl": "http://timestamp.digicert.com",
    "tsp": false
  }
}
```

Tauri při `tauri build` / `npm run desktop:build` zavolá `signtool` na **`folio.exe`** i **NSIS setup**.

**GitHub Actions (job `windows-build`):**

1. Secret `WINDOWS_CERTIFICATE_BASE64` — `.pfx` zakódovaný base64  
2. Secret `WINDOWS_CERTIFICATE_PASSWORD`  
3. Před `npm run desktop:build`:
   - import PFX do `Cert:\LocalMachine\My` nebo CurrentUser na runneru  
   - nastavit `certificateThumbprint` přes env / patch configu (thumbprint **necommitovat**)  
4. Po buildu artefakt už je podepsaný → `windows-release` nahraje na GitHub beze změny

**Alternativa:** `bundle.windows.signCommand` — vlastní skript (např. Azure SignTool plugin, `jsign`, osslsigncode pro cross-compile).

### Krok 3 — Transparentnost v release

Do každého release (`docs/release-latest.md` nebo automatický příloha):

- SHA-256 instalátoru (GitHub už nabízí hash u assetu — zkopírovat do poznámek)
- Text: „Signed by: &lt;Publisher name from cert&gt;“ po prvním podepsaném buildu
- Odkaz na [windows-smart-app-control.md](windows-smart-app-control.md)

### Krok 4 — Reputace a SAC

- Po podpisu **první verze** může SmartScreen **stále** varovat, dokud Microsoft nenabude reputaci (počet stažení / hlášení).
- **Smart App Control** může vyžadovat kombinaci podpisu + [doporučených postupů Microsoftu](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/code-signing-for-smart-app-control); 100% záruka bez testování na čistém Win 11 neexistuje.
- Sleduj Feedback Hub / hlášení false positive, pokud se to opakuje.

### Krok 5 — Co **nedělat**

- Neobcházej SAC dokumentací typu „vypněte antivir“ bez vysvětlení rizika — uživatelská stránka je v [windows-smart-app-control.md](windows-smart-app-control.md).
- Neposílej `.pfx` do repa ani do logů CI.
- Nepodepisuj jen instalátor a ne `folio.exe` — Tauri standardně podepisuje obojí; jinak SAC může blokovat i spuštěnou aplikaci.

## Odhad práce v repu (až bude certifikát k dispozici)

| Úkol | Rozsah |
|------|--------|
| Secrets + krok importu PFX v `folio.yml` | ~30–50 řádků YAML |
| Volitelně `certificateThumbprint` přes CI env místo commitu | `tauri.conf.json` beze thumbprintu v gitu |
| Release notes šablona + SHA-256 | `release-latest.md` / skript |
| Aktualizace `security-audit.md` MEDIUM-07 → uzavřeno | 1 odstavec |

**Blokátor:** vlastnictví certifikátu (organizace / jméno vydavatele, fakturace). Technická integrace je přímočařá.

## Odkazy v dokumentaci

- Uživatelé: [windows-smart-app-control.md](windows-smart-app-control.md), [windows.md](windows.md)
- Audit: [security-audit.md](security-audit.md) (MEDIUM-07)
