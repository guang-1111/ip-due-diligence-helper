# Roadmap

This roadmap keeps the project focused on a usable local demo first, then expands module coverage after the core workflow is stable.

## Phase 0: Repository Baseline

Status: done

- Create a clean GitHub-ready repository.
- Keep only sanitized docs, examples, and source placeholders.
- Add `.gitignore` rules for generated evidence, browser profiles, logs, and local config.
- Add product and trademark module specifications.
- Add example subject-list and project-config files.

## Phase 1: Runnable Local Shell

Goal: let a user start the tool locally and create a check project.

Planned:

- Choose the implementation stack.
- Add a minimal command or desktop entry point.
- Let the user choose an output root folder.
- Create a project workspace with predictable subfolders.
- Load subjects from pasted text, CSV, or Excel-compatible input.
- Show a pre-run subject confirmation screen.
- Save a normalized local project config.

Acceptance criteria:

- A user can create a project without editing source code.
- The imported right-holder list is visible before any browser action starts.
- The generated project folder contains config, logs, and output directories.

## Phase 2: Naming and Classification Builder

Goal: keep maximum user control over evidence folder structure and file names.

Planned:

- Ask the user how to classify evidence folders.
- Ask the user how to name catalog-page PDFs.
- Ask the user how to name detail-page PDFs.
- Support template variables such as subject name, module, page type, index, date, and query keyword.
- Preview sample output paths before the run starts.
- Validate illegal Windows filename characters.

Acceptance criteria:

- A user can preview where files will be saved before running.
- Naming rules can be changed per project.
- The tool refuses obviously invalid paths and asks for correction.

## Phase 3: Trademark Module Demo

Goal: complete the first useful module for trademark network checks.

Planned:

- Open the trademark query website in a visible browser.
- Let the user handle login, captcha, or website prompts manually.
- Search by right-holder name.
- Detect catalog page readiness using a small set of checks:
  - abnormal-page check,
  - key-field/result-area check,
  - short visual or content stability check.
- Save the catalog page as PDF.
- Identify result rows that need detail capture.
- Open detail pages one by one.
- Save detail pages as PDFs.
- Pause when the page is abnormal, captcha appears, search results are ambiguous, or repeated readiness checks fail.
- Write structured logs for every searched subject and captured page.

Acceptance criteria:

- For a small sample list, the module captures catalog and detail PDFs into the expected folders.
- It does not continue blindly after repeated blank, loading, or abnormal pages.
- The run log makes it clear which subjects succeeded, skipped, paused, or failed.

## Phase 4: PDF Quality Controls

Goal: balance speed and evidence quality.

Planned:

- Generate PDFs programmatically rather than using the system print dialog.
- Add browser-style header/footer with date, title or URL, and page number.
- Add a default fast readiness gate before PDF generation.
- Add optional PDF validation mode.
- In validation mode, check for blank pages, obvious loading text, missing subject name, and very small files.
- Let users disable validation when they prefer manual review or faster capture.

Acceptance criteria:

- Default capture avoids most half-loaded pages without becoming slow.
- Optional validation catches common bad PDFs.
- The user can choose speed-first or quality-first behavior.

## Phase 5: Five-Module Framework

Goal: keep trademark as the first implementation while shaping a common framework for all IP checks.

Planned modules:

- Trademark checks.
- Patent publication/query checks.
- Copyright registration checks.
- ICP/IP/domain filing checks.
- MIIT equipment/network-access checks.

Shared framework:

- Subject import.
- Naming and classification templates.
- Visible browser session handling.
- Page readiness gates.
- PDF capture.
- Pause/resume behavior.
- Logs and run summary.

Acceptance criteria:

- Adding a new module does not require rewriting import, naming, PDF, or logging logic.
- Modules can be enabled or disabled per project.
- Unsupported modules show clear "reserved/not implemented" states.

## Phase 6: Review and Sharing Polish

Goal: make the project easier for others to download, run, and understand.

Planned:

- Add setup instructions after the implementation stack is chosen.
- Add screenshots or a short demo GIF once UI exists.
- Add troubleshooting notes for slow pages, captcha, login, and PDF failures.
- Add sample output structure using fake companies only.
- Add contribution guidelines if more people will help develop it.

Acceptance criteria:

- A new user can clone the repository and run the demo from the README.
- The repository does not contain confidential evidence or personal project paths.
- Known limitations are clearly stated.

## Open Decisions

- Implementation stack: command-line first, lightweight desktop app, or browser-based local UI.
- Browser control layer: Playwright persistent profile, Chrome DevTools Protocol, or another visible-browser approach.
- Excel support: native `.xlsx` parsing in the app or CSV-first with Excel export guidance.
- Company-name verification: simple warning only, optional search-assist, or delayed until the workflow is stable.
- PDF validation depth: fast heuristic checks first, OCR only as an optional later feature.
