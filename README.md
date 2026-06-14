# HydroVolt Mining – Website

Moderne Single-Page-Website für ein Bitcoin-Mining-Hosting-Unternehmen in
Paraguay (Air- & Hydro-cooled Antminer ASIC). Reines Vanilla HTML5 / CSS3 /
JavaScript (ES6+) ohne Build-Tools oder Frameworks.

## Features

- **Responsive** (Mobile-First): getestet für 375 px / 768 px / 1920 px
- **Live Bitcoin-Preis** via CoinGecko API (USD & EUR) mit Cache- und
  statischem Fallback bei API-Ausfall
- **Interaktiver ROI-Kalkulator**: täglicher BTC-Output, monatliche Netto-
  Erträge (USD/EUR), Gewinn nach 12/24 Monaten, Break-even
- **Zweisprachig** DE/EN (clientseitig, ohne Reload)
- **Hosting-Paketvergleich** Air- vs. Hydro-cooled
- **SEO**: Meta-Tags, Open Graph, Schema.org `LocalBusiness`
- **Accessibility**: semantisches HTML, ARIA-Labels, Tastatur-Navigation,
  `prefers-reduced-motion`
- Dark-Theme · Sticky Header · Fade-In-Animationen (IntersectionObserver)

## Projektstruktur

```
index.html      Seitenstruktur & Inhalte
styles.css      Design-System, Responsive Layout, Animationen
script.js       i18n, CoinGecko-API, ROI-Kalkulator, Navigation, Formular
assets/         Logo, Favicon, Hero-Hintergrund (SVG)
```

## Lokal starten

Es genügt ein statischer Webserver (für die API-Anfrage am besten via HTTP
statt `file://`):

```bash
python3 -m http.server 8000
# danach http://localhost:8000 öffnen
```

> Hinweis: Der Live-Kurs benötigt Internetzugang zu `api.coingecko.com`.
> Ist dieser nicht verfügbar, zeigt die Seite automatisch den zuletzt
> gecachten bzw. einen statischen Fallback-Kurs an.

## Konfiguration

Antminer-Modelle, Netzwerk-Parameter und Fallback-Kurse lassen sich oben in
`script.js` (Abschnitt „KONSTANTEN & DATEN") anpassen.
