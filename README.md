# ENPARA — Funding Landing Page 🌱⚡

Conversion-orientierte **Funding-Seite** für die Seed-Runde von **ENPARA** –
einer nachhaltigen **Bitcoin-Mining-Farm in Paraguay** (erneuerbare Wasserkraft,
hydro-gekühlte Antminer). Statisch, schnell, ohne Build-Schritt.

Diese Version ist die **Kombination aus drei Ständen**:
das finale Video-Design aus Claude Design (Navy/Orange/Blau, Vollbild-Video-Hero,
Video-Sektionen, Neon-Logo) **+** die VerdeHash-Inhalte (Team-Sektion,
Pitch-Deck-/Beratungs-Formular, erweiterte FAQ) **+** ein moderner
Animations-Layer (scroll-getriebene CSS-Animationen, Cross-Document View
Transitions, 3D-Tilt, Marquee, Live-Demo-Feed im Dashboard).

## 🚀 Schnellstart

```bash
python3 -m http.server 8080   # -> http://localhost:8080
```
Deploybar auf **GitHub Pages, Netlify, Vercel, Cloudflare Pages** – Ordner hochladen, fertig.

## 📁 Struktur

```
.
├── index.html              # Landingpage (Video-Hero, Pakete, Rechner, Krypto-/SEPA-Invest, Team, FAQ …)
├── dashboard.html          # Seed-Runde Live-Dashboard
├── assets/
│   ├── css/styles.css      # Design-System + Komponenten + Effekt-Layer
│   ├── js/main.js          # Rechner, Invest-Widget (Krypto+SEPA), Pitch-Deck-Formular, FAQ, Reveal …
│   ├── js/effects.js       # Animations-Layer (Hero-Intro, Tilt, Magnetic, Marquee, Scroll-Progress)
│   ├── js/dashboard.js     # Dashboard-Rendering (Ring, KPIs, Chart-Draw-In, Live-Demo-Feed)
│   ├── img/                # Logo + Video-Poster
│   └── video/clips/        # Hintergrund-Clips (nur die tatsächlich genutzten)
└── README.md
```

## ✨ Animations-Layer ("ihrer Zeit voraus")

Alles Vanilla CSS/JS, ohne Libraries, und **komplett deaktiviert bei
`prefers-reduced-motion`**:

- **Ganzseitiger bewegter Hintergrund**: fixer Video-Layer (`.page-bg`, Clip c06)
  hinter **allen** Sektionen der Startseite und des Dashboards, plus
  **prozedurale Blitz-Ebene** (`.energy-bg`-Canvas): verzweigte Blitze im
  Marken-Look (blauer Glow, oranger Strahl, heller Kern) alle 4–9 Sekunden,
  dazwischen Mikro-Funken; Screen-Flash beim Einschlag. Test-Hook:
  `window.__enparaStrike()`.
- **Scroll-getriebene CSS-Animationen** (`animation-timeline: view()/scroll()`):
  Scroll-Progress-Leiste im Header, Parallax-Ausblenden des Hero-Inhalts,
  Kino-Reveal der Video-Frames, selbstzeichnende Roadmap-Linie —
  mit IntersectionObserver-Fallback für ältere Browser.
- **Cross-Document View Transitions** (`@view-transition`) beim Wechsel
  zwischen Landingpage und Dashboard (Logo als geteiltes Element).
- **Hero-Kino-Intro**: Headline erscheint Wort für Wort gestaffelt.
- **3D-Tilt + Glare** auf Vorteils-, Paket- und Team-Karten, **magnetische**
  Primär-Buttons (nur bei feinem Pointer/Hover-Gerät).
- **Endlos-Marquee** für den Trust-Strip (pausiert bei Hover).
- **Dashboard**: Fortschrittsring mit Glow-Puls, Kapitalverlauf-Chart
  zeichnet sich beim Scrollen ein, simulierter **Live-Demo-Feed**
  (klar als Demo gekennzeichnet).
- Videos pausieren automatisch, sobald sie den Viewport verlassen.

## ⚙️ Wo du echte Werte einträgst (1 Stelle pro Thema)

| Was | Datei | Variable / Stelle |
|-----|-------|-------------------|
| **Krypto-Wallets** (BTC/ETH/USDT/USDC) | `assets/js/main.js` | `CONFIG.crypto.*.addr` |
| Wechselkurse, Effizienz, Tarif, Szenarien | `assets/js/main.js` | `CONFIG` (oben) |
| **SEPA-Bankdaten** (IBAN/BIC) | `index.html` | Block `.sepa-box` |
| **Dashboard-Zahlen** (Ziel, eingesammelt, Investoren …) | `assets/js/dashboard.js` | `DASH` (oben) |
| Funding-Fortschritt im Invest-Block (68 %) | `index.html` | `.mini-progress` |
| Pakete & Preise | `index.html` | Abschnitt `#pakete` |
| **Team-Profile** | `index.html` | Abschnitt `#team` |

> ⚠️ **Wichtig:** Wallet-Adressen, IBAN, Team-Profile und alle Zahlen sind
> aktuell **Platzhalter** und müssen vor dem Live-Gang ersetzt werden.

## 💱 Investieren: zwei Wege auf einer Seite

Im Bereich **„Investieren"** gibt es zwei Tabs:

1. **Direkt investieren** – per **BTC, ETH, USDT, USDC** oder **SEPA**:
   Paket wählen → Zahlungsart → Adresse/QR + Verwendungszweck → Daten eingeben → Meldung.
2. **Pitch-Deck & Beratung** – unverbindliches Lead-Formular
   (Name, E-Mail, Wunsch-Investment, Telefon, Nachricht) für Interessenten,
   die noch nicht direkt einzahlen wollen.

- Der **QR-Code** wird über `api.qrserver.com` erzeugt (externer Dienst, im Browser
  des Besuchers). Fällt er aus, bleibt die kopierbare Adresse erhalten.
- Beide Formulare sind aktuell **Frontend-Demo**. Anbinden an Backend/CRM:
  **Formspree/Getform/Netlify Forms** an `#invest-form` bzw. `#lead-form`, oder
  eigener `fetch()`-Call in den `submit`-Handlern in `assets/js/main.js`
  (die `data`-Objekte sind bereits vorbereitet).

## 📊 Rendite-Rechner

Echte Mining-Logik: Hashrate → Netzwerk-Schwierigkeit → BTC-Kurs → minus
All-in Mining-Tarif (**0,12 €/kWh**) und Pool-/Mgmt-Gebühr. Drei Szenarien
(konservativ/basis/optimistisch), editierbarer BTC-Kurs und Laufzeit.
Annahmen in `CONFIG` (`main.js`) anpassbar. **Alle Werte illustrativ – kein
Renditeversprechen.**

## 🎬 Videos, Bilder & Logo

- **Video-Clips**: Die Seite referenziert `assets/video/clips/c06.mp4`
  (Ganzseiten-Hintergrund auf Startseite **und** Dashboard), `c13.mp4`
  (Paraguay), `c08.mp4` (Hardware), `c22.mp4` (Betrieb) aus dem
  Claude-Design-Projekt „Enpara finale Website Design“. Die Clips konnten aus
  dieser Umgebung nicht exportiert werden (API-Limit 256 KB/Datei, externe
  Downloads gesperrt) — **lege sie einfach unter `assets/video/clips/` ab**,
  dann laufen sie sofort. Bis dahin zeigt jede Video-Fläche automatisch ihr
  Poster; die Seite bleibt voll funktionsfähig.
- **Poster** (`assets/img/poster-*.jpg`): aktuell **generierte On-Brand-Platzhalter**
  (Navy + Orange/Blau-Glow). Für den Live-Gang idealerweise durch echte
  Video-Standbilder ersetzen (gleiche Dateinamen).
- **Logo**: als **Inline-Neon-SVG** direkt im HTML (`<symbol id="enpara-wordmark">`
  im Header beider Seiten definiert, per `<use>` wiederverwendet). Kein
  Bild-Asset nötig, gestochen scharf auf jedem Display; Farben/Stärke der
  Neon-Röhren direkt im Symbol anpassbar.

## ✅ Checkliste vor dem Launch

- [ ] **Echte Wallet-Adressen** eintragen (`CONFIG.crypto`)
- [ ] **Echte Bankdaten** (IBAN/BIC) eintragen (`.sepa-box`)
- [ ] **Dashboard-Zahlen** mit realen Werten füllen (`DASH`)
- [ ] Funding-Fortschritt (68 %) & Investorenzahl aktualisieren
- [ ] Team mit echten Profilen füllen (`#team`)
- [ ] Formulare an Backend/Service anbinden (`#invest-form`, `#lead-form`)
- [ ] **Impressum & Datenschutz** verlinken (Pflicht in DE)
- [ ] Disclaimer & rechtliche Struktur prüfen lassen (s. u.)

## ⚖️ Rechtlicher Hinweis

Kapital von Investoren einzusammeln – besonders mit Krypto-Zahlung – ist
**regulatorisch sensibel** (mögliche Prospekt-, Erlaubnis-, Geldwäsche-/KYC- und
Informationspflichten, je nach Struktur und Zielländern). Die Seite enthält
Risiko-Disclaimer und vermeidet Renditeversprechen. **Lass Struktur, KYC/AML-Prozess
und Texte vor dem Launch von einer Fachanwältin/einem Fachanwalt prüfen.** Dies ist
keine Rechtsberatung.

---

Statisch · leichtgewichtig · ohne Framework-Abhängigkeiten.
