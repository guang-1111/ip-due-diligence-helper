# IP Due Diligence Helper

IP Due Diligence Helper is a local desktop-oriented tool for intellectual property network checks. It is designed for workflows where a user has a list of right holders, usually group companies, subsidiaries, and related entities, and needs to collect public-query evidence from multiple official or semi-official websites.

The first runnable demo will focus on trademark checks. The broader framework reserves places for patent, copyright, ICP/domain filing, and MIIT equipment/network-access checks.

## What Problem It Solves

Manual IP network checks are repetitive:

- Copy a company/right-holder name into a public query website.
- Wait for the result page to load.
- Save the catalog or result-list page as evidence.
- Open each relevant detail page and save it too.
- Name and classify files according to project-specific rules.
- Keep enough logs so the reviewer can tell what was searched, saved, skipped, or manually handled.

This project tries to reduce that workload without pretending that public websites are stable APIs. The tool should behave like a careful assistant controlling a visible browser, while leaving login, captcha, abnormal pages, and final judgment to the user.

## Current Status

This repository is at the early demo stage. It currently contains:

- Product specification for the overall IP check workflow.
- Trademark module specification at coding-level detail.
- Example company-list input template.
- Example project configuration template.
- Repository hygiene rules for keeping confidential materials and generated evidence out of Git.

No production-ready automation module has been released yet.

## Planned MVP

The MVP target is a local runnable demo that can:

- Create or select a local project folder.
- Import right-holder names from Excel/CSV or pasted text.
- Show lightweight warnings for company-name formatting.
- Ask the user how folders and files should be classified and named.
- Run the trademark module first.
- Open a visible browser and let the user handle login/captcha manually.
- Capture catalog pages and detail pages as PDF evidence.
- Generate PDFs programmatically with browser-style date, URL, and page-number header/footer.
- Run a small page-ready check before capture to avoid saving blank or half-loaded pages.
- Optionally validate captured PDFs when the user prefers quality over speed.
- Write CSV/JSONL logs for review and troubleshooting.

## Non-Goals

The project will not attempt to:

- Bypass captcha or anti-bot systems.
- Steal or persist login sessions in the repository.
- Run high-frequency scraping.
- Replace legal review or factual verification by the user.
- Upload confidential evidence to cloud services by default.
- Modify legal reports automatically.

## Repository Layout

```text
.
|-- docs/
|   |-- product-spec-v0.1.md
|   `-- trademark-module-spec-v0.1.md
|-- examples/
|   |-- project-config.example.json
|   `-- subjects-template.csv
|-- src/
|   `-- README.md
|-- ROADMAP.md
|-- README.md
|-- LICENSE
`-- .gitignore
```

## Documentation

- [Product Spec v0.1](docs/product-spec-v0.1.md)
- [Trademark Module Spec v0.1](docs/trademark-module-spec-v0.1.md)
- [Roadmap](ROADMAP.md)

## Example Inputs

- [subjects-template.csv](examples/subjects-template.csv)
- [project-config.example.json](examples/project-config.example.json)

## Safety Notes

This tool is intended to assist manual legal due diligence work, not to bypass website restrictions.

Users should:

- Log in manually where required.
- Handle captchas manually.
- Confirm right-holder names before running searches.
- Review generated PDFs and audit logs.
- Follow website terms, project instructions, and applicable laws.

## Development Notes

The first development target is the trademark module plus a shared execution framework. The implementation should prefer:

- Visible browser automation over hidden scraping.
- Explicit pause-and-resume points when pages are abnormal.
- Conservative speed defaults that avoid mass invalid captures.
- User-configurable folder and file naming.
- Local-only outputs by default.

## Repository Hygiene

Do not commit:

- Real confidential materials.
- Generated PDF evidence.
- Login cookies or browser profiles.
- Personal absolute paths.
- API keys or credentials.
- Project-specific confidential data.

See [.gitignore](.gitignore) for default ignored paths.
