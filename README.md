# Stundenerfassung — PWA

Eine geschützte Smartphone-App, um Arbeitsstunden zu erfassen.  
Funktioniert auf **iPhone** und **Android**, vollständig offline nach dem ersten Laden.

---

## Schritt 1 — GitHub-Konto erstellen

1. Gehe zu **[github.com](https://github.com)** und klicke auf **Sign up**
2. Gib deine E-Mail-Adresse, deinen Benutzernamen und dein Passwort ein
3. Bestätige deine E-Mail-Adresse über die Verifizierungs-Mail
4. Dein Konto ist bereit

---

## Schritt 2 — Repository erstellen

1. Melde dich bei GitHub an
2. Klicke oben rechts auf das **＋**-Symbol → **New repository**
3. Gib einen Namen an, z. B. `stunden-app`
4. Stelle auf **Public** (erforderlich für kostenlose GitHub Pages)
5. Klicke auf **Create repository**

---

## Schritt 3 — Dateien hochladen

### Über die GitHub-Website (am einfachsten)
1. Öffne das soeben erstellte Repository
2. Klicke auf **Add file** → **Upload files**
3. Ziehe alle Dateien aus dem Ordner `hours/` auf den Bildschirm:
   - `index.html`
   - `app.js`
   - `style.css`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
4. Klicke auf **Commit changes**

### Über das Terminal (Alternative)
```bash
cd /pfad/zu/hours
git init
git add .
git commit -m "erste Version"
git remote add origin https://github.com/DEIN-NAME/stunden-app.git
git push -u origin main
```

---

## Schritt 4 — GitHub Pages aktivieren

1. Gehe in GitHub zu deinem Repository
2. Klicke oben auf **Settings** (Zahnrad)
3. Klicke im linken Menü auf **Pages**
4. Stelle Folgendes ein:
   - **Source:** Deploy from a branch
   - **Branch:** `main` — `/ (root)`
5. Klicke auf **Save**
6. Warte etwa 1 Minute. Danach erscheint deine URL:  
   `https://DEIN-NAME.github.io/stunden-app/`

---

## Schritt 5 — App installieren

### iPhone
1. Öffne die URL in **Safari** (nicht Chrome oder Firefox)
2. Tippe unten in der Leiste auf das **Teilen-Symbol** (□↑)
3. Tippe auf **"Zum Home-Bildschirm"**
4. Vergib einen Namen (z. B. "Stunden") und tippe auf **Hinzufügen**

### Android
1. Öffne die URL in **Chrome**
2. Tippe auf das **Menü** (⋮ oben rechts)
3. Tippe auf **"Zum Startbildschirm hinzufügen"**  
   (oder akzeptiere die Installationsmeldung unten auf dem Bildschirm)
4. Tippe auf **Installieren**

---

## Verwendung

| Tab | Funktion |
|-----|---------|
| **＋ Eingabe** | Tag erfassen: Datum, Beginn, Ende, Pause |
| **Übersicht** | Stunden pro Monat; bezahlte Stunden eintragen; Tag bearbeiten oder löschen |
| **Import** | Vorhandene Excel-Datei (.xlsx) laden |
| **⚙** | CSV/JSON exportieren, PIN ändern |

### Tag bearbeiten oder löschen
Tippe in der **Übersicht** auf eine Zeile, um einen Tag zu bearbeiten oder zu löschen.

---

## Sicherheit

Alle Daten werden verschlüsselt mit **AES-256-GCM** gespeichert.  
Ohne die richtige PIN sind die Daten auf dem Gerät vollständig unlesbar.

---

## Symbol anpassen

Ersetze `icon-192.png` und `icon-512.png` durch deine eigenen Bilder  
(jeweils 192×192 bzw. 512×512 Pixel, PNG-Format).

---

## Updates ausrollen

Ändere eine Datei, lade sie erneut über GitHub hoch, und die App aktualisiert  
sich beim nächsten Öffnen mit Internetverbindung automatisch.
