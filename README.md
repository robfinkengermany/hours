# Stundenerfassung — PWA

Eine geschützte Smartphone-App, um Arbeitsstunden zu erfassen.  
Funktioniert auf **iPhone** und **Android**, vollständig offline nach dem ersten Laden.

App installieren

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
