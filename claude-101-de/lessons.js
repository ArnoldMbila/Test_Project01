/*
 * Claude 101 – Deutsche Lernversion
 * Inhaltsdaten für alle 14 Lektionen.
 * Als globale Variable geladen, damit die App auch per file:// (ohne Server) läuft.
 *
 * Struktur je Lektion:
 *   id, emoji, titel, dauer (Min.), farbe (Akzent),
 *   intro (Kurzteaser),
 *   chunks: [{ titel, text, merke? }]  -> ADHS-freundliche Häppchen
 *   quiz:   [{ frage, optionen[], richtig(Index), erklaerung }]
 */

window.LESSONS = [
  /* ------------------------------------------------------------------ */
  {
    id: 1,
    emoji: "👋",
    titel: "Willkommen bei Claude",
    dauer: 5,
    farbe: "#ff6b6b",
    intro: "Was ist Claude, wer steckt dahinter – und was nimmst du aus diesem Kurs mit?",
    chunks: [
      {
        titel: "Was ist Claude?",
        text: "Claude ist ein KI-Assistent von Anthropic. Du schreibst ihm in ganz normaler Sprache – wie einer klugen Kollegin – und Claude antwortet: erklärt, schreibt, fasst zusammen, programmiert oder denkt mit dir mit.",
        merke: "Claude = KI-Assistent, den du in Alltagssprache bedienst."
      },
      {
        titel: "Wer ist Anthropic?",
        text: "Anthropic ist das Unternehmen hinter Claude, gegründet 2021. Das Ziel: KI entwickeln, die sicher, ehrlich und für Menschen nützlich ist. Sicherheit steht bei jeder Entscheidung mit an erster Stelle.",
        merke: "Anthropic baut Claude mit Fokus auf Sicherheit & Nützlichkeit."
      },
      {
        titel: "Was du hier lernst",
        text: "In 14 kurzen Lektionen lernst du: wie Claude funktioniert, wie du ihn erreichst, wie du gute Anweisungen (Prompts) schreibst, was Projekte & Artifacts sind – und wie du verantwortungsvoll damit arbeitest.",
        merke: "14 Lektionen – vom ersten Chat bis zu Profi-Prompts."
      },
      {
        titel: "Kein Vorwissen nötig",
        text: "Du brauchst keine Technik-Kenntnisse und musst nicht programmieren können. Neugier reicht. Jede Lektion ist ein kleines Häppchen – du kannst jederzeit pausieren und weitermachen.",
        merke: "Null Vorwissen – nur Neugier."
      }
    ],
    quiz: [
      {
        frage: "Wer entwickelt Claude?",
        optionen: ["Anthropic", "Ein Musikstreaming-Dienst", "Du selbst", "Niemand"],
        richtig: 0,
        erklaerung: "Claude wird von Anthropic entwickelt – einem Unternehmen mit Fokus auf sichere KI."
      },
      {
        frage: "Was brauchst du, um mit Claude zu starten?",
        optionen: ["Einen Doktortitel", "Programmierkenntnisse", "Nur Neugier und Alltagssprache", "Spezielle Hardware"],
        richtig: 2,
        erklaerung: "Du bedienst Claude in normaler Sprache – kein Vorwissen nötig."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 2,
    emoji: "🧠",
    titel: "Was ist ein Sprachmodell?",
    dauer: 6,
    farbe: "#f7b731",
    intro: "Wie 'denkt' Claude eigentlich? Ein Blick unter die Haube – ohne Mathe-Stress.",
    chunks: [
      {
        titel: "Ein großes Sprachmodell (LLM)",
        text: "Claude ist ein 'Large Language Model'. Es wurde mit riesigen Mengen Text trainiert und hat dabei Muster der Sprache gelernt: welches Wort typischerweise auf welches folgt, wie Argumente aufgebaut sind, wie man erklärt.",
        merke: "LLM = Modell, das Sprachmuster aus sehr viel Text gelernt hat."
      },
      {
        titel: "Vorhersage, kein Nachschlagen",
        text: "Claude schlägt Antworten nicht in einer Datenbank nach. Es sagt Schritt für Schritt das wahrscheinlich passendste nächste Wort voraus. Aus dieser Vorhersage entstehen zusammenhängende, sinnvolle Antworten.",
        merke: "Claude erzeugt Text, statt ihn abzurufen."
      },
      {
        titel: "Tokens – die Bausteine",
        text: "Text wird intern in kleine Stücke zerlegt, sogenannte Tokens. Ein Token ist oft ein kurzes Wort oder Wortteil. Claude liest und schreibt in Tokens – wichtig später beim Thema Kontextfenster.",
        merke: "Token = kleiner Textbaustein (Wort oder Wortteil)."
      },
      {
        titel: "Warum das für dich zählt",
        text: "Weil Claude vorhersagt statt nachschlägt, kann es kreativ und flexibel sein – aber auch mal danebenliegen. Deshalb lohnt es sich, wichtige Fakten gegenzuprüfen (mehr dazu in Lektion 13).",
        merke: "Flexibel & kreativ – aber Fakten prüfen."
      }
    ],
    quiz: [
      {
        frage: "Wie entstehen Claudes Antworten grob gesagt?",
        optionen: ["Durch Nachschlagen in einer festen Datenbank", "Durch Vorhersage des nächsten passenden Wortes", "Durch Zufall", "Durch menschliche Mitarbeiter im Hintergrund"],
        richtig: 1,
        erklaerung: "Claude sagt Schritt für Schritt das wahrscheinlichste nächste Wort voraus."
      },
      {
        frage: "Was ist ein Token?",
        optionen: ["Eine Bezahlmünze", "Ein kleiner Textbaustein", "Ein Passwort", "Ein Fehlercode"],
        richtig: 1,
        erklaerung: "Tokens sind kleine Stücke (Wörter/Wortteile), in denen Claude Text verarbeitet."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 3,
    emoji: "🚪",
    titel: "So erreichst du Claude",
    dauer: 5,
    farbe: "#26de81",
    intro: "Web, App, API oder Terminal – vier Wege zu Claude. Welcher passt zu dir?",
    chunks: [
      {
        titel: "Claude.ai im Browser",
        text: "Der einfachste Weg: die Website claude.ai. Anmelden, Nachricht tippen, loslegen. Perfekt für Fragen, Texte, Ideen und den Alltag – ganz ohne Installation.",
        merke: "claude.ai = der schnellste Einstieg im Browser."
      },
      {
        titel: "Die Apps",
        text: "Es gibt Claude auch als App für Handy (iOS/Android) und Desktop (Mac/Windows). So hast du Claude unterwegs dabei oder direkt griffbereit auf dem Rechner.",
        merke: "Apps für Handy & Desktop – Claude immer dabei."
      },
      {
        titel: "Die API – für Entwickler",
        text: "Über die API können Programmierer Claude in eigene Software, Apps oder Automatisierungen einbauen. Damit wird Claude Teil ganzer Arbeitsabläufe – ohne dass jemand tippen muss.",
        merke: "API = Claude in eigene Programme einbauen."
      },
      {
        titel: "Claude Code – im Terminal",
        text: "Für Programmierarbeit gibt es Claude Code: ein Assistent, der direkt in der Entwicklungsumgebung / im Terminal Code liest, schreibt und ändert. Für diesen Kurs reicht claude.ai völlig aus.",
        merke: "Claude Code = Programmier-Assistent im Terminal."
      }
    ],
    quiz: [
      {
        frage: "Was ist der einfachste Einstieg für Einsteiger?",
        optionen: ["Die API", "Claude Code im Terminal", "Die Website claude.ai", "Ein selbst gebauter Server"],
        richtig: 2,
        erklaerung: "claude.ai im Browser braucht keine Installation – ideal zum Starten."
      },
      {
        frage: "Wofür ist die API gedacht?",
        optionen: ["Zum Chatten im Browser", "Um Claude in eigene Software einzubauen", "Um Passwörter zu speichern", "Um Videos zu schneiden"],
        richtig: 1,
        erklaerung: "Mit der API integrieren Entwickler Claude in eigene Anwendungen."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 4,
    emoji: "💬",
    titel: "Dein erstes Gespräch",
    dauer: 6,
    farbe: "#45aaf2",
    intro: "Das Chat-Fenster verstehen: Nachrichten, Antworten und der rote Faden.",
    chunks: [
      {
        titel: "Nachricht rein, Antwort raus",
        text: "Du schreibst eine Nachricht ins Feld und drückst Enter. Claude antwortet. Du kannst nachfragen, um Verbesserungen bitten oder das Thema wechseln – ganz wie in einem echten Gespräch.",
        merke: "Chat = Hin und Her, wie mit einem Menschen."
      },
      {
        titel: "Der rote Faden (Kontext)",
        text: "Innerhalb eines Gesprächs merkt sich Claude, was vorher gesagt wurde. Du kannst dich also auf frühere Nachrichten beziehen: 'Mach das kürzer' oder 'Erklär den zweiten Punkt genauer'.",
        merke: "Innerhalb eines Chats erinnert sich Claude an den Verlauf."
      },
      {
        titel: "Neues Gespräch = neuer Start",
        text: "Startest du ein neues Gespräch, beginnt Claude ohne Erinnerung an den vorherigen Chat. Praktisch, wenn du das Thema komplett wechseln willst und keine Vermischung möchtest.",
        merke: "Neuer Chat = weißes Blatt, kein alter Kontext."
      },
      {
        titel: "Nachhaken lohnt sich",
        text: "Die erste Antwort ist selten das Ende. Bitte um Beispiele, einen anderen Ton, eine Tabelle oder eine kürzere Version. Genau dieses Nachschärfen macht Claude so nützlich.",
        merke: "Iterieren statt aufgeben – nachschärfen bringt bessere Ergebnisse."
      }
    ],
    quiz: [
      {
        frage: "Erinnert sich Claude innerhalb eines Gesprächs an das Vorherige?",
        optionen: ["Ja, an den bisherigen Verlauf des Chats", "Nein, nie", "Nur an die allererste Nachricht", "Nur wenn du zahlst"],
        richtig: 0,
        erklaerung: "Innerhalb eines Gesprächs nutzt Claude den bisherigen Verlauf als Kontext."
      },
      {
        frage: "Was passiert in einem neuen Gespräch?",
        optionen: ["Der alte Chat wird fortgesetzt", "Claude startet ohne Erinnerung an den vorherigen Chat", "Alle Chats werden gelöscht", "Nichts"],
        richtig: 1,
        erklaerung: "Ein neues Gespräch beginnt ohne den Kontext des vorherigen."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 5,
    emoji: "✍️",
    titel: "Die Kunst des Promptens",
    dauer: 7,
    farbe: "#a55eea",
    intro: "Ein Prompt ist deine Anweisung an Claude. Klar formuliert = bessere Antwort.",
    chunks: [
      {
        titel: "Was ist ein Prompt?",
        text: "Ein Prompt ist einfach das, was du Claude schreibst – deine Frage oder Aufgabe. Je klarer der Prompt, desto besser die Antwort. Prompten ist eine Fähigkeit, die man üben kann.",
        merke: "Prompt = deine Anweisung an Claude."
      },
      {
        titel: "Sei konkret",
        text: "Statt 'Schreib was über Hunde' lieber: 'Schreib 3 kurze Tipps für die Stubenreinheit eines Welpen, freundlich und für Anfänger.' Konkrete Angaben zu Ziel, Länge und Ton wirken Wunder.",
        merke: "Konkret schlägt vage – nenne Ziel, Länge, Ton."
      },
      {
        titel: "Sag, wer die Zielgruppe ist",
        text: "'Erklär mir Zinsen' vs. 'Erklär mir Zinsen so, als wäre ich 10 Jahre alt.' Wenn Claude weiß, für wen die Antwort ist, trifft es Sprache und Tiefe viel besser.",
        merke: "Zielgruppe nennen → passender Ton & Tiefe."
      },
      {
        titel: "Format vorgeben",
        text: "Du kannst das Ausgabeformat bestimmen: 'als Aufzählung', 'als Tabelle', 'in maximal 5 Sätzen', 'als E-Mail'. Claude hält sich gern an klare Formatwünsche.",
        merke: "Format ansagen: Liste, Tabelle, E-Mail, Länge …"
      }
    ],
    quiz: [
      {
        frage: "Welcher Prompt ist besser?",
        optionen: ["'Schreib was über Reisen'", "'Nenne 3 günstige Reisetipps für Studierende, je 1 Satz'", "'Reisen'", "'Mach irgendwas'"],
        richtig: 1,
        erklaerung: "Konkrete Angaben zu Anzahl, Zielgruppe und Länge führen zu besseren Antworten."
      },
      {
        frage: "Warum die Zielgruppe angeben?",
        optionen: ["Damit Claude Ton und Tiefe passend wählt", "Damit es länger dauert", "Aus Höflichkeit", "Das ändert nichts"],
        richtig: 0,
        erklaerung: "Mit bekannter Zielgruppe trifft Claude Sprache und Detailtiefe besser."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 6,
    emoji: "🎯",
    titel: "Prompt Engineering",
    dauer: 8,
    farbe: "#fd9644",
    intro: "Drei Profi-Techniken: Kontext geben, Beispiele zeigen, Rolle zuweisen.",
    chunks: [
      {
        titel: "Kontext mitgeben",
        text: "Gib Claude die Hintergrundinfos, die es braucht: 'Ich schreibe für einen Backblog, Zielgruppe Hobbybäcker.' Je mehr relevanter Kontext, desto passgenauer die Antwort.",
        merke: "Kontext = Hintergrundinfos, die die Antwort schärfen."
      },
      {
        titel: "Beispiele zeigen (Few-Shot)",
        text: "Zeig Claude ein Beispiel für das gewünschte Ergebnis: 'Formuliere so wie in diesem Beispiel …'. Ein oder zwei Muster helfen Claude, Stil und Format genau zu treffen.",
        merke: "Few-Shot = mit Beispielen den Stil vorgeben."
      },
      {
        titel: "Eine Rolle zuweisen",
        text: "'Agiere als erfahrener Lektor' oder 'als geduldiger Mathe-Nachhilfelehrer'. Eine Rolle lenkt Perspektive, Ton und Fachtiefe der Antwort.",
        merke: "Rolle zuweisen → Perspektive & Ton steuern."
      },
      {
        titel: "Schritt für Schritt denken lassen",
        text: "Bei kniffligen Aufgaben hilft: 'Denk das Schritt für Schritt durch.' Claude arbeitet dann strukturierter und macht weniger Flüchtigkeitsfehler.",
        merke: "'Schritt für Schritt' = strukturierteres Denken."
      }
    ],
    quiz: [
      {
        frage: "Was bedeutet 'Few-Shot'?",
        optionen: ["Mehrere Fotos schicken", "Claude Beispiele für das gewünschte Ergebnis zeigen", "Nur ein Wort schreiben", "Schnell antworten"],
        richtig: 1,
        erklaerung: "Few-Shot heißt: Du gibst ein paar Beispiele vor, an denen sich Claude orientiert."
      },
      {
        frage: "Warum eine Rolle zuweisen ('agiere als …')?",
        optionen: ["Es sieht nett aus", "Um Perspektive, Ton und Fachtiefe zu steuern", "Es ist Pflicht", "Damit Claude langsamer wird"],
        richtig: 1,
        erklaerung: "Eine Rolle lenkt Blickwinkel und Sprachniveau der Antwort."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 7,
    emoji: "🪟",
    titel: "Das Kontextfenster",
    dauer: 7,
    farbe: "#4b7bec",
    intro: "Wie viel kann Claude auf einmal 'im Kopf' behalten? Das erklärt das Kontextfenster.",
    chunks: [
      {
        titel: "Was ist das Kontextfenster?",
        text: "Das Kontextfenster ist die Menge an Text, die Claude in einem Gespräch gleichzeitig berücksichtigen kann – deine Nachrichten plus die Antworten. Gemessen wird es in Tokens.",
        merke: "Kontextfenster = Arbeitsspeicher des Gesprächs (in Tokens)."
      },
      {
        titel: "Sehr groß, aber nicht unendlich",
        text: "Moderne Claude-Modelle haben ein sehr großes Kontextfenster – ganze Dokumente passen hinein. Trotzdem gibt es eine Grenze: Irgendwann rückt sehr Altes aus dem Blickfeld.",
        merke: "Groß, aber begrenzt – sehr Altes kann herausfallen."
      },
      {
        titel: "Tipp bei langen Chats",
        text: "Wird ein Gespräch riesig, kann Frühes ungenauer werden. Fasse dann Wichtiges kurz zusammen und gib es Claude erneut, oder starte einen frischen, fokussierten Chat.",
        merke: "Bei Mammut-Chats: Wichtiges zusammenfassen oder neu starten."
      },
      {
        titel: "Warum das nützlich ist",
        text: "Dank großem Kontextfenster kannst du lange Texte, Berichte oder Verträge auf einmal einfügen und Claude alles zusammen analysieren lassen – ohne es in Häppchen zu zerlegen.",
        merke: "Großes Fenster = ganze Dokumente auf einmal analysieren."
      }
    ],
    quiz: [
      {
        frage: "Was beschreibt das Kontextfenster?",
        optionen: ["Die Bildschirmgröße", "Wie viel Text Claude gleichzeitig berücksichtigen kann", "Die Internetgeschwindigkeit", "Die Anzahl der Nutzer"],
        richtig: 1,
        erklaerung: "Das Kontextfenster ist die Textmenge, die Claude gleichzeitig einbeziehen kann."
      },
      {
        frage: "Was tun, wenn ein Gespräch extrem lang wird?",
        optionen: ["Nichts, ist egal", "Wichtiges zusammenfassen oder neu starten", "Den Computer neu starten", "Lauter schreiben"],
        richtig: 1,
        erklaerung: "Bei sehr langen Chats hilft es, Kernpunkte zusammenzufassen oder frisch zu beginnen."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 8,
    emoji: "📎",
    titel: "Dateien & Dokumente",
    dauer: 6,
    farbe: "#2bcbba",
    intro: "PDFs, Bilder, Tabellen: Claude kann Dateien lesen und mit dir darüber arbeiten.",
    chunks: [
      {
        titel: "Dateien hochladen",
        text: "Du kannst Dokumente direkt ins Gespräch hochladen – etwa PDFs, Textdateien oder Bilder. Claude liest den Inhalt und du kannst Fragen dazu stellen.",
        merke: "Datei hochladen → Claude liest & du fragst."
      },
      {
        titel: "Zusammenfassen & auswerten",
        text: "Lade einen langen Bericht hoch und bitte: 'Fasse die 5 wichtigsten Punkte zusammen' oder 'Was sind die Risiken?'. Claude spart dir das mühsame Selbstlesen.",
        merke: "Lange Dokumente → auf Knopfdruck zusammengefasst."
      },
      {
        titel: "Bilder verstehen",
        text: "Claude kann Bilder analysieren: ein Foto beschreiben, einen Screenshot erklären, ein Diagramm auswerten oder Text aus einem Bild herauslesen.",
        merke: "Claude 'sieht' Bilder – beschreiben, erklären, auslesen."
      },
      {
        titel: "Sinnvoll kombinieren",
        text: "Kombiniere Datei + klare Aufgabe: 'Hier ist meine Tabelle – finde Ausreißer und erklär sie in einfachen Worten.' So wird aus Rohdaten schnell eine verständliche Antwort.",
        merke: "Datei + klare Aufgabe = starke Ergebnisse."
      }
    ],
    quiz: [
      {
        frage: "Was kann Claude mit einem hochgeladenen PDF tun?",
        optionen: ["Nichts", "Inhalt lesen und z. B. zusammenfassen", "Es nur speichern", "Es ausdrucken"],
        richtig: 1,
        erklaerung: "Claude liest den Inhalt und kann ihn zusammenfassen oder auswerten."
      },
      {
        frage: "Kann Claude Bilder analysieren?",
        optionen: ["Ja – beschreiben, erklären, Text auslesen", "Nein, nur Text", "Nur schwarz-weiße Bilder", "Nur mit Spezialgerät"],
        richtig: 0,
        erklaerung: "Claude kann Bilder beschreiben, erklären und enthaltenen Text erkennen."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 9,
    emoji: "🗂️",
    titel: "Projects (Projekte)",
    dauer: 6,
    farbe: "#eb3b5a",
    intro: "Bündle Wissen und Anweisungen an einem Ort – für wiederkehrende Aufgaben.",
    chunks: [
      {
        titel: "Was ist ein Projekt?",
        text: "Ein Projekt ist ein eigener Arbeitsbereich in Claude, in dem du Dateien, Kontext und dauerhafte Anweisungen sammelst. Alle Chats im Projekt greifen darauf zu.",
        merke: "Projekt = Arbeitsbereich mit gemeinsamem Wissen."
      },
      {
        titel: "Wissen einmal hinterlegen",
        text: "Lade z. B. deine Markenrichtlinien oder Produktinfos einmal ins Projekt. Danach kennt Claude in jedem Chat des Projekts diesen Hintergrund – du musst ihn nicht ständig wiederholen.",
        merke: "Einmal hinterlegen, immer wieder nutzen."
      },
      {
        titel: "Dauerhafte Anweisungen",
        text: "Du kannst feste Regeln setzen: 'Antworte immer auf Deutsch, freundlich, in kurzen Absätzen.' Diese gelten dann für das ganze Projekt.",
        merke: "Projekt-Anweisungen = Regeln für alle Chats darin."
      },
      {
        titel: "Ideal für Wiederkehrendes",
        text: "Projekte lohnen sich, wenn du eine Aufgabe oft machst – Kundenmails, Content für einen Kanal, Auswertungen. Der gemeinsame Kontext spart jedes Mal Zeit.",
        merke: "Perfekt für Aufgaben, die du regelmäßig wiederholst."
      }
    ],
    quiz: [
      {
        frage: "Wozu dient ein Projekt in Claude?",
        optionen: ["Dateien, Kontext & Anweisungen an einem Ort bündeln", "Videos zu rendern", "Das Internet schneller zu machen", "Nichts Bestimmtes"],
        richtig: 0,
        erklaerung: "Projekte bündeln gemeinsames Wissen und Regeln für mehrere Chats."
      },
      {
        frage: "Vorteil dauerhafter Projekt-Anweisungen?",
        optionen: ["Man muss Regeln nicht in jedem Chat wiederholen", "Sie kosten extra", "Sie löschen Chats", "Kein Vorteil"],
        richtig: 0,
        erklaerung: "Einmal gesetzt, gelten die Anweisungen für alle Chats im Projekt."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 10,
    emoji: "🎨",
    titel: "Artifacts",
    dauer: 6,
    farbe: "#f368e0",
    intro: "Wenn Claude nicht nur redet, sondern etwas Fertiges baut – im eigenen Fenster.",
    chunks: [
      {
        titel: "Was sind Artifacts?",
        text: "Artifacts sind eigenständige Ergebnisse, die Claude in einem separaten Fenster erstellt: ein längeres Dokument, Code, eine Tabelle oder sogar eine kleine interaktive Web-Seite.",
        merke: "Artifact = fertiges Werk im eigenen Fenster."
      },
      {
        titel: "Warum praktisch?",
        text: "Das Artifact steht neben dem Chat, bleibt übersichtlich und lässt sich leicht kopieren oder weiterverwenden. Der Chat bleibt fürs Gespräch, das Artifact fürs Ergebnis.",
        merke: "Chat = Gespräch, Artifact = sauberes Endergebnis."
      },
      {
        titel: "Live weiterentwickeln",
        text: "Du kannst Artifacts iterativ verbessern: 'Mach die Überschrift größer', 'Füge einen Abschnitt hinzu'. Claude aktualisiert das Artifact, statt alles neu zu schreiben.",
        merke: "Artifacts wachsen mit – Schritt für Schritt verfeinern."
      },
      {
        titel: "Typische Beispiele",
        text: "Ein Bewerbungsschreiben, ein Code-Schnipsel, eine Checkliste, ein einfacher Rechner als Web-Seite – all das kann als Artifact entstehen und direkt genutzt werden.",
        merke: "Dokumente, Code, Tools – als nutzbares Artifact."
      }
    ],
    quiz: [
      {
        frage: "Was ist ein Artifact?",
        optionen: ["Ein Virus", "Ein eigenständiges Ergebnis in einem separaten Fenster", "Ein Abo", "Ein Fehler"],
        richtig: 1,
        erklaerung: "Artifacts sind fertige Werke (Doku, Code, Web-Seite) in einem eigenen Fenster."
      },
      {
        frage: "Wie verbesserst du ein Artifact?",
        optionen: ["Gar nicht", "Alles neu tippen", "Claude um gezielte Änderungen bitten", "Neu anmelden"],
        richtig: 2,
        erklaerung: "Du bittest um konkrete Änderungen – Claude aktualisiert das Artifact."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 11,
    emoji: "⚙️",
    titel: "Claudes Modelle",
    dauer: 6,
    farbe: "#3867d6",
    intro: "Opus, Sonnet, Haiku: verschiedene Modelle für verschiedene Bedürfnisse.",
    chunks: [
      {
        titel: "Eine Familie von Modellen",
        text: "Claude gibt es in mehreren Varianten. Sie unterscheiden sich vor allem in der Balance aus Leistungsstärke und Geschwindigkeit. Namensfamilien: Opus, Sonnet, Haiku.",
        merke: "Claude ist eine Modell-Familie: Opus, Sonnet, Haiku."
      },
      {
        titel: "Opus – der Kraftprotz",
        text: "Opus-Modelle sind besonders leistungsstark und gut für komplexe, anspruchsvolle Aufgaben: tiefes Nachdenken, kniffliges Programmieren, sorgfältige Analysen.",
        merke: "Opus = maximale Leistung für schwere Aufgaben."
      },
      {
        titel: "Sonnet – die Balance",
        text: "Sonnet-Modelle bieten eine starke Mischung aus Können und Tempo. Für die meisten Alltags- und Arbeitsaufgaben eine ausgezeichnete Wahl.",
        merke: "Sonnet = guter Allrounder aus Leistung & Tempo."
      },
      {
        titel: "Haiku – der Flinke",
        text: "Haiku-Modelle sind auf Geschwindigkeit optimiert – ideal, wenn schnelle, leichte Antworten wichtiger sind als maximale Tiefe. Wähle das Modell je nach Aufgabe.",
        merke: "Haiku = schnell & leichtgewichtig."
      }
    ],
    quiz: [
      {
        frage: "Welches Modell ist für sehr komplexe, anspruchsvolle Aufgaben gedacht?",
        optionen: ["Haiku", "Opus", "Keines", "Alle gleich"],
        richtig: 1,
        erklaerung: "Opus ist besonders leistungsstark für schwierige Aufgaben."
      },
      {
        frage: "Was zeichnet Haiku aus?",
        optionen: ["Es ist besonders schnell und leichtgewichtig", "Es ist am langsamsten", "Es kann nichts", "Es ist ein Gedicht"],
        richtig: 0,
        erklaerung: "Haiku ist auf Geschwindigkeit optimiert – ideal für schnelle Antworten."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 12,
    emoji: "🛡️",
    titel: "Sicherheit & verantwortungsvolle KI",
    dauer: 7,
    farbe: "#0fb9b1",
    intro: "Warum Claude bewusst hilfreich, ehrlich und harmlos sein soll.",
    chunks: [
      {
        titel: "Anthropics Mission",
        text: "Anthropic will KI entwickeln, die dem Menschen nützt und dabei sicher bleibt. Sicherheit ist kein nachträglicher Anstrich, sondern von Anfang an eingebaut.",
        merke: "Sicherheit ist bei Claude von Anfang an eingebaut."
      },
      {
        titel: "Constitutional AI",
        text: "Claude wird mit einem Satz von Prinzipien ('Verfassung') trainiert, an denen es sein Verhalten ausrichtet. So lernt es, hilfreich zu sein und zugleich Schädliches zu vermeiden.",
        merke: "Constitutional AI = Training an klaren Prinzipien."
      },
      {
        titel: "Hilfreich, ehrlich, harmlos",
        text: "Das Leitbild lautet: hilfreich (nützliche Antworten), ehrlich (keine Täuschung, Unsicherheit zugeben) und harmlos (keine gefährlichen Anleitungen). Deshalb lehnt Claude manche Bitten ab.",
        merke: "Leitbild: hilfreich, ehrlich, harmlos."
      },
      {
        titel: "Deine Verantwortung",
        text: "Auch du trägst Verantwortung: Prüfe wichtige Fakten, teile keine sensiblen Daten leichtfertig und nutze Claude fair. KI ist ein Werkzeug – du triffst die Entscheidungen.",
        merke: "Du entscheidest – Claude ist ein Werkzeug, kein Ersatz."
      }
    ],
    quiz: [
      {
        frage: "Wofür steht das Leitbild von Claude?",
        optionen: ["Schnell, laut, bunt", "Hilfreich, ehrlich, harmlos", "Teuer, geheim, komplex", "Nichts davon"],
        richtig: 1,
        erklaerung: "Claude soll hilfreich, ehrlich und harmlos sein."
      },
      {
        frage: "Was ist 'Constitutional AI'?",
        optionen: ["Ein Rechtsstudium", "Training an einem Satz klarer Prinzipien", "Ein Gesetz", "Ein Passwort"],
        richtig: 1,
        erklaerung: "Claude richtet sein Verhalten an einer 'Verfassung' aus Prinzipien aus."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 13,
    emoji: "⚠️",
    titel: "Grenzen & Halluzinationen",
    dauer: 7,
    farbe: "#fa8231",
    intro: "Claude ist stark – aber nicht unfehlbar. Was du wissen und prüfen solltest.",
    chunks: [
      {
        titel: "Was sind Halluzinationen?",
        text: "Manchmal formuliert Claude etwas überzeugend, das aber falsch ist – das nennt man Halluzination. Weil Claude Text vorhersagt, kann es plausibel klingenden Unsinn erzeugen.",
        merke: "Halluzination = überzeugend klingende, falsche Aussage."
      },
      {
        titel: "Fakten gegenprüfen",
        text: "Bei wichtigen Zahlen, Zitaten, Namen oder rechtlichen/medizinischen Themen gilt: gegenprüfen. Bitte Claude um Quellen und verlasse dich nicht blind auf eine einzelne Antwort.",
        merke: "Wichtige Fakten immer unabhängig prüfen."
      },
      {
        titel: "Wissensstand & Aktualität",
        text: "Claudes Wissen hat einen Trainings-Stichtag. Sehr aktuelle Ereignisse kennt es evtl. nicht. Für Tagesaktuelles sind zusätzliche, aktuelle Quellen nötig.",
        merke: "Nicht immer tagesaktuell – bei Neuem extra prüfen."
      },
      {
        titel: "Kein Ersatz für Fachleute",
        text: "Bei Gesundheit, Recht oder Finanzen liefert Claude Orientierung, ersetzt aber keine Fachperson. Nutze es als Startpunkt, nicht als letzte Instanz.",
        merke: "Orientierung ja – Fachperson bleibt Fachperson."
      }
    ],
    quiz: [
      {
        frage: "Was ist eine Halluzination bei KI?",
        optionen: ["Ein Bild", "Eine überzeugend klingende, aber falsche Aussage", "Ein Traum", "Ein Fehlercode"],
        richtig: 1,
        erklaerung: "Claude kann plausibel klingende, aber falsche Aussagen erzeugen."
      },
      {
        frage: "Wie gehst du mit wichtigen Fakten um?",
        optionen: ["Blind vertrauen", "Unabhängig gegenprüfen", "Ignorieren", "Sofort teilen"],
        richtig: 1,
        erklaerung: "Wichtige Fakten solltest du immer unabhängig überprüfen."
      }
    ]
  },

  /* ------------------------------------------------------------------ */
  {
    id: 14,
    emoji: "🚀",
    titel: "Best Practices & nächste Schritte",
    dauer: 6,
    farbe: "#20bf6b",
    intro: "Alles zusammengeführt: deine Merksätze für starke Ergebnisse – und wie's weitergeht.",
    chunks: [
      {
        titel: "Klar & konkret bleiben",
        text: "Der wichtigste Hebel: klare, konkrete Prompts mit Ziel, Zielgruppe, Ton und Format. Investiere ein paar Sekunden in einen guten Prompt – es zahlt sich sofort aus.",
        merke: "Klarheit im Prompt = Qualität in der Antwort."
      },
      {
        titel: "Iterieren statt aufgeben",
        text: "Sieh die erste Antwort als Entwurf. Nachschärfen, umformulieren, Beispiele geben – so kommst du Schritt für Schritt zum perfekten Ergebnis.",
        merke: "Iterieren ist normal – und macht den Unterschied."
      },
      {
        titel: "Prüfen & verantwortungsvoll nutzen",
        text: "Behalte kritische Fakten im Blick, schütze sensible Daten und triff Entscheidungen selbst. Claude unterstützt dich – die Verantwortung bleibt bei dir.",
        merke: "Vertrauen ja, prüfen trotzdem."
      },
      {
        titel: "So geht's weiter",
        text: "Übe im Alltag: eine E-Mail entwerfen, einen Text kürzen, etwas erklären lassen. Probiere Projekte und Artifacts aus. Mit jeder Nutzung wirst du besser – du hast jetzt das Fundament!",
        merke: "Üben, üben, üben – du hast das Fundament gelegt! 🎉"
      }
    ],
    quiz: [
      {
        frage: "Was ist der wichtigste Hebel für gute Antworten?",
        optionen: ["Glück", "Klare, konkrete Prompts", "Lange warten", "Viele Emojis"],
        richtig: 1,
        erklaerung: "Klarheit und Konkretheit im Prompt bestimmen maßgeblich die Qualität."
      },
      {
        frage: "Wie solltest du die erste Antwort betrachten?",
        optionen: ["Als endgültig", "Als Entwurf, den du weiter verfeinerst", "Als Fehler", "Als Werbung"],
        richtig: 1,
        erklaerung: "Iterieren – die erste Antwort ist ein Entwurf, den du nachschärfst."
      }
    ]
  }
];
