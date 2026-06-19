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
├── index.html              # Landingpage (Hero, Pakete, Rechner, Krypto-/SEPA-Invest, FAQ …)
├── dashboard.html          # Seed-Runde Live-Dashboard
├── assets/
│   ├── css/styles.css      # Design-System + alle Komponenten
│   ├── js/main.js          # Rechner, Invest-Widget (Krypto+SEPA), FAQ, Reveal …
│   ├── js/dashboard.js     # Dashboard-Rendering (Ring, KPIs, Chart, Feed)
│   └── img/                # (für lokal gespeicherte Bilder – siehe unten)
└── README.md
```

## ⚙️ Wo du echte Werte einträgst (1 Stelle pro Thema)

| Was | Datei | Variable / Stelle |
|-----|-------|-------------------|
| **Krypto-Wallets** (BTC/ETH/USDT/USDC) | `assets/js/main.js` | `CONFIG.crypto.*.addr` |
| **Hardware-Preis, Effizienz, Marge, Logistik** (Zoll/Steuer/Versand/Versicherung) | `assets/js/main.js` | `CONFIG.pricing` |
| Netzwerk-Annahmen, Mining-Tarif, Pool-Gebühr | `assets/js/main.js` | `CONFIG.network`, `CONFIG.tariffEurKwh`, `CONFIG.poolFee` |
| Prognose-Standard & FX-Fallback (USD/PYG) | `assets/js/main.js` | `CONFIG.defaultForecastEur`, `CONFIG.fx` |
| **SEPA-Bankdaten** (IBAN/BIC) | `index.html` | Block `.sepa-box` |
| **Dashboard-Zahlen** (Ziel, eingesammelt, Investoren …) | `assets/js/dashboard.js` | `DASH` (oben) |
| Funding-Fortschritt im Invest-Block (68 %) | `index.html` | `.mini-progress` |
| Pakete: Beträge (€) | `index.html` `#pakete` | TH/s & €/TH werden **automatisch** aus `CONFIG.pricing` berechnet |

> ⚠️ **Wichtig:** Wallet-Adressen, IBAN und alle Zahlen sind aktuell **Platzhalter**
> und müssen vor dem Live-Gang ersetzt werden.

## 💱 Krypto-Investment

Im Bereich **„Investieren"** kann direkt per **BTC, ETH, USDT, USDC** oder **SEPA**
beteiligt werden: Paket wählen → Zahlungsart → Adresse/QR + Verwendungszweck →
Daten eingeben → Meldung.

- Der **QR-Code** wird über `api.qrserver.com` erzeugt (externer Dienst, im Browser
  des Besuchers). Fällt er aus, bleibt die kopierbare Adresse erhalten. Für volle
  Unabhängigkeit eine kleine QR-Lib bündeln (z. B. `qrcode-generator`) – sag Bescheid,
  ich baue es ein.
- Das Formular ist aktuell **Frontend-Demo**. Anbinden an Backend/CRM:
  - **Formspree/Getform/Netlify Forms** am `<form id="invest-form">`, **oder**
  - eigenen `fetch()`-Call im `submit`-Handler in `assets/js/main.js` (das `data`-Objekt
    mit Name, E-Mail, Betrag, Methode, Asset und Referenz ist bereits vorbereitet).

## 📊 Rendite-Rechner & Preismodell

**Preisbildung (Anteile):** Der €-Betrag wird über ein transparentes Modell in
Hashrate (TH/s) umgerechnet — Basis ist ein effizienter Hydro-Antminer
(S21 XP Hydro, ≈ 12 W/TH). Auf die Hardware kommen **Versand, Zoll,
Einfuhrsteuer (IVA) und Transportversicherung** sowie **25 % Marge** (Gewinn +
Puffer); größere Tickets erhalten einen Mengenvorteil. Alles in `CONFIG.pricing`.
Der Rechner schlüsselt jeden Investitionsbetrag in genau diese Posten auf.

**Mining-Rechner:** Monatsgenaue Modellrechnung über frei wählbare Laufzeit
(6–60 Monate) mit:

- **Echtzeit-BTC-Kurs** (CoinGecko, Fallback Coinbase) – als Referenz angezeigt,
  inkl. kleiner Nebeninfo in **USD & Guaraní (PYG)**.
- **Editierbares Prognose-Feld** für den BTC-Kurs (Standard `CONFIG.defaultForecastEur`)
  plus Schnellwahl (Live / 100k / 150k / 200k).
- **Netzwerk-Wachstum p. a.** als stufenloser Regler (ersetzt die alten 3 Szenarien)
  – modelliert die steigende Mining-Schwierigkeit über die Laufzeit.
- All-in Mining-Tarif (**0,12 €/kWh**) und Pool-/Mgmt-Gebühr.

Annahmen in `CONFIG` (`main.js`) anpassbar. **Alle Werte illustrativ – kein
Renditeversprechen.**

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

- [ ] **Echte Wallet-Adressen** eintragen (`CONFIG.crypto`)
- [ ] **Echte Bankdaten** (IBAN/BIC) eintragen (`.sepa-box`)
- [ ] **Dashboard-Zahlen** mit realen Werten füllen (`DASH`)
- [ ] Funding-Fortschritt (68 %) & Investorenzahl aktualisieren
- [ ] Bilder lokal speichern
- [ ] Formular an Backend/Service anbinden
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
