#!/usr/bin/env node
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const fs = require("node:fs");
const path = require("node:path");
const { createProjectWorkspace } = require("./core/project");
const { loadSubjectsFromCsv, parseSubjectsFromText, summarizeSubjectWarnings } = require("./core/subjects");
const { previewOutputPaths } = require("./core/naming");

const DEFAULT_DIRECTORY_TEMPLATE = "{projectName}/{rightType}/{subjectName}";
const DEFAULT_FILE_TEMPLATES = {
  catalog: "{subjectName}_{rightType}_catalog.pdf",
  noResult: "{subjectName}_{rightType}_no_result.pdf",
  detail: "{rightNo}_detail.pdf",
  error: "{subjectName}_{rightType}_error_{timestamp}.pdf",
};

function printHelp() {
  console.log(`IP Due Diligence Helper

Usage:
  npm start
  npm run demo:init
  node src/cli.js --init-sample

This early demo creates a local project workspace, imports right-holder names, previews naming rules, and writes config/log skeletons. Browser capture is reserved for the trademark module implementation.
`);
}

async function askWithDefault(rl, question, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer || defaultValue;
}

async function askYesNo(rl, question, defaultValue = true) {
  const hint = defaultValue ? "Y/n" : "y/N";
  const answer = (await rl.question(`${question} [${hint}]: `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return ["y", "yes"].includes(answer);
}

async function readPastedSubjects(rl) {
  console.log("Paste one right-holder/company name per line. Submit an empty line when finished.");
  const lines = [];
  while (true) {
    const line = await rl.question("> ");
    if (!line.trim()) break;
    lines.push(line);
  }
  return parseSubjectsFromText(lines.join("\n"));
}

async function loadSubjects(rl) {
  while (true) {
    const mode = (await askWithDefault(rl, "Import subjects from CSV file or pasted text?", "paste")).toLowerCase();
    if (["paste", "p"].includes(mode)) {
      return readPastedSubjects(rl);
    }
    if (["csv", "file", "f"].includes(mode)) {
      const csvPath = await askWithDefault(rl, "CSV path", "examples/subjects-template.csv");
      return loadSubjectsFromCsv(path.resolve(csvPath));
    }
    console.log("Please enter paste or csv.");
  }
}

function createSampleProject() {
  const configPath = path.resolve("examples/project-config.example.json");
  const subjectsPath = path.resolve("examples/subjects-template.csv");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const subjects = loadSubjectsFromCsv(subjectsPath);
  const sampleConfig = {
    ...config,
    projectName: "Sample IP Due Diligence Project",
    checkDate: new Date().toISOString().slice(0, 10),
    outputRoot: path.resolve("demo-output"),
  };
  const result = createProjectWorkspace({ config: sampleConfig, subjects });
  console.log("Sample project workspace created:");
  console.log(`  Root: ${result.projectRoot}`);
  console.log(`  Config: ${result.configPath}`);
  console.log(`  Subjects: ${result.subjectsPath}`);
  console.log(`  Run log: ${result.runLogPath}`);
}
async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  if (process.argv.includes("--init-sample")) {
    createSampleProject();
    return;
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log("IP Due Diligence Helper - local project setup demo\n");

    const projectName = await askWithDefault(rl, "Project name", "Example IP Due Diligence Project");
    const outputRoot = await askWithDefault(rl, "Output root folder", path.resolve("demo-output"));

    const subjects = await loadSubjects(rl);
    if (subjects.length === 0) {
      console.log("No subjects were imported. Nothing to create.");
      return;
    }

    console.log(`\nImported ${subjects.length} subject(s):`);
    subjects.forEach((subject, index) => {
      console.log(`  ${index + 1}. ${subject.name}`);
    });

    const warnings = summarizeSubjectWarnings(subjects);
    if (warnings.length > 0) {
      console.log("\nName-format warnings:");
      warnings.forEach((warning) => console.log(`  - ${warning}`));
      console.log("These are lightweight prompts only. Please verify legal names against your project materials.");
    }

    const directoryTemplate = await askWithDefault(rl, "Directory template", DEFAULT_DIRECTORY_TEMPLATE);
    const catalogTemplate = await askWithDefault(rl, "Catalog PDF filename template", DEFAULT_FILE_TEMPLATES.catalog);
    const detailTemplate = await askWithDefault(rl, "Detail PDF filename template", DEFAULT_FILE_TEMPLATES.detail);

    const config = {
      projectName,
      checkDate: new Date().toISOString().slice(0, 10),
      outputRoot: path.resolve(outputRoot),
      enabledModules: ["trademark"],
      directoryTemplate,
      fileNameTemplates: {
        ...DEFAULT_FILE_TEMPLATES,
        catalog: catalogTemplate,
        detail: detailTemplate,
      },
      trademark: {
        enabled: true,
        status: "reserved_for_next_demo_step",
      },
    };

    console.log("\nSample output preview:");
    previewOutputPaths(config, subjects.slice(0, 3)).forEach((preview) => {
      console.log(`  - ${preview}`);
    });

    const shouldCreate = await askYesNo(rl, "Create this project workspace now?", true);
    if (!shouldCreate) {
      console.log("Cancelled before writing files.");
      return;
    }

    const result = createProjectWorkspace({ config, subjects });
    console.log("\nProject workspace created:");
    console.log(`  Root: ${result.projectRoot}`);
    console.log(`  Config: ${result.configPath}`);
    console.log(`  Subjects: ${result.subjectsPath}`);
    console.log(`  Run log: ${result.runLogPath}`);
    console.log("\nNext implementation step: connect the trademark module to visible browser capture.");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("\nSetup failed:");
  console.error(error.message);
  process.exitCode = 1;
});

