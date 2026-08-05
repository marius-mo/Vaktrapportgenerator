# Voss Chalet – nettside

Nettside for utleiehytta i Tråstølen på Voss: beskrivelse, husregler, husmanual og tips til området.
Siden er ren HTML/CSS/JavaScript uten byggesteg — ingen npm, ingen rammeverk. Den kan legges rett på
GitHub Pages, Netlify, eller hvilken som helst webhotell-mappe.

## Innhold

| Fil | Hva det er |
| --- | --- |
| `index.html` | Forside: hero, om hytta, høydepunkter, soverom, fasiliteter, galleri, anmeldelser, beliggenhet, vertskap |
| `husmanual.html` | Husmanual med wifi, viktige numre og trekkspill-seksjoner (ankomst, jacuzzi, badstue, peis …) |
| `husregler.html` | Husregler |
| `omradet.html` | Guide til Voss og omegn |
| `assets/js/content.js` | **All tekst på siden.** Det er her du redigerer. |
| `assets/js/app.js` | Bygger sidene ut fra `content.js`. Trenger normalt ingen endringer. |
| `assets/css/styles.css` | Design, farger og mørkt tema |
| `assets/img/` | Bilder |
| `assets/video/` | Eventuelle videoer til husmanualen |

## Slik endrer du tekst

All tekst ligger i `assets/js/content.js`. Filen er kommentert på norsk. Det finnes to språkblokker:

* `no:` – norsk
* `en:` – engelsk

Endrer du noe i den ene, husk å endre tilsvarende i den andre. Punkter merket `TODO:` er ting
som må fylles inn manuelt (wifi-passord, dørkode-rutine, telefonnummer, hvordan badstue og
jacuzzi styres, søppelsortering osv.). Søk etter `TODO` i filen for å finne dem alle.

Nøkkelinfo som gjelder begge språk (adresse, innsjekkstider, wifi, Airbnb-lenke, nødnumre,
kart) ligger øverst i `meta:`.

## Slik legger du inn bilder

1. Last ned bildene fra Airbnb-annonsen (eller bruk originalene).
2. Legg dem i `assets/img/`. Anbefalt: ca. 1600 px bredde, `.jpg` eller `.webp`, under 400 kB per bilde.
3. Skriv filnavnet i `content.js`:
   * Toppbildet: `media.hero`
   * Galleriet: listen `media.gallery`
   * Bilder i husmanualen: `image:` på hver seksjon

Bilder som ikke finnes ennå vises som en pen plassholder — siden ser aldri ødelagt ut mens du jobber.

## Slik legger du inn video i husmanualen

I `content.js`, feltet `video:` på en manual-seksjon:

* **Egen film:** legg fila i `assets/video/` og skriv `"assets/video/peis.mp4"`.
* **YouTube/Vimeo:** lim inn vanlig lenke, f.eks. `"https://youtu.be/xxxxxxxx"` — den bygges automatisk om til en innebygd spiller.

Har en seksjon både `video` og `image`, vises videoen.

## Kart

Åpne Google Maps, søk opp hytta, trykk **Del → Bygg inn kart**, kopier adressen som står i
`src="..."`, og lim den inn i `meta.mapEmbed` i `content.js`. Står feltet tomt, vises en
plassholder i stedet, og knappen «Åpne i Google Maps» bruker `meta.mapLink`.

## Språk

Siden husker språkvalget i nettleseren, og velger norsk automatisk for norske nettlesere.
Du kan lenke direkte til et språk med `?lang=en` eller `?lang=no`, f.eks.
`https://…/husmanual.html?lang=en` — praktisk i meldinger til utenlandske gjester.

## Mørkt tema

Følger systeminnstillingen automatisk, og kan overstyres med knappen i toppen.

## Utskrift og QR-kode

Husmanualen har en «Skriv ut»-knapp med eget utskriftsoppsett (meny, bunntekst og bilder
fjernes). Fint å henge opp i hytta sammen med en QR-kode som peker til `husmanual.html`.

## Publisering

**GitHub Pages:** legg filene i roten av et repo, gå til Settings → Pages, velg `main` og `/ (root)`.
Siden blir liggende på `https://BRUKERNAVN.github.io/REPONAVN/`.

**Eget domene (f.eks. vosschalet.no):** legg en fil `CNAME` i roten med domenet som eneste
innhold, og pek domenets DNS mot GitHub Pages. Alternativt kan mappa slippes rett inn i Netlify.

## Merk

Innholdet bygges av JavaScript i nettleseren. Det gjør at all tekst kan bo i én fil på to språk,
men det betyr også at søkemotorer ser mindre av teksten enn på en tradisjonell statisk side.
For en side som først og fremst deles som lenke til gjester er det en grei avveining — skal siden
rangeres i Google på egen hånd, bør forsideteksten legges direkte i `index.html` i tillegg.
