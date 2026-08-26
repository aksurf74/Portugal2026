# Portugal 2026 — App Shell V2

Interaktive Reise-App (PWA) mit Startseite, Timeline, Day-by-Day-Leiste,
interaktiver **Karte A** und **Vollsuche**. Läuft offline, installierbar auf iPhone/iPad.

## Was drin ist
- `index.html` – App
- `css/app.css` – Design & Farbwelt
- `js/app.js` – Datenanbindung, Timeline, Suche, Bottom-Sheets
- `js/map.js` – interaktive SVG-Karte A (offline, keine Fremdbibliothek)
- `data/*.json` – Reisedaten (14 Tage, 27 Orte, 5 Kapitel, 6 Karten)
- `manifest.json`, `service-worker.js` – PWA / Offline
- `icons/` – App-Icon (Küstenlinie + Portugalflagge)

## WICHTIG: nicht per Doppelklick öffnen
Eine PWA braucht einen Webserver (wegen `fetch` der JSON-Dateien und Service Worker).
Doppelklick auf `index.html` zeigt sonst eine Fehlermeldung.

## A) Schnell lokal testen (am Rechner)
Im Ordner ein Terminal öffnen und starten:
```
python3 -m http.server 8080
```
Dann im Browser: `http://localhost:8080`

## B) Online stellen & auf iPhone installieren (empfohlen: GitHub Pages)
1. Kostenloses GitHub-Konto anlegen.
2. Neues Repository `Portugal2026` erstellen.
3. **Alle Dateien aus diesem Ordner** hochladen (Struktur beibehalten).
4. Settings → Pages → „Deploy from branch“ → Branch `main` → Save.
5. Nach ~1 Min entsteht eine URL: `https://DEINNAME.github.io/Portugal2026`
6. iPhone: Link in **Safari** öffnen → Teilen → **Zum Home-Bildschirm** → Hinzufügen.
7. Es erscheint das App-Icon „Portugal 2026“. Beim ersten Öffnen lädt sie alles offline nach.

## Offline testen
App einmal mit Internet öffnen → Flugmodus an → App schließen → erneut öffnen.
Start, Timeline, Karte A und Suche funktionieren ohne Netz.

## Stand & nächste Builds
Dies ist **V2 (Fundament)**. Als Nächstes:
- V3: echte Bilder (Hero-Collage + Kapitelbilder), Karten B & C
- V4–V6: Karten D, E, F
- Final: alle Kapiteltexte, Golfmodus, Feinschliff
