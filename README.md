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
├── index.html              # Landingpage (Hero, Pakete, Rechner, Krypto-/SEPA-Anfrage, FAQ …)
├── dashboard.html          # Seed-Runde Live-Dashboard + Admin
├── assets/
│   ├── css/styles.css      # Design-System + alle Komponenten
│   ├── js/seed.js          # ⭐ Zentrales Seed-Modell + Einnahmen-Ledger (von beiden Seiten genutzt)
│   ├── js/main.js          # Rechner, Anfrage-Widget (Krypto+SEPA), Paket-Impact, FAQ, Reveal …
│   ├── js/dashboard.js     # Dashboard-Rendering (Ring, KPIs, Chart, Feed, Countdown, Admin)
│   └── img/                # (für lokal gespeicherte Bilder – siehe unten)
└── README.md
```

> **Neu:** `assets/js/seed.js` ist die **eine** Quelle für Seed-Ziel, 70-%-Kapazität,
> Pakete, Countdown-Deadline und das **Einnahmen-Ledger**. Landingpage und Dashboard
> lesen denselben Stand – Fortschritt, freies Volumen und verbleibende Pakete bleiben
> automatisch synchron.

## ⚙️ Wo du echte Werte einträgst (1 Stelle pro Thema)

| Was | Datei | Variable / Stelle |
|-----|-------|-------------------|
| **Seed-Ziel, 70-%-Kapazität, Pakete, Deadline, Admin-Passwort** | `assets/js/seed.js` | `CFG` (oben) |
| Mining-Annahmen (Tarif, Effizienz, Netzwerk-Hashrate …) | `assets/js/seed.js` | `CFG.mining` |
| **Krypto-Wallets** (BTC/ETH/USDT/USDC) | `assets/js/main.js` | `CONFIG.crypto.*.addr` |
| **SEPA-Bankdaten** (IBAN/BIC) | `index.html` | Block `.sepa-box` |
| **Eingesammelt / Investoren / Verlauf** | — | **Admin** im Dashboard (Ledger, s. u.) |
| Pakete & Preise (Anzeige) | `index.html` | Abschnitt `#pakete` (Werte aus `seed.js` spiegeln) |

> ⚠️ **Wichtig:** Wallet-Adressen, IBAN und das Admin-Passwort (`enpara2026`) sind
> **Platzhalter** und müssen vor dem Live-Gang ersetzt werden. Fortschrittszahlen kommen
> jetzt aus dem **Einnahmen-Ledger** statt aus festen Demo-Werten.

## 🌱 Seed-Modell & Admin-Ledger

- **70 % der 1-MW-Anlage** stehen der Seed-Runde zur Verfügung → `CFG.seedShare = 0.70`
  (= 0,70 MW ≈ 51.852 TH/s). Ziel-Volumen & Mindestticket ebenfalls in `seed.js`.
- **Countdown** läuft bis **30.11.2026** (`CFG.deadline`) – live auf dem Dashboard und in
  der Invest-Box.
- **Verbleibende Pakete:** Das Dashboard zeigt aus dem **freien Betrag** (Ziel − eingesammelt),
  wie viele Starter/Pro/Whale-Pakete noch möglich sind – plus freies Volumen in TH/s und MW.
- **Echte Einnahmen statt Beispielbetrag:** Fortschritt, Investoren, Kapitalverlauf und Feed
  kommen aus einem **Ledger** (SEPA + Krypto). Pflege im **Dashboard → Button „Admin"**
  (Passwort `CFG.adminPass`):
  - **Einnahme nachtragen** (Betrag + Zahlungsart + Name/Referenz)
  - **Offene Anfragen** aus dem Formular per Klick als Einnahme **bestätigen** oder verwerfen
  - **Demo-Daten laden** / **Alles löschen**
- **Speicherung:** Browser-`localStorage` (kein Server). Damit Anfragen und Einnahmen geräte-
  und personenübergreifend zusammenlaufen, die Funktionen in `seed.js` (`addEntry`,
  `addRequest`, `confirmRequest` …) an ein echtes **Backend/CRM** anbinden.

## 💱 Krypto-/SEPA-Anfrage

Im Bereich **„Jetzt anfragen"** wird direkt per **BTC, ETH, USDT, USDC** oder **SEPA**
angefragt: Paket wählen → Zahlungsart → Adresse/QR + Verwendungszweck →
Daten eingeben → **Anfrage absenden**. Jede Anfrage landet als **offener Posten** im
Admin-Bereich des Dashboards und kann dort nach Zahlungseingang als Einnahme bestätigt
werden.

- Der **QR-Code** wird über `api.qrserver.com` erzeugt (externer Dienst, im Browser
  des Besuchers). Fällt er aus, bleibt die kopierbare Adresse erhalten. Für volle
  Unabhängigkeit eine kleine QR-Lib bündeln (z. B. `qrcode-generator`) – sag Bescheid,
  ich baue es ein.
- Das Formular ist aktuell **Frontend-Demo**. Anbinden an Backend/CRM:
  - **Formspree/Getform/Netlify Forms** am `<form id="invest-form">`, **oder**
  - eigenen `fetch()`-Call im `submit`-Handler in `assets/js/main.js` (das `data`-Objekt
    mit Name, E-Mail, Betrag, Methode, Asset und Referenz ist bereits vorbereitet).

## 📊 Rendite-Rechner

Echte Mining-Logik: Hashrate → Netzwerk-Hashrate → BTC-Kurs → minus All-in
Mining-Tarif (**0,12 €/kWh**) und Pool-/Mgmt-Gebühr. Features:

- **BTC-Kurs-Presets** (50k / 80k / 100k / 120k / 140k / 160k) + freie Eingabe.
  Bewusst **kein** externer Echtzeitkurs (keine Live-Abfrage).
- **Kurs-Szenario** als Schieberegler, **stufenlos in 1-%-Schritten bis +900 %**
  (plus Schnellwahl Konservativ/Basis/Optimistisch/Bull).
- **Laufzeit bis 10 Jahre** (12–120 Monate).
- Zeigt **Leistung (kW)** *und* **tatsächlichen Stromverbrauch (kWh/Monat)**.
- **Beispiel-Miner**: vergleichbare Hydro-Antminer für den gewählten TH-Anteil.

Annahmen zentral in `CFG.mining` (`seed.js`). **Alle Werte illustrativ – kein
Renditeversprechen.**

## 📦 Pakete

Starter (200 TH/s · 5.000 €), Pro (400 TH/s · 9.500 €) und **Whale (1.100 TH/s · 37.000 €)**.
Jede Karte zeigt **Leistung, Stromverbrauch/Monat und Energiekosten** sowie eine
**visuelle Aufteilung** (Energie-Anteil vs. Netto-Anteil am Brutto-Ertrag) – damit
Endkund:innen direkt sehen, was ein Paket effektiv bedeutet. Pakete zentral in
`CFG.packages` (`seed.js`).

## 🖼️ Bilder (KI-generiert)

Vier Bilder werden derzeit von einer externen CDN geladen. Für den Produktivbetrieb
herunterladen und lokal unter `assets/img/` ablegen, dann die `…cloudfront.net/…`-URLs
in `index.html` ersetzen:

- `hero.png` `…/hf_20260618_145342_1f035359-9f63-45f8-9f06-1e09244273aa.png`
- `dam.png` `…/hf_20260618_145426_2d565d68-21d3-4057-a419-9b1dac9169bb.png`
- `farm.png` `…/hf_20260618_145610_455cea7b-3e87-4081-a151-86991df25064.png`
- `ops.png` `…/hf_20260618_145916_f6e3b61b-5262-4d02-bb36-edbb620d3992.png`

(Basis-URL: `https://d8j0ntlcm91z4.cloudfront.net/user_3DzDTt3a6Vkt24L7jaFmcN9bjT4/`)
Fällt ein Bild aus, zeigt die Seite automatisch einen Farbverlauf-Platzhalter.

## ✅ Checkliste vor dem Launch

- [ ] **Echte Wallet-Adressen** eintragen (`CONFIG.crypto` in `main.js`)
- [ ] **Echte Bankdaten** (IBAN/BIC) eintragen (`.sepa-box`)
- [ ] **Admin-Passwort** ändern (`CFG.adminPass` in `seed.js`)
- [ ] Seed-Ziel, Pakete & Deadline prüfen (`CFG` in `seed.js`)
- [ ] **Demo-Ledger leeren** und echte Einnahmen pflegen (Dashboard → Admin)
- [ ] Ledger/Anfragen an **Backend/CRM** anbinden (statt nur `localStorage`)
- [ ] Bilder lokal speichern
- [ ] Team mit echten Profilen füllen
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
