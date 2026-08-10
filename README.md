# GWS Admin Study Desk

Associate Google Workspace Administrator study aid — **browser, Mac, or Windows**.

## Browser
- Local: open `index.html`
- Live: https://gws-admin-study-guide.vercel.app/

## Mac desktop (share with a friend)

**Send this file (~94 MB):**  
`Downloads/GWS-Admin-Study-Desk-1.1.0-Mac-AppleSilicon.zip`

Friend steps:
1. Unzip → drag **GWS Admin Study Desk.app** to Applications  
2. First open: **right-click → Open → Open** (Gatekeeper)  
3. Apple Silicon only (M1/M2/M3/M4). Intel Mac → use the [browser](https://gws-admin-study-guide.vercel.app/) or ask for an Intel build.

Or from source on their Mac:
```bash
cd "gws-admin-study-guide"
npm install
npm start
```
Or double-click **Open Study Desk.command**.

Build yourself:
```bash
npm run pack:mac    # .app in dist/mac-arm64/
npm run dist:mac    # DMG
```

## Windows (share with a friend)

**Easiest — send this one file:**

`dist/GWS-Admin-Study-Desk-1.1.0-Windows-Setup.zip`  
(also copied to your **Downloads** folder when you build)

Friend steps:
1. Unzip the folder
2. Double-click **Install.bat**
3. If SmartScreen appears: **More info → Run anyway**
4. Desktop + Start Menu shortcuts are created

Rebuild anytime from your Mac:
```bash
npm run dist:win:setup
```

### True NSIS Setup.exe (optional)
Apple Silicon Macs can’t run NSIS/`makensis` (error -86). To get a classic `Setup.exe`:
- Push this folder to GitHub and run the **Build Windows installer** Action, **or**
- On any Windows PC: `npm ci` then `npm run dist:win`

## Cloud profile (Log in / Sign up)

Progress can sync to **your account** with a **username and password** (checklist, practice XP, session timer, learning style, sandbox state). No email confirmation.

The live site at [gws-admin-study-guide.vercel.app](https://gws-admin-study-guide.vercel.app) is already wired to the cloud API — use **Log in** / **Sign up** in the sidebar or mobile **Account**.

### Local / desktop / fork

`config.js` points at the hosted auth API by default (see `config.example.js`). Override with env vars on Vercel if you fork:

- `GWS_AUTH_API_BASE` — Edge Function base URL  
- `GWS_SUPABASE_ANON_KEY` — anon key for the Supabase gateway (optional; default baked in for this project)

Build: `node scripts/write-config.js` (also runs on Vercel deploy).

### In the app

- Sidebar (desktop) or **Account** (mobile) → **Log in** / **Sign up** (username 3–32 chars, letters/numbers/underscore; password ≥ 6)
- After login, progress loads from your profile; changes auto-sync (~2s debounce)
- **Sync now** forces an upload; **Sign out** keeps data on the device

Offline or old copies without `config.js` still work — progress stays on this device only.

## What’s inside
- Study modules + Admin sandbox simulator
- Practice arena + **246-question mock bank**
- Last-minute review cram sheet

Not affiliated with Google or the official exam.
