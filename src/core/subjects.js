const fs = require("node:fs");

const COMPLETE_SUFFIXES = [
  "有限公司",
  "有限责任公司",
  "股份有限公司",
  "集团有限公司",
  "集团股份有限公司",
  "合伙企业",
  "普通合伙企业",
  "有限合伙企业",
  "特殊普通合伙",
  "个人独资企业",
  "外资企业",
  "全民所有制",
  "集体所有制",
  "联营企业",
  "股份合作企业",
  "律师事务所",
  "农民专业合作社",
  "分公司",
];

function normalizeName(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function parseSubjectsFromText(text) {
  const seen = new Set();
  return String(text || "")
    .split(/\r?\n/)
    .map(normalizeName)
    .filter(Boolean)
    .filter((name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((name, index) => ({ id: String(index + 1).padStart(3, "0"), name }));
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function loadSubjectsFromCsv(csvPath) {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }
  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((cell) => normalizeName(cell).toLowerCase());
  const nameIndex = header.findIndex((cell) => ["subjectname", "subject_name", "name", "company", "right_holder", "rightholder"].includes(cell));
  const dataLines = nameIndex >= 0 ? lines.slice(1) : lines;
  const names = dataLines.map((line) => {
    const cells = splitCsvLine(line);
    return normalizeName(cells[nameIndex >= 0 ? nameIndex : 0]);
  });
  return parseSubjectsFromText(names.join("\n"));
}

function hasCompleteOrganizationSuffix(name) {
  return COMPLETE_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

function summarizeSubjectWarnings(subjects) {
  const warnings = [];
  for (const subject of subjects) {
    if (subject.name.length <= 4) {
      warnings.push(`${subject.name}: short name, may be an abbreviation.`);
      continue;
    }
    if (!hasCompleteOrganizationSuffix(subject.name)) {
      warnings.push(`${subject.name}: does not end with a common full organization suffix.`);
    }
  }
  return warnings;
}

module.exports = {
  loadSubjectsFromCsv,
  parseSubjectsFromText,
  summarizeSubjectWarnings,
};
