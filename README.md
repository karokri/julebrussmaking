# 🎄 Julebrustesten 2026

Blindtest av julebrus. Smakerne ser bare nummer og gir karakter 1–5 (med fjes, så det funker for alle fra 11 til 80). Når arrangøren trykker **Avslør**, ser alle resultatet med navn.

## Slik henger det sammen

- **Appen** (dette repoet) – Vite + React, deployes til GitHub Pages.
- **Data** – JSON-filer i et eget, privat repo (`julebrussmaking-data`):
  - `config.json` – antall brus, kryptert navneliste og om resultatet er avslørt
  - `votes/<navn>.json` – én fil per smaker (ingen skriver over hverandre)
  - `archive/<dato>-<navn>.json` – avsluttede smakinger
- **Gruppepassord** – låser opp et GitHub-token som er kryptert inn i appen, og bestemmer hvilken gruppe (datamappe) du havner i. Feil passord = ingen tilgang. Gruppene er skilt i appen, men deler token – greit for familie og venner, ikke for hemmeligheter.
- **Adminpassord** – krypterer brusnavnene, så ingen kan finne dem før avsløringen.

## Oppsett (én gang)

1. **Lag data-repoet**: Opprett et **privat** repo `karokri/julebrussmaking-data` med en README (så `main` finnes).
2. **Lag token**: GitHub → Settings → Developer settings → Fine-grained tokens → Generate.
   - Repository access: *Only select repositories* → `julebrussmaking-data`
   - Permissions → Repository → **Contents: Read and write**
   - Utløpsdato: f.eks. 31. januar
3. **Secrets i dette repoet** (Settings → Secrets and variables → Actions):
   - `DATA_TOKEN` = tokenet fra steg 2
   - `APP_PASSWORD` = passordet for hovedgruppen (data i roten av data-repoet)
   - (valgfritt) `APP_PASSWORDS` = flere grupper, én per linje på formen `gruppenavn: passord`.
     Hver gruppe får egne data i `grupper/<gruppenavn>/` – egen brusliste, egne karakterer, eget arkiv og eget adminpassord.
     Passordene må være unike. Legg til en linje og kjør bygget på nytt for å opprette en ny gruppe.
   - (valgfritt) Variabel `DATA_REPO` hvis data-repoet heter noe annet enn `<dette-repoet>-data`
4. **Skru på Pages**: Settings → Pages → Source: **GitHub Actions**.
5. Push til `main` → appen ligger på `https://karokri.github.io/julebrussmaking/`.

## På smakedagen

1. Gå til appen → logg inn → trykk **Arrangør** nederst.
2. Velg et adminpassord (første gang), rett opp bruslisten (linje 1 = brus nr. 1) og trykk **Lagre**.
3. Del lenke + felles passord. Alle skriver inn navnet sitt og gir karakterer – det lagres automatisk.
4. Følg med på hvem som er ferdige under **Smakere**.
5. Trykk **🎉 Avslør resultatet**. Alle ser resultatet innen ca. 20 sekunder (eller ved å åpne appen på nytt).
6. **🖨️ Skriv ut resultatet** fra resultatsiden gir rangering med bilder og en tabell med alle karakterer. **Last ned resultat (JSON)** på arrangørsiden gir rådata.
7. **Avslutt og start ny smaking** på arrangørsiden lagrer bruslisten og alle karakterer i `archive/` i data-repoet og tømmer smakingen. Gamle smakinger åpnes under **Tidligere smakinger**.

Logger noen inn med et navn som allerede er brukt, spør appen «Er det deg?» – da kan man fortsette på en annen telefon.

## Utvikling

```bash
npm install
npm run dev
```

Uten `VITE_ENC_TOKENS` kjører appen i **testmodus**: alt lagres i nettleseren, og et hvilket som helst passord fungerer.

For å teste mot ekte data lokalt:

```bash
DATA_TOKEN=github_pat_xxx APP_PASSWORD=hemmelig npm run encrypt-token > .env.local
# flere grupper: APP_PASSWORDS=$'jobb: passord1\nvenner: passord2'
echo "VITE_DATA_REPO=karokri/julebrussmaking-data" >> .env.local
npm run dev
```

> Merk: kryptering bruker Web Crypto, som krever https eller `localhost`. Å åpne dev-serveren fra mobilen via `http://192.168…` virker ikke – bruk Pages-adressen.

## Sikkerhet

Dette er laget for en julebrustest, ikke for hemmeligheter. Tokenet ligger kryptert i den offentlige appen og kan i teorien knekkes med et svakt passord, men det gir kun tilgang til data-repoet. Velg et passord som ikke er helt åpenbart, og la tokenet utløpe etter jul.
