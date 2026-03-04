# Vaktrapportgenerator

Skifterapport-generator for ukentlige vaktrapporter. Bruker Firebase Firestore for felles lagring av rapporter.

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
