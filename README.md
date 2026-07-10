# HashWerk – Bitcoin-Mining-Website

Eine statische Website für ein fiktives industrielles Bitcoin-Mining-Unternehmen.
Die Struktur orientiert sich an den großen Playern der Branche
(MARA, Riot Platforms, Braiins, NiceHash):

- **Hero mit Kennzahlen-Leiste** (Hashrate, MW, Erneuerbaren-Anteil, Uptime) – Stil MARA/Riot
- **Standorte / Operations** als Karten-Grid
- **Technologie** (ASICs, Immersionskühlung, Firmware, Stratum V2)
- **Nachhaltigkeit** mit Energiemix-Visualisierung
- **Interaktiver Mining-Rechner** – Stil NiceHash
- **Wissen/Academy** (Mining in 4 Schritten) – Stil Braiins
- **FAQ** und Kontakt-CTA

## Struktur

```
index.html      – Einseitige Website (alle Sektionen)
css/style.css   – Dunkles Industrie-Design, responsiv
js/main.js      – Mining-Rechner, Zähler-Animation, mobiles Menü
```

## Lokal ansehen

Einfach `index.html` im Browser öffnen – keine Build-Tools nötig.
Alternativ:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Hinweis

Alle Kennzahlen und Inhalte sind fiktiv (Demo-Projekt).
Keine Anlage- oder Steuerberatung.
