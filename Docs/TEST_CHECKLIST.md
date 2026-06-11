# QA-Testcheckliste

Manuell im Unity-Editor durchführen (leere Szene + `ArcadeLauncher`, Play).

## Boot & Menü
- [ ] Play in leerer Szene mit nur `ArcadeLauncher`: keine Console-Errors.
- [ ] Console zeigt 3 geladene Fragenkataloge (grundstufe/mittelstufe/oberstufe).
- [ ] Menü zeigt Titel, 3 Kategorie-Buttons, 8 Spiel-Buttons, Statistik-Zeile.
- [ ] Kategorie-Klick hebt den gewählten Button orange hervor.
- [ ] Erster Start vergibt Tagesserien-Bonus (Münzen > 0 in Statistik-Zeile).

## Gemeinsamer Session-Loop (in jedem Spiel prüfen)
- [ ] HUD zeigt „Frage X/6", Level/XP, Münzen.
- [ ] Richtige Antwort: grünes Popup „+XP", Korrekt-Sound, nach ~1,2 s weiter.
- [ ] Falsche Antwort: rotes Popup MIT Erklärungstext, ~5 s Lesezeit.
- [ ] Combo-Anzeige „🔥 xN" erscheint ab 2 richtigen in Folge, reset bei Fehler.
- [ ] Nach 6 Fragen: Ergebnis-Panel mit Score und „Nochmal spielen".
- [ ] „Nochmal spielen" startet neue Runde; „← Spielhalle" führt ins Menü zurück.
- [ ] XP/Münzen bleiben nach Editor-Stop/Play erhalten (Save unter persistentDataPath).

## Pro Mini-Game
- [ ] **Wortlauf**: Kugel läuft automatisch; A/D bzw. Pfeile steuern; Durchlaufen
      eines Tors wertet; richtiges Tor färbt sich grün.
- [ ] **Gleichnis-Paare**: Links-Klick wählt (gelb), Rechts-Klick paart; richtige
      Paare locken grün; falsches Paar blinkt rot; ≤1 Fehler zählt als richtig.
- [ ] **Wächter des Wissens**: Boss-HP sinkt pro richtiger Antwort und schrumpft
      sichtbar; Herzen sinken bei Fehlern; 0 Herzen beendet die Runde vorzeitig.
- [ ] **Brücke der Zeitalter**: Steine in richtiger Reihenfolge anklicken; jeder
      richtige fliegt als Planke in die Brücke; falscher wackelt.
- [ ] **Karten der Weisheit**: Karte ausspielen schiebt den Duell-Marker; gespielte
      Karte rutscht in die Tischmitte.
- [ ] **Takt der Wahrheit**: Pulsring schlägt im Takt; Countdown sichtbar; Timeout
      wertet als Fehler (mit Erklärung); Klick bei engem Ring gibt Bonus-XP.
- [ ] **Lauf der Boten**: Rivale zieht jede Frage weiter; richtige Antwort boostet
      stärker; Sieg zahlt +20 Münzen.
- [ ] **Stadt des Lichts**: Gebäude ausgrauen wenn zu teuer; Kauf verlangt
      Bauprüfungs-Frage; Gebäude erscheint und ist nach Neustart noch da.

## Daten & Robustheit
- [ ] Ungültige JSON-Datei in Questions/ → Error-Log, App läuft weiter.
- [ ] Frage ohne Pflichtfelder wird beim Laden verworfen (IsValid).
- [ ] Speicherdatei löschen → frisches Profil ohne Fehler.
- [ ] Gerätedatum +1 Tag → Tagesserie +1; +2 Tage → Serie reset auf 1.
- [ ] Audio funktioniert ohne zugewiesene Clips (Synth-Töne hörbar).

## ADHS-UX-Abnahme
- [ ] Eine komplette Runde dauert unter 5 Minuten.
- [ ] Feedback erscheint ohne wahrnehmbare Verzögerung nach der Antwort.
- [ ] Jede falsche Antwort liefert eine konkrete Erklärung, keine reine „Falsch"-Meldung.
- [ ] Kein Spiel blockiert den Fortschritt dauerhaft (immer „Nochmal"/Menü möglich).
