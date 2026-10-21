# Vaktrapportgenerator

Skifterapport-generator for ukentlige vaktrapporter. Bruker Firebase Firestore for felles lagring av rapporter.

## To rapporttyper

Siden har to generatorer, og du veksler mellom dem med fanene øverst:

- **Operativ vakt** (`index.html`) – rapporten for LOS/Politi-vakt. Ett øyeblikksbilde per vakt.
- **Basetekniker** (`basetekniker.html`) – levende statustavle for teknisk vedlikehold.

Basetekniker-siden skiller seg fra den operative ved at tilstanden lever videre
mellom vakter:

- **Helikopterstatus** per maskin (Serviceable / Begrenset / AOG) med neste ettersyn.
- **Utestående saker** med kategori, prioritet, ansvarlig og loggtråd. Saker blir
  stående til noen setter dem til «Lukket», slik at de følges opp over flere vakter.
- **Vaktrapport ved vaktslutt** tar et øyeblikksbilde av tavlen og lister åpne saker,
  hva som ble endret denne vakten, og overlevering til neste vakt.

Tavlen oppdateres i sanntid mellom teknikere via Firestore. Uten Firebase-config
faller siden tilbake på `localStorage` i egen nettleser.

Felles kode (tema, Firebase-oppsett, datoformatering) ligger i `common.js`.

## GitHub Pages – slik publiserer du

1. **Opprett et nytt repo på GitHub**
   - Gå til [github.com/new](https://github.com/new)
   - Repository name: f.eks. `vaktrapportgenerator`
   - Velg **Public**
   - Ikke kryss av for README, .gitignore eller license (prosjektet har allerede filer)
   - Klikk **Create repository**

2. **Koble prosjektet til repoen og push** (kjør i terminal i prosjektmappen):
   ```bash
   git remote add origin https://github.com/DITT-BRUKERNAVN/vaktrapportgenerator.git
   git branch -M main
   git push -u origin main
   ```
   Erstatt `DITT-BRUKERNAVN` med ditt GitHub-brukernavn (og reponavnet hvis du valgte et annet).

3. **Slå på GitHub Pages**
   - På GitHub: åpne repoen → **Settings** → **Pages** (venstre meny)
   - Under "Build and deployment": **Source** = **Deploy from a branch**
   - **Branch**: velg `main` og `/ (root)` → **Save**
   - Etter 1–2 minutter er siden live på:
     `https://DITT-BRUKERNAVN.github.io/vaktrapportgenerator/`

Del den lenken med kolleger så kan alle bruke generatoren og se de samme tidligere rapportene (via Firebase).
