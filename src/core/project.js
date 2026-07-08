const fs = require("node:fs");
const path = require("node:path");
const { sanitizePathSegment } = require("./naming");
const { createInitialRunLog } = require("./logger");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeSubjectsCsv(filePath, subjects) {
  const rows = ["id,subjectName"];
  for (const subject of subjects) {
    const escapedName = `"${subject.name.replace(/"/g, '""')}"`;
    rows.push(`${subject.id},${escapedName}`);
  }
  fs.writeFileSync(filePath, `${rows.join("\n")}\n`, "utf8");
}

function createProjectWorkspace({ config, subjects }) {
  const projectRoot = path.join(config.outputRoot, sanitizePathSegment(config.projectName));
  const configDir = path.join(projectRoot, "config");
  const logsDir = path.join(projectRoot, "logs");
  const evidenceDir = path.join(projectRoot, "evidence");
  const tempDir = path.join(projectRoot, "temp");

  [projectRoot, configDir, logsDir, evidenceDir, tempDir].forEach(ensureDir);

  const configPath = path.join(configDir, "project-config.json");
  const subjectsPath = path.join(configDir, "subjects.csv");
  const runLogPath = path.join(logsDir, "run.jsonl");

  writeJson(configPath, config);
  writeSubjectsCsv(subjectsPath, subjects);
  createInitialRunLog(runLogPath, config, subjects);

  return {
    projectRoot,
    configPath,
    subjectsPath,
    runLogPath,
  };
}

module.exports = {
  createProjectWorkspace,
};
