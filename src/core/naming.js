const path = require("node:path");

const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

function sanitizePathSegment(value) {
  return String(value || "")
    .replace(ILLEGAL_FILENAME_CHARS, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "") || "untitled";
}

function renderTemplate(template, variables) {
  return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? sanitizePathSegment(variables[key]) : `{${key}}`;
  });
}

function buildOutputPath(config, subject, pageType, extra = {}) {
  const variables = {
    projectName: config.projectName,
    rightType: extra.rightType || "trademark",
    subjectName: subject.name,
    pageType,
    index: subject.id,
    timestamp: extra.timestamp || "YYYYMMDD-HHMMSS",
    rightNo: extra.rightNo || "RIGHT-NO",
    classNo: extra.classNo || "CLASS-NO",
    queryKeyword: extra.queryKeyword || subject.name,
  };
  const directory = renderTemplate(config.directoryTemplate, variables);
  const fileTemplate = config.fileNameTemplates[pageType] || config.fileNameTemplates.error;
  const fileName = renderTemplate(fileTemplate, variables);
  return path.join(config.outputRoot, directory, fileName);
}

function previewOutputPaths(config, subjects) {
  return subjects.flatMap((subject) => [
    buildOutputPath(config, subject, "catalog"),
    buildOutputPath(config, subject, "detail", { rightNo: "SAMPLE-000001", classNo: "09" }),
  ]);
}

module.exports = {
  buildOutputPath,
  previewOutputPaths,
  renderTemplate,
  sanitizePathSegment,
};
