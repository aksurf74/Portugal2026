# Portugal 2026 — V5 RC3.1

## Neu gegenüber RC3
1. **Karte C „Algarve · Basecamp bis Faro"** als dritter Karten-Tab (A · B · C).
   - Pins: Atlantic Basecamp, Lagos, Golf Algarve (Sammelpin), NAU São Rafael, Faro.
   - Der **Golf-Pin (rot, „G")** öffnet direkt das **Golf-Kapitel** mit allen vier Plätzen.
2. **Bildtausch Lissabon-Tage**: 28.8. = Dächer von Lissabon (NEU), 29.8. = Jerónimos,
   30.8. = Fado, 31.8. = Cabo Espichel (Roadtrip). Kein 3× Torre mehr.
3. **diningRegion:"none"** ist eingebaut – einzelne Abende lassen sich in data/days.json leer schalten.
4. **„AI" → „All-Inclusive"** durchgängig.
5. Ortstexte (18 Orte) und „🤖 Frag Copilot" wie in RC3 enthalten.

## WICHTIG: ein neues Bild hochladen
Das 28.8.-Bild „über den Dächern Lissabons" ist NEU generiert und liegt NICHT in dieser ZIP.
Bitte so vorgehen:
1. Das im Chat gezeigte Lissabon-Dächer-Bild herunterladen.
2. Umbenennen in: lisbon-rooftops.jpg
3. In GitHub in den Ordner images/ hochladen (Add file → Upload files → committen).
Falls das Bild fehlt, zeigt der 28.8. einfach kein Titelbild – die App läuft trotzdem.

## App-Dateien updaten
1. ZIP entpacken.
2. Repo Portugal2026 → Add file → Upload files → Inhalt reinziehen (index.html, css/, js/, data/, icons/, manifest.json, service-worker.js) → vorhandene ersetzen.
3. Commit. Service Worker steht auf v5-rc3-1 → iPhone lädt automatisch neu.
4. Falls alte Ansicht bleibt: Home-Screen-App löschen und in Safari neu hinzufügen.

Hinweis: images/ (die bestehenden 54 Bilder) bleiben unverändert im Repo.
