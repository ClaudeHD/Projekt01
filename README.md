# VerdeHash — Funding Landing Page 🌱⚡

Eine moderne, conversion-orientierte **Funding-/Landingpage**, um Kapital für eine
nachhaltige **Bitcoin-Mining-Farm in Paraguay** einzusammeln (betrieben mit
erneuerbarer Wasserkraft).

> **Marke / Name:** „VerdeHash" ist ein Platzhalter-Markenname und lässt sich
> überall frei ersetzen (Suchen & Ersetzen nach `VerdeHash`).

## 🚀 Schnellstart

Es ist eine reine statische Seite – **kein Build-Schritt nötig**.

```bash
# einfach im Browser öffnen
open index.html            # macOS
xdg-open index.html        # Linux

# oder lokal mit kleinem Server (empfohlen)
python3 -m http.server 8080
# -> http://localhost:8080
```

### Deployment
Funktioniert sofort auf **GitHub Pages**, **Netlify**, **Vercel**, **Cloudflare Pages**
oder jedem statischen Webhost – einfach den Ordner hochladen.

## 📁 Struktur

```
.
├── index.html              # Komplette Seite (alle Sektionen)
├── assets/
│   ├── css/styles.css      # Design-System & Styles
│   ├── js/main.js          # Rechner, Zähler, FAQ, Formular, Reveal-Animationen
│   └── img/                # (für lokal gespeicherte Bilder – siehe unten)
└── README.md
```

## 🖼️ Bilder (wichtig!)

Die vier Hauptbilder sind **KI-generiert** und werden aktuell direkt von einer
externen CDN-URL geladen. **Für den Produktivbetrieb solltest du sie herunterladen
und lokal im Repo speichern**, damit die Seite unabhängig von der CDN bleibt.

So lokal einbinden:

1. Bilder herunterladen und unter `assets/img/` ablegen:
   - `hero.png` — Luftaufnahme der Farm + Wasserkraft
     `https://d8j0ntlcm91z4.cloudfront.net/user_3DzDTt3a6Vkt24L7jaFmcN9bjT4/hf_20260618_145342_1f035359-9f63-45f8-9f06-1e09244273aa.png`
   - `dam.png` — Wasserkraftwerk
     `https://d8j0ntlcm91z4.cloudfront.net/user_3DzDTt3a6Vkt24L7jaFmcN9bjT4/hf_20260618_145426_2d565d68-21d3-4057-a419-9b1dac9169bb.png`
   - `farm.png` — Mining-Halle innen
     `https://d8j0ntlcm91z4.cloudfront.net/user_3DzDTt3a6Vkt24L7jaFmcN9bjT4/hf_20260618_145610_455cea7b-3e87-4081-a151-86991df25064.png`
   - `ops.png` — Betrieb / Technik
     `https://d8j0ntlcm91z4.cloudfront.net/user_3DzDTt3a6Vkt24L7jaFmcN9bjT4/hf_20260618_145916_f6e3b61b-5262-4d02-bb36-edbb620d3992.png`
2. In `index.html` die jeweiligen `https://…cloudfront.net/…`-URLs durch
   `assets/img/hero.png` usw. ersetzen (5 Stellen, inkl. `og:image` und dem
   Hero-Hintergrund `style="background-image:…"`).

> Fällt eine Bild-URL aus, blendet die Seite automatisch einen sauberen
> Farbverlauf-Platzhalter ein (kein „kaputtes Bild").

## 📨 Kontakt-/Lead-Formular anbinden

Das Formular (`#invest-form`) zeigt aktuell nur eine clientseitige Erfolgsmeldung
(Demo). Zum echten Empfangen der Anfragen eine der Optionen wählen:

- **Formspree / Getform / Formcarry** – `action="https://formspree.io/f/DEINE_ID"`
  und `method="POST"` am `<form>` setzen.
- **Netlify Forms** – `<form netlify>` ergänzen.
- **Eigenes Backend / CRM** – im `submit`-Handler in `assets/js/main.js` einen
  `fetch()`-Call an deine API ergänzen (das `data`-Objekt ist bereits vorbereitet).

E-Mail-Platzhalter ersetzen: `invest@verdehash.example` (im Footer).

## ✅ Anpassen vor dem Launch (Checkliste)

- [ ] Markenname `VerdeHash` ersetzen (oder behalten)
- [ ] Bilder lokal speichern (s. o.)
- [ ] **Echte Zahlen** statt der illustrativen Platzhalter eintragen
      (Kapazität, Kosten, Funding-Fortschritt „68 %", Investorenanzahl)
- [ ] Team-Sektion mit echten Profilen/Fotos füllen
- [ ] Formular an Backend/Service anbinden
- [ ] **Impressum & Datenschutzerklärung** verlinken (Pflicht in DE)
- [ ] Risikohinweis/Disclaimer rechtlich prüfen lassen (s. u.)

## ⚖️ Rechtlicher Hinweis

Das Einsammeln von Kapital von Investoren ist **regulatorisch sensibel**. Je nach
Ausgestaltung (Token, Beteiligung, Darlehen, Wertpapier …) und Zielländern können
Prospekt-, Erlaubnis- und Informationspflichten greifen. Die Seite enthält bereits
einen Risiko-Disclaimer und vermeidet bewusst Renditeversprechen.
**Lass die rechtliche Struktur und die Texte vor dem Launch unbedingt von einer
Anwältin/einem Anwalt für Kapitalmarkt-/Finanzrecht prüfen.** Dieser Hinweis ist
keine Rechtsberatung.

---

Gebaut als statische Seite – schnell, leichtgewichtig und ohne Abhängigkeiten.
