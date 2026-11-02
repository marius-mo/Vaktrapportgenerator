# Vaktrapportgenerator

Skifterapport-generator for ukentlige vaktrapporter. Bruker Firebase Firestore for felles lagring av rapporter.

## To rapporttyper

Siden har to generatorer. Velg «Basetekniker» under Vakttype for å komme til
teknikersiden, og bruk «Tilbake til operativ vakt» øverst der for å gå tilbake:

- **Operativ vakt** (`index.html`) – rapporten for LOS/Politi-vakt. Ett øyeblikksbilde per vakt.
- **Basetekniker** (`basetekniker.html`) – levende statustavle for teknisk vedlikehold.

Basetekniker-siden dekker alle tre baser (BGO, TOS, HFT), og tilstanden lever
videre mellom vakter:

- **Én seksjon per base** med basestatus, tool status og utestående saker for
  basen. Saker har kategori, prioritet, ansvarlig og loggtråd, og står til noen
  setter dem til «Lukket».
- **Nice to know**, en knapp øverst til høyre som åpner et popup-vindu med felles
  oppslagsinfo som kundenumre og telefonnumre. Redigeres med «Rediger»-knappen og
  tas ikke med i PDF-en. Telefonnumre og e-post blir klikkbare.
- **Ettersyn** som egen seksjon nederst. Det kan ligge flere ettersyn samtidig,
  med status Planlegging, Pågår eller Ferdig. Det som tidligere
  het «Større reparasjoner», er flyttet hit automatisk med status Planlegging.
- **Vaktrapport ved vaktslutt** tar et øyeblikksbilde av basene og ettersyn, pluss
  hva som ble endret denne vakten.

Tavlen oppdateres i sanntid mellom teknikere via Firestore. Saker ligger i
`bt_saker`, basestatus og ettersyn i `bt_status`, og rapporter i `bt_rapporter`.
Uten Firebase-config faller siden tilbake på `localStorage` i egen nettleser.

Felles kode (tema, Firebase-oppsett, datoformatering) ligger i `common.js`.

Skript og stilark lastes med et versjonsnummer, f.eks. `basetekniker.js?v=20261102f`
i `index.html` og `basetekniker.html`. **Øk nummeret ved hver endring.** Ellers kan
nettleseren bruke en gammel kopi av skriptet sammen med ny side, og siden virker ikke.

## Firestore-regler

Basetekniker-siden lagrer i egne samlinger, og Firestore-reglene må gi tilgang
til dem. Ellers får teknikerne feilmelding når de lagrer, og tavla er tom.

1. Gå til [Firebase Console](https://console.firebase.google.com/) →
   prosjektet **vaktrapportgenerator** → **Firestore Database** → **Regler**.
2. Erstatt alt i editoren med dette. Regelen for `vaktrapporter` må være med,
   ellers slutter den operative generatoren å virke:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // Operativ vakt
       match /vaktrapporter/{dokument} {
         allow read, write: if true;
       }

       // Basetekniker
       match /{samling}/{dokument} {
         allow read, write: if samling in
           ['bt_saker', 'bt_prosjekter', 'bt_tools', 'bt_status', 'bt_rapporter'];
       }
     }
   }
   ```

3. Trykk **Publish**. Endringen gjelder etter et minutt eller to.

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
