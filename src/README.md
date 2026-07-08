# Source Directory

Current runnable entry point:

```text
src/
  cli.js
  core/
    logger.js
    naming.js
    project.js
    subjects.js
```

Implemented so far:

- Interactive local project setup.
- Non-interactive sample project setup via `npm run demo:init`.
- CSV and pasted-text subject import.
- Lightweight subject-name warnings.
- User-configurable directory and filename templates.
- Project config, subject CSV, output folders, and JSONL run-log creation.

Planned next structure:

```text
src/
  modules/
    trademark/
  core/
    browser/
    pdf/
    validation/
```

The next implementation target is visible-browser trademark capture.