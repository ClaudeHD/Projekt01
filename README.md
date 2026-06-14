# ENPARA – Energy Paraguay · Website

Moderne Single-Page-Website für **ENPARA (Energy Paraguay)** – Bitcoin-Mining-
Hosting in Paraguay (Air- & Hydro-cooled Antminer ASIC). Reines Vanilla
HTML5 / CSS3 / JavaScript (ES6+) ohne Build-Tools oder Frameworks.

## Features

- **Responsive** (Mobile-First): getestet für 375 px / 768 px / 1920 px
- **Instagram-Integration**: eigener Instagram-Bereich mit Profilkarte und
  Beitrags-Kacheln, Social-Icons in Kontakt & Footer, `sameAs` im Schema.org
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
index.html      Seitenstruktur & Inhalte (inkl. Instagram-Bereich)
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

## Instagram anbinden

Die Website ist bereits vollständig auf den Instagram-Auftritt vorbereitet.
Aktuell ist der Handle **`@enpara.energy`** hinterlegt; alle Links zeigen auf
`https://www.instagram.com/enpara.energy/`. Die Beitrags-Kacheln im
Abschnitt „Instagram" sind Platzhalter und verlinken aufs Profil.

### 1. Instagram-Konto erstellen (einmalig, manuell)

> Dieser Schritt muss von einer Person mit Zugangsdaten/Telefonnummer
> durchgeführt werden und lässt sich nicht automatisieren.

1. Die [Instagram-App](https://www.instagram.com/) installieren oder
   `instagram.com` öffnen → **Registrieren**.
2. Mit der Firmen-E-Mail (`info@enpara.energy`) anmelden und als
   Benutzername **`enpara.energy`** wählen (oder einen freien, ähnlichen
   Namen – siehe Schritt 4, falls abweichend).
3. Unter *Einstellungen → Konto → Kontotyp* auf **Professionelles Konto →
   Unternehmen** umstellen (schaltet Insights, Kontakt-Button & Werbung frei).
4. Profil ausfüllen: Logo (`assets/logo.svg` als PNG exportieren),
   Bio z. B. *„⚡ Energy Paraguay · Bitcoin Mining Hosting · Alto Paraná"*,
   Website-Link `https://www.enpara.energy/`.

**Wurde ein anderer Benutzername vergeben?** Dann den Handle projektweit
ersetzen – er steht an folgenden Stellen:
`index.html` (Schema `sameAs`, Instagram-Bereich, Kontakt-Block, Footer,
`og`/`meta`-Tags), sowie in dieser README. Schnell per Suchen/Ersetzen:
`enpara.energy` → neuer Handle.

### 2. Echten Feed einbinden (optional)

Die Platzhalter-Kacheln (`<div class="insta-grid">` in `index.html`) lassen
sich durch echte Beiträge ersetzen. Drei gängige Wege:

- **Offizielles Instagram-Embed** (kostenlos, ohne API-Key): Beim Beitrag
  *… → Einbetten* den Code kopieren und in eine Kachel einsetzen. Einmalig
  das Skript `//www.instagram.com/embed.js` vor `</body>` einbinden.
- **Widget-Dienst** wie LightWidget, EmbedSocial, Elfsight oder Behold –
  liefern einen automatisch aktualisierten Feed per Einbettungs-Snippet.
  Snippet in den Bereich `#instagram` einsetzen.
- **Meta Graph API** (`instagram_graph_user_media`) für eine voll
  selbstgehostete Lösung mit Access-Token – am aufwendigsten, dafür ohne
  Drittanbieter.

### 3. Content-Ideen für den Start

- Behind-the-Scenes der Mining-Farm & Hydro-Cooling
- Wasserkraft / Itaipú-Werk & Nachhaltigkeit (100 % erneuerbar)
- Setup-Tage, neue Antminer-Rigs, Reparatur-Werkstatt
- Wöchentliches BTC-Markt- & Difficulty-Update
- Team, Standort Alto Paraná, Kundenstimmen

## Konfiguration

Antminer-Modelle, Netzwerk-Parameter und Fallback-Kurse lassen sich oben in
`script.js` (Abschnitt „KONSTANTEN & DATEN") anpassen.
