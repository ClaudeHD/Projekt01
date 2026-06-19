# ENPARA — Funding Landing Page 🌱⚡

Conversion-orientierte **Funding-Seite** für die Seed-Runde von **ENPARA** –
einer nachhaltigen **Bitcoin-Mining-Farm in Paraguay** (erneuerbare Wasserkraft,
hydro-gekühlte Antminer). Statisch, schnell, ohne Build-Schritt.

## 🚀 Schnellstart

```bash
python3 -m http.server 8080   # -> http://localhost:8080
```
Deploybar auf **GitHub Pages, Netlify, Vercel, Cloudflare Pages** – Ordner hochladen, fertig.

## 📁 Struktur

```
.
├── index.html              # Landingpage (Hero-Loop, Paraguay, Halle, Pakete, Rechner, Invest, FAQ …)
├── dashboard.html          # Seed-Runde Live-Dashboard
├── assets/
│   ├── css/styles.css      # Design-System + alle Komponenten (v2-Block am Ende)
│   ├── js/main.js          # Rechner, Live-Kurs, Invest-Widget, Hallen-Lightbox …
│   ├── js/dashboard.js     # Dashboard-Rendering (Ring, KPIs, Chart, Feed)
│   └── img/                # (für lokal gespeicherte Bilder – optional)
└── README.md
```

## ⚙️ Wo du echte Werte einträgst (1 Stelle pro Thema)

| Was | Datei | Variable / Stelle |
|-----|-------|-------------------|
| **Krypto-Wallets** (BTC/ETH/USDT/USDC) | `assets/js/main.js` | `CONFIG.crypto.*.addr` |
| **Paket-Preiskalkulation** (Antminer-Kosten, Logistik, Aufschlag) | `assets/js/main.js` | `CONFIG.pricing` |
| Mining-Annahmen (Effizienz, Netzwerk, Gebühr) | `assets/js/main.js` | `CONFIG.mining` |
| Fallback-Kurse (BTC, USD, Guaraní) | `assets/js/main.js` | `CONFIG.fx` |
| **SEPA-Bankdaten** (IBAN/BIC) | `index.html` | Block `.sepa-box` |
| **Dashboard-Zahlen** (Ziel, eingesammelt, Investoren, Frist …) | `assets/js/dashboard.js` | `DASH` (oben) |
| Funding-Fortschritt (Hero + Invest, 68 %) | `index.html` | `#hero-fill` / `.mini-progress` |
| Pakete & Preise | `index.html` | Abschnitt `#pakete` |

> ⚠️ **Wichtig:** Wallet-Adressen, IBAN und alle Zahlen sind aktuell **Platzhalter**
> und müssen vor dem Live-Gang ersetzt werden.

## 💱 Krypto-Investment & QR-Codes

Im Bereich **„Investieren"** kann per **BTC, ETH, USDT, USDC** oder **SEPA**
beteiligt werden: Paket → Zahlungsart → Adresse/QR + Verwendungszweck → Daten → Meldung.

**QR-Codes erscheinen automatisch**, sobald du in `CONFIG.crypto.*.addr` eine
**echte** Wallet einträgst. Solange dort ein Platzhalter (`…PLATZHALTER…`) steht,
zeigt die Box den Hinweis „QR erscheint, sobald echte Adresse hinterlegt". Für BTC
wird ein `bitcoin:`-URI inkl. Betrag kodiert.

- Der QR wird im Browser des Besuchers über `api.qrserver.com` gerendert; die
  **kopierbare Adresse** ist die maßgebliche Quelle (bei Ausfall des Dienstes bleibt sie erhalten).
- Das Formular ist **Frontend-Demo**. Anbinden an Backend/CRM via Formspree/Getform/
  Netlify Forms am `#invest-form` oder eigenem `fetch()` im `submit`-Handler
  (`assets/js/main.js`) – das `data`-Objekt ist vorbereitet.

## 📊 Rendite-Rechner (v2)

Monatsgenaue Mining-Logik mit **Live-Bitcoin-Kurs** (CoinGecko, im Browser):

- **Live-Kurs** in € groß, **USD + Guaraní (₲)** klein als Nebeninfo.
- **BTC-Prognose**: eigenes, editierbares Feld zum Durchspielen (Kurs läuft linear
  vom Live-Kurs zur Prognose).
- **Laufzeit** monatlich verstellbar (6–60 Monate).
- **Netzwerk-Wachstum p. a.** und **Mining-Tarif** (0,10–0,15 €/kWh) als Regler
  – ersetzt die alten 3 Szenarien durch ein kontinuierliches, „spielbares" Modell.
- **Kosten-Aufschlüsselung** des Investitionsbetrags (Hardware / Logistik / Marge).

Bei fehlendem Netz greifen die `CONFIG.fx`-Fallbacks („Offline-Schätzwert").
**Alle Werte illustrativ – kein Renditeversprechen.**

## 💰 Paketpreise – so werden sie berechnet

`Preis je TH/s = (effizienter Antminer + Versand · Zoll · Steuer · Transportversicherung) × 1,25`

In `CONFIG.pricing`:
- `asicCostPerTH` Hardware-Kosten je TH/s (hydro-effizient)
- `logisticsPct` Aufschlag für Versand/Zoll/Steuer/Versicherung
- `markup` Unternehmens-Aufschlag (Marge & Puffer, Standard 25 %)
- `tiers` Verkaufspreis je TH/s nach Volumen (Starter 20 € · Pro 19 € · Whale 18 €)

Ergibt die Pakete **250 / 500 / 1.250 TH/s** zu **5.000 / 9.500 / 22.500 €**.
Die Marge ist bewusst so kalkuliert, dass der Betrieb solide finanziert ist.

## 🏭 Kapazität & Seed-Runde

Phase 1 = **1 MW**. **80 % (0,8 MW)** sind in der Seed-Runde für Investoren
verfügbar, 20 % hält das Unternehmen als Eigenanteil. Dargestellt im Hero,
im Invest-Block (Kapazitäts-Raster) und im Dashboard.

## 🖼️ Bilder & Mining-Halle

Die Bilder werden von einer externen CDN geladen (deine in Higgsfield erzeugten
Aufnahmen). Im Bereich **„Mining-Halle"** öffnet ein Klick die **Lightbox-Großansicht**
(Pfeile / Esc / Klick). Für den Produktivbetrieb optional herunterladen und unter
`assets/img/` lokal ablegen, dann die `…cloudfront.net/…`-URLs ersetzen.
Fällt ein Bild aus, zeigt die Seite automatisch einen Farbverlauf-Platzhalter.

> Hinweis zur Bild-/Video-Erzeugung: Der bewegte Hero-Hintergrund ist ein
> **CSS-Szenen-Loop** (Crossfade + langsamer Kamera-Zoom über deine echten Bilder) –
> bewusst **ohne** credit-pflichtige Video-Generierung. Neue Bilder am besten in der
> Higgsfield-**Web-App** (dort „Nano Banana 2" unlimited) erzeugen und die URL hier eintragen.

## ✅ Checkliste vor dem Launch

- [ ] **Echte Wallet-Adressen** eintragen (`CONFIG.crypto`) → QR erscheint automatisch
- [ ] **Echte Bankdaten** (IBAN/BIC) eintragen (`.sepa-box`)
- [ ] **Pricing/Annahmen** prüfen (`CONFIG.pricing` / `CONFIG.mining`)
- [ ] **Dashboard-Zahlen** & Frist mit realen Werten füllen (`DASH`)
- [ ] Funding-Fortschritt (68 %) & Investorenzahl aktualisieren
- [ ] Bilder lokal speichern (optional)
- [ ] Formular an Backend/Service anbinden
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
