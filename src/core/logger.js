const fs = require("node:fs");

function appendJsonLine(filePath, record) {
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

function createInitialRunLog(filePath, config, subjects) {
  appendJsonLine(filePath, {
    event: "project_created",
    at: new Date().toISOString(),
    projectName: config.projectName,
    enabledModules: config.enabledModules,
    subjectCount: subjects.length,
  });
}

module.exports = {
  appendJsonLine,
  createInitialRunLog,
};
