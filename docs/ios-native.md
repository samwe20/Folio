# Nativní iOS (Tauri)

Nativní iOS build běží přes **Tauri 2 + Xcode**. Apple vyžaduje **macOS** — z Windows nebo Linuxu `.ipa` nevznikne.

## Co je připravené

- Mobilní UI (drawer, bottom sheet pro backlinky, safe areas)
- Knihovna v app sandboxu (Documents)
- `src-tauri/tauri.ios.conf.json`
- Skripty `ios:init`, `ios:dev`, `ios:build`

## Požadavky na Macu

1. macOS + **Xcode** (plné IDE)
2. Node.js 22+
3. Rust (`rustup`)
4. CocoaPods: `brew install cocoapods`
5. Rust targety:

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
```

6. Apple ID v Xcode (TestFlight → Apple Developer Program)

## První sestavení

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio
npm ci

npm run ios:init   # jednou — Xcode projekt
npm run ios:dev    # simulátor / zařízení
```

Release:

```bash
npm run ios:build
```

Podrobnosti k podpisování a TestFlight řeší Xcode podle Apple dokumentace.

## Alternativa bez Macu

Pro iPhone bez Macu použij [webovou PWA](./web-pwa.md).
