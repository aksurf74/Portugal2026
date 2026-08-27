# Portugal 2026 — V5 RC1

## Was neu ist gegenüber V4.2
- Startkacheln neu: **Reisetag (X/14, dynamisch)**, **Unterkünfte**, **Wetter**, **Heute**.
  - Reisetag/Heute → öffnet das heutige Tagesprogramm (vor Reisebeginn: Vorschau von Tag 1).
  - Unterkünfte → 4 Karten mit Bild, Beschreibung, Adresse, Navigation (NAU zusätzlich Website).
  - Wetter → öffnet online die aktuelle Prognose je Aufenthaltsort.
- Karten reduziert auf **A (Gesamt)** und **B (Roadtrip)**. C–F entfallen.
- Datumsleiste: **•** = Tag mit festen Zeiten, **★** = 2.9. (Besonderer Abend).
- Tagesfenster trennt jetzt **Fixe Zeiten** und **Programm**; Orte sind als Chips antippbar.
- Ortsfenster: Button **Navigation** und **Ideen in der Nähe** (online).

## WICHTIG: Bilder bleiben im Repo
Diese ZIP enthält NUR die App-Dateien (kein images/). Der Ordner images/ liegt bereits im Repo.

## Update in GitHub
1. ZIP entpacken.
2. Im Repo Portugal2026: **Add file → Upload files**.
3. Den kompletten Inhalt dieses Ordners hineinziehen (index.html, css/, js/, data/, icons/, manifest.json, service-worker.js) und vorhandene Dateien ersetzen.
4. Commit changes.
5. Der Service Worker steht auf **v5-rc1** → das iPhone lädt automatisch die neue Version.

## iPhone: neue Version sichtbar machen
- GitHub-Pages-URL zuerst in Safari öffnen und neu laden.
- Falls alte Ansicht bleibt: Home-Screen-App löschen, in Safari erneut öffnen, dann „Zum Home-Bildschirm".

## Hinweis
Offline: Reiseplan, Kapitel, Tagesprogramme, Unterkünfte, Bilder, Karten A/B.
Online: Wetter, Navigation (Google Maps), Ideen in der Nähe.
