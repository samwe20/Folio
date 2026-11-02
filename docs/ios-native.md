# Native iOS (Tauri)

Native iOS builds use **Tauri 2 + Xcode**. Apple requires **macOS** — you cannot produce an `.ipa` from Windows or Linux.

## What is ready

- Mobile UI (drawer, backlinks bottom sheet, safe areas)
- Library in the app sandbox (Documents)
- `src-tauri/tauri.ios.conf.json`
- Scripts `ios:init`, `ios:dev`, `ios:build`

## Requirements on Mac

1. macOS + **Xcode** (full IDE)
2. Node.js 22+
3. Rust (`rustup`)
4. CocoaPods: `brew install cocoapods`
5. Rust targets:

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
```

6. Apple ID in Xcode (TestFlight → Apple Developer Program)

## First build

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio
npm ci

npm run ios:init   # once — generates Xcode project
npm run ios:dev    # simulator / device
```

Release:

```bash
npm run ios:build
```

Signing and TestFlight follow Apple’s documentation in Xcode.

## Without a Mac

For iPhone without a Mac, use the [web PWA](./web-pwa.md).
