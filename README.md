# Vaktrapportgenerator

Skifterapport-generator for ukentlige vaktrapporter. Bruker Firebase Firestore for felles lagring av rapporter.

## To rapporttyper

Siden har to generatorer. Velg «Basetekniker» under Vakttype for å komme til
teknikersiden, og bruk «Tilbake til operativ vakt» øverst der for å gå tilbake:

- **Operativ vakt** (`index.html`) – rapporten for LOS/Politi-vakt. Ett øyeblikksbilde per vakt.
- **Basetekniker** (`basetekniker.html`) – levende statustavle for teknisk vedlikehold.

Basetekniker-siden dekker alle tre baser (BGO, TOS, HFT), og tilstanden lever
videre mellom vakter:

- **Utestående saker** for alle baser, gruppert per base, med kategori,
  prioritet, ansvarlig og loggtråd. Saker står til noen setter dem til «Lukket».
- **Større reparasjoner** med delpunkter og fremdrift. «LN-OXI MLG repair»
  opprettes automatisk.
- **Tools – neste due** per base. Dra inn en due-rapport (PDF, Excel eller CSV),
  så leses datoene ut og vises for godkjenning før de lagres. Fila leses i
  nettleseren og sendes ikke noe sted. Skannede PDF-er (bilder) kan ikke leses.
- **Ettersyn** for maskinen som står inne på ettersyn, nederst på siden.
- **Vaktrapport ved vaktslutt** tar et øyeblikksbilde av alt over, pluss hva som
  ble endret denne vakten og overlevering til neste vakt.

Tavlen oppdateres i sanntid mellom teknikere via Firestore (samlingene
`bt_saker`, `bt_prosjekter`, `bt_tools`, `bt_status` og `bt_rapporter`). Uten
Firebase-config faller siden tilbake på `localStorage` i egen nettleser.

Felles kode (tema, Firebase-oppsett, datoformatering) ligger i `common.js`.

## Firestore-regler

Basetekniker-siden lagrer i egne samlinger, og Firestore-reglene må gi tilgang
til dem. Ellers får teknikerne feilmelding når de lagrer, og tavla er tom.

1. Gå til [Firebase Console](https://console.firebase.google.com/) →
   prosjektet **vaktrapportgenerator** → **Firestore Database** → **Regler**.
2. Behold regelen som allerede finnes for `vaktrapporter`, og legg til denne
   blokka inne i `match /databases/{database}/documents { ... }`:

   ```
   match /{samling}/{dokument} {
     allow read, write: if samling in
       ['bt_saker', 'bt_prosjekter', 'bt_tools', 'bt_status', 'bt_rapporter'];
   }
   ```

3. Trykk **Publiser**. Endringen gjelder etter et minutt eller to.

Dette gir samme tilgangsnivå som `vaktrapporter` har i dag. Passordet på
innloggingssiden ligger i klartekst i koden, så det er ingen reell sperre mot
databasen. Ekte innlogging (Firebase Authentication) bør på plass før siden
brukes til noe sensitivt.

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
