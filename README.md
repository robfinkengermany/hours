# Uren Registratie — PWA

Een beveiligde smartphone-app om gewerkte uren bij te houden.  
Werkt op **iPhone** én **Android**, volledig offline na de eerste keer laden.

---

## Stap 1 — GitHub-account aanmaken

1. Ga naar **[github.com](https://github.com)** en klik op **Sign up**
2. Vul je e-mailadres, gebruikersnaam en wachtwoord in
3. Bevestig je e-mailadres via de verificatiemail
4. Je account is klaar

---

## Stap 2 — Repository aanmaken

1. Log in op GitHub
2. Klik op het **＋** icoontje rechtsboven → **New repository**
3. Geef het een naam, bijv. `uren-app`
4. Zet op **Public** (vereist voor gratis GitHub Pages)
5. Klik **Create repository**

---

## Stap 3 — Bestanden uploaden

### Via de GitHub-website (eenvoudigst)
1. Open de zojuist gemaakte repository
2. Klik **Add file** → **Upload files**
3. Sleep alle bestanden uit de `hours/` map naar het scherm:
   - `index.html`
   - `app.js`
   - `style.css`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
4. Klik **Commit changes**

### Via de terminal (alternatief)
```bash
cd /pad/naar/hours
git init
git add .
git commit -m "eerste versie"
git remote add origin https://github.com/JOUW-NAAM/uren-app.git
git push -u origin main
```

---

## Stap 4 — GitHub Pages inschakelen

1. Ga naar je repository op GitHub
2. Klik bovenaan op **Settings** (tandwiel)
3. Klik in het linkermenu op **Pages**
4. Stel in:
   - **Source:** Deploy from a branch
   - **Branch:** `main` — `/ (root)`
5. Klik **Save**
6. Wacht ~1 minuut. Je URL verschijnt:  
   `https://JOUW-NAAM.github.io/uren-app/`

---

## Stap 5 — App installeren

### iPhone
1. Open de URL in **Safari** (niet Chrome of Firefox)
2. Tik op het **deel-icoon** (□↑) onderin de balk
3. Tik **"Zet op beginscherm"**
4. Geef een naam (bijv. "Uren") en tik **Voeg toe**

### Android
1. Open de URL in **Chrome**
2. Tik op het **menu** (⋮ rechtsboven)
3. Tik **"Toevoegen aan startscherm"**  
   (of accepteer de installatiemelding onderaan het scherm)
4. Tik **Installeren**

---

## Gebruik

| Tab | Functie |
|-----|---------|
| **＋ Invoer** | Dag registreren: datum, begin, einde, pauze |
| **Overzicht** | Uren per maand; betaald uren invullen; dag bewerken of verwijderen |
| **Import** | Bestaand Excel-bestand (.xlsx) inladen |
| **⚙** | CSV/JSON exporteren, PIN wijzigen |

### Dag bewerken of verwijderen
Tik op een rij in het **Overzicht** om een dag te bewerken of te verwijderen.

---

## Beveiliging

Alle data is versleuteld opgeslagen met **AES-256-GCM**.  
Zonder de juiste PIN zijn de gegevens op het apparaat volledig onleesbaar.

---

## Icoon aanpassen

Vervang `icon-192.png` en `icon-512.png` door je eigen afbeeldingen  
(respectievelijk 192×192 en 512×512 pixels, PNG-formaat).

---

## Updates uitrollen

Pas een bestand aan, upload het opnieuw via GitHub en de app vernieuwt  
zichzelf automatisch de volgende keer dat je het opent met internet.
