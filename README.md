# HashWerk – Bitcoin-Mining-Website

Eine statische Website für ein fiktives industrielles Bitcoin-Mining-Unternehmen.
Die Struktur orientiert sich an den großen Playern der Branche
(MARA, Riot Platforms, Braiins, NiceHash).

## Features

- **Live-Daten:** BTC/EUR-Kurs (CoinGecko) als Ticker im Header und im Rechner,
  Netzwerk-Hashrate (mempool.space) als Rechner-Grundlage – mit automatischem
  Fallback auf Standardwerte, wenn die APIs nicht erreichbar sind
- **Mining-Rechner** mit Miner-Presets (S21 Pro, S21, S19k Pro, M60S, M50)
  und live mitgerechneter Geräte-Vergleichstabelle
- **Dynamisches Design:** Partikel-Canvas im Hero, Scroll-Reveal-Animationen,
  pulsierender Glow (respektiert `prefers-reduced-motion`)
- **News-Sektion, FAQ, Kontaktformular** (Demo ohne Backend – für den
  Produktivbetrieb in `js/main.js` einen Form-Endpoint wie Formspree eintragen)
- **Zweisprachig:** Deutsch (`/`) und Englisch (`/en/`) mit `hreflang`-Tags
- **SEO:** OpenGraph/Twitter-Cards, JSON-LD (Organization, FAQPage),
  `sitemap.xml`, `robots.txt`
- **Rechtsseiten:** `impressum.html` und `datenschutz.html` mit
  `[PLATZHALTER]`-Kennzeichnung

## Struktur

```
index.html                    – Startseite (Deutsch)
en/index.html                 – Startseite (Englisch)
impressum.html                – Impressum (Platzhalter)
datenschutz.html              – Datenschutzerklärung (Platzhalter)
css/style.css                 – Dunkles Industrie-Design, responsiv
js/main.js                    – Live-Daten, Rechner, Formular, Animationen
assets/og-image.png           – Social-Media-Vorschaubild
.github/workflows/pages.yml   – GitHub-Pages-Deployment
```

## Lokal ansehen

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Ein lokaler Server ist empfohlen, damit die Live-API-Aufrufe funktionieren
(bei `file://` blockieren manche Browser die Fetches).

## Veröffentlichen (GitHub Pages)

1. In den Repo-Einstellungen unter **Settings → Pages** als Source
   **„GitHub Actions"** auswählen.
2. Auf `main` mergen – der Workflow `pages.yml` deployt automatisch.
3. Die Seite ist dann unter `https://<owner>.github.io/Projekt01/` erreichbar.

## Hinweis

Alle Kennzahlen und Inhalte sind fiktiv (Demo-Projekt).
Keine Anlage- oder Steuerberatung.
