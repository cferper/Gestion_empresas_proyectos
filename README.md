# Business and Project Management Study Web — GEP

A browser-based study tool for **Gestión de Empresas y Proyectos (GEP)**. It covers the **first six chapters** of the course textbook with **165 flashcards, 23 reasoning cases, 6 concept maps, and 36 multiple-choice practice questions**.

The website helps students recall concepts, explain decisions, and practise calculations across business management, finance, people, marketing, and quality. The interface and study activities are in **Spanish**; this README explains the project in English.

The website uses HTML, CSS, and plain JavaScript. The ready-to-use version is included in `web/dist/` and works offline when opened locally. Studying requires a modern browser with JavaScript enabled; no account or dependency installation is needed.

## Access the website

### Open it directly

1. Download and extract the project, or open your existing local copy.
2. Open [`web/dist/index.html`](web/dist/index.html) in your browser using your file explorer.
3. Select a topic and choose **Tarjetas**, **Casos**, **Mapa**, or **Test**.

All required website files are already included. Keep the files in `web/dist/` together when copying the website to another folder or computer. If you receive a ZIP archive, extract it before opening `index.html`.

### Run a local server

For regular use, a local HTTP address gives browser storage a more predictable location than opening a file directly. With Python installed, run this command from the project root, including in the VS Code terminal:

```powershell
py -m http.server 8011 --bind 127.0.0.1 --directory web/dist
```

On systems without the Windows `py` launcher, use `python` or `python3` instead.

Open **[http://127.0.0.1:8011/](http://127.0.0.1:8011/)**. Keep the terminal running while you study; press `Ctrl+C` to stop the server. This command serves only the website folder, excluding the original course PDFs.

The address works on the computer running the server. It is not a public link for classmates or another device. No public website URL is documented in this repository.

Export your progress before switching between direct file access and HTTP access, or changing browser, hostname, or port: each can use a different storage location.

## What you can do

### Flashcards — Tarjetas

Think about the question before selecting **Mostrar respuesta**, then compare your answer with the solution and explanation. Choose one of four recall ratings to schedule the next review. Unreviewed and due cards appear in the review session.

**Practicar todas** lets you study the available cards even when none are due. Ratings given during extra practice also update the review schedule.

### Reasoning cases — Casos

Each case describes an initial situation, a change, and the conditions that remain constant. Make two predictions and write a justification before revealing the worked solution. Use the accompanying criteria to assess your reasoning.

Consulting a solution is recorded in your progress. Written answers are self-assessed; the website does not assign an automatic grade or use AI to correct them.

### Concept maps — Mapa

Explore relationships between concepts and complete two missing elements using the available options and hints. A map is recorded as completed only when both answers are correct. Revealing the full explanation alone does not complete it.

Clickable concepts open related activities. The course index also provides direct access to a topic or a concept's flashcards.

### Practice quizzes — Test

Each topic includes **six questions**, each with four answer options. Select an answer or leave the question blank, then choose **Corregir test** to see the score, correct answers, explanations, and source references. **Empezar de nuevo** clears that topic's quiz attempt.

| Response | Practice score |
| --- | ---: |
| Correct | +1 |
| Incorrect | −0.25 |
| Unanswered | 0 |

These are the website's practice rules; they do not establish the grading rules for your next exam.

Quiz answers remain available while the page is open, including when switching topics. They are held in memory and are **not saved to localStorage or included in exported progress**. Reloading or closing the page clears them.

### Progress overview

The sidebar shows due cards, rated cards, consulted cases, and completed maps for the selected topic. Changing topics updates all four study modes and the progress counters. Quiz scores are shown within the quiz itself.

## Topics covered

| Topic | Flashcards | Cases | Maps | Quiz questions |
| --- | ---: | ---: | ---: | ---: |
| 1. Business management | 32 | 4 | 1 | 6 |
| 2. Business financing and the financial system | 28 | 4 | 1 | 6 |
| 3. Corporate economic and financial management | 43 | 6 | 1 | 6 |
| 4. Human resources and knowledge management | 20 | 3 | 1 | 6 |
| 5. Marketing management | 18 | 3 | 1 | 6 |
| 6. Quality management | 24 | 3 | 1 | 6 |
| **Total** | **165** | **23** | **6** | **36** |

The current scope is chapters 1–6, rather than the complete textbook.

## Review scheduling

The flashcards use a simple rule based on your own recall rating:

| Rating in the interface | Initial interval, or after “No lo sabía” | Subsequent interval |
| --- | --- | --- |
| **No lo sabía** — Again | 10 minutes | 10 minutes |
| **Me costó** — Hard | 2 days | Previous interval × 1.2, rounded up |
| **Bien** — Good | 3 days | Previous interval × 2, rounded up |
| **Muy fácil** — Easy | 7 days | Previous interval × 3, rounded up |

Day intervals are capped at 365 days. “Again” resets the day interval, and the next rating uses the initial values. Review times are calculated from the moment you submit a rating; a day means 24 elapsed hours.

This is a fixed scheduling rule, rather than a model that learns your study habits. The implementation is in [`web/dist/progreso.js`](web/dist/progreso.js).

## Save and transfer your progress

Progress is stored in your browser's **localStorage**, under `gestion-proyectos-progreso-v1`. It includes flashcard ratings and review dates, case answers, and completed map answers. There is no backend database or automatic device synchronization.

GEP uses a separate storage key and backup application identifier from the Aerospace Alloys study website. Their progress records remain independent, and an Aerospace Alloys backup cannot be imported as a GEP backup.

Open **Guardar una copia** in the sidebar to:

- **Exportar progreso:** download a JSON backup. A text-copy fallback is available if downloading is unavailable.
- **Importar una copia:** restore or transfer a backup. The entire file is validated before merging; the most recent record wins for each activity, and ties retain the current record.
- **Reiniciar progreso:** clear this browser's saved GEP progress after confirmation.

Clearing browser data can remove your progress. If saving is blocked or browser storage is full, the website displays a warning and lets you export the current session. Keep a backup before moving to another device or address. Quiz attempts are excluded from these backups.

## How the website was created

GEP adapts the study tool originally used for Aerospace Alloys into an independent website with its own content and progress storage. The main source is the supplied **Gestión de Empresas y Proyectos** textbook, ETSIAE UPM, October 2025 edition.

The in-app guide records visual review of the scanned pages for chapters 1–6. Supplementary notes for topics 1–4 were used to compare terminology. The PEI 2024–25 questions and the Ordinary 2023–24 solutions helped inform exercise types; the project does not claim exhaustive review of every exam in the source folder.

The activities and worked solutions are original study adaptations. They focus on recalling concepts, explaining causes and tradeoffs, and applying calculations. They are not a textbook transcription or an official question bank.

The implementation separates content, presentation, and progress:

1. **Content:** each topic is maintained as a JSON file with stable activity IDs, concepts, questions, answers, maps, quizzes, and references.
2. **Compilation:** a small Node.js script combines the topic files into `contenido.js`.
3. **Presentation:** HTML defines the controls, CSS handles styling and responsive layouts, and JavaScript renders the selected activities.
4. **Persistence:** a separate JavaScript module schedules reviews, validates records, and handles browser storage and backups. Quiz attempts stay in memory.

The compiled data loads as a regular local script, so the website can run directly from disk without fetching JSON files from a server. There is no framework, package manager setup, or build service required to use it.

### Sources and conventions

Activities reference the original document, PDF page, and printed page where available. PDF page numbers count from the beginning of the file and can differ from the textbook's printed numbering. [`web/fuentes.json`](web/fuentes.json) inventories the source documents and their page counts.

The guide explains discrepancies between the textbook, supplementary notes, and exams. For example, ROE exercises specify whether they use profit before or after tax; liquidity ratios follow the textbook's terminology; inconsistent numerical examples are replaced with recalculated exercises.

Quality standards and models are discussed as they appear in the study materials, without claiming that those editions are current. See [`web/dist/guia.html`](web/dist/guia.html) for the detailed conventions in Spanish.

## Project structure

| Path | Purpose |
| --- | --- |
| [`web/dist/index.html`](web/dist/index.html) | Main study page |
| [`web/dist/guia.html`](web/dist/guia.html) | Usage guide, source scope, and conventions in Spanish |
| [`web/dist/estilos.css`](web/dist/estilos.css) | Styling and responsive layout |
| [`web/dist/app.js`](web/dist/app.js) | Navigation, study activities, quizzes, and backup controls |
| [`web/dist/progreso.js`](web/dist/progreso.js) | Review scheduling, validation, and storage |
| [`web/dist/contenido.js`](web/dist/contenido.js) | Generated study data used by the browser |
| [`web/temas/`](web/temas/) | Editable topic files, `t1.json` through `t6.json` |
| [`web/compilar-contenido.cjs`](web/compilar-contenido.cjs) | Content compiler |
| [`web/validar-contenido.cjs`](web/validar-contenido.cjs) | Content, references, maps, quizzes, and calculation checks |
| [`web/pruebas-progreso.cjs`](web/pruebas-progreso.cjs) | Scheduling, persistence, and backup tests |
| [`web/pruebas-interfaz.cjs`](web/pruebas-interfaz.cjs) | Interface logic checks across the 24 topic views |
| [`web/fuentes.json`](web/fuentes.json) | Source inventory |
| [`VERIFICACION.md`](VERIFICACION.md) | Recorded validation and browser checks in Spanish |
| [`crear-contenido.cjs`](crear-contenido.cjs) | Original content preparation script; overwrites topic JSON files |

`web/dist/` is the complete website folder. Local reference PDFs in `materiales/`, temporary preparation files in `tmp/`, and ZIP archives are excluded from Git by `.gitignore` and are not required to run the website. Source references identify the PDFs; the website does not distribute them.

## Edit and validate the project

**Requirements:** a text editor and Node.js for content compilation and checks. The scripts use Node.js built-in modules, so there is no `package.json` or `npm install` step.

To change a question or explanation:

1. Edit the relevant file in `web/temas/`.
2. Preserve existing activity IDs so saved progress remains associated with the same activities.
3. From the project root, regenerate the browser data:

   ```sh
   node web/compilar-contenido.cjs
   ```

4. Run the relevant checks:

   ```sh
   node web/validar-contenido.cjs
   node web/pruebas-progreso.cjs
   node web/pruebas-interfaz.cjs
   ```

5. Reload the website and inspect the changed activity. Include both the edited JSON and regenerated `contenido.js` when committing content changes.

The content validator checks the six-topic structure, unique IDs, concepts, source page ranges, map answers, quiz options, and selected financial calculations. It also checks that referenced PDFs exist locally, so this suite requires the original `materiales/` files, which are excluded from Git.

The progress and interface tests can run without the source PDFs. They cover scheduling, storage failures, backup validation and merging, rendering the 24 topic views, quiz correction and restart, export, and independence from Aerospace Alloys progress. Interface tests simulate the document in Node.js; inspect browser behaviour separately when changing interactions or layout.

For visual or interaction changes, edit `estilos.css`, `index.html`, or `app.js` and reload the browser. Editing `contenido.js` directly is temporary: the compiler overwrites it. `crear-contenido.cjs` retains the original editorial preparation and overwrites the topic JSON files when run; use the current JSON files for routine edits.

## Share or host the website

For offline sharing, copy or zip the entire `web/dist/` folder. Recipients can extract it and open `index.html`; personal progress stays in each user's browser unless transferred with a JSON backup.

For online access, the same folder can be deployed to a static website host. Serve `web/dist/` as the site root so `index.html` is the entry point. The hosting server only needs to deliver static files; Python is used here solely as an optional local development server.

Hosting does not add progress synchronization. Users still save their progress locally and should export a backup before moving from a local copy to a hosted address.

## Further documentation

- [`web/dist/guia.html`](web/dist/guia.html): study instructions, source review, and handling of discrepancies.
- [`VERIFICACION.md`](VERIFICACION.md): recorded content, calculation, progress, interface, and browser checks.
- [`README_ORIGINAL.md`](README_ORIGINAL.md): original project notes and historical setup instructions.

These supporting documents are in Spanish. Historical notes may refer to the earlier folder layout; use this README for the current access and editing commands. The activities supplement course readings, and structural validation does not replace academic review.
