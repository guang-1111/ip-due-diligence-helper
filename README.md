# IP Due Diligence Helper

A local, semi-automated assistant for intellectual property due diligence screenshots and PDF evidence collection.

This project is designed for legal due diligence workflows where users need to query public IP-related websites by right-holder/company name, save catalog pages and detail pages, organize files according to project-specific naming rules, and generate audit logs.

## Current Status

This repository is currently at the MVP specification stage.

Implemented in documentation:

- Product workflow for a local IP due diligence helper
- Configurable subject import from Excel or pasted text
- Configurable folder and file naming rules
- Trademark module execution specification
- Lightweight page-ready gate before saving PDFs
- Optional PDF validation workflow
- Logging and audit report requirements

Planned first runnable module:

- Trademark search module
- Visible browser control
- User-managed login
- Programmatic PDF generation with date, URL, and page number footer
- Catalog/detail page capture
- CSV/JSONL logs

## MVP Scope

The MVP will support:

- Creating a local project
- Importing right-holder/company names
- Checking subject-name format warnings
- Choosing folder and file naming templates
- Running the trademark module first
- Reserving framework slots for patent, copyright, ICP/domain filing, and MIIT equipment/network-access checks
- Saving PDFs without using the system print dialog
- Running a lightweight page-ready gate before each capture
- Optionally validating generated PDFs
- Generating logs and audit reports

The MVP will not support:

- Captcha bypass
- Automatic login
- High-frequency scraping
- Cloud deployment
- Real-time multi-user collaboration
- Automatic modification of legal reports
- Full automation of patent/copyright/ICP/MIIT modules

## Documentation

- [Product Spec v0.1](docs/product-spec-v0.1.md)
- [Trademark Module Spec v0.1](docs/trademark-module-spec-v0.1.md)

## Example Inputs

- [subjects-template.csv](examples/subjects-template.csv)
- [project-config.example.json](examples/project-config.example.json)

## Safety Notes

This tool is intended to assist manual legal due diligence work, not to bypass website restrictions.

Users should:

- Log in manually where required
- Handle captchas manually
- Confirm subject names before running searches
- Review generated PDFs and audit logs
- Comply with website terms, project instructions, and applicable laws

## Repository Hygiene

Do not commit:

- Real client materials
- Generated PDF evidence
- Login cookies or browser profiles
- Personal absolute paths
- API keys or credentials
- Project-specific confidential data

See [.gitignore](.gitignore) for default ignored paths.

