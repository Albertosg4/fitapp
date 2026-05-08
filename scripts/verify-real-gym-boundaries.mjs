import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SCAN_TARGETS = [
  "app/admin",
  "app/socio",
  "features/admin",
  "features/socio",
  "components/HistorialPagos.tsx",
  "components/HistorialAsistencia.tsx",
  "components/CalendarioMes.tsx",
];

const IGNORED_DIRS = new Set(["node_modules", ".next", ".git"]);
const SCANNED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const FORBIDDEN_PATTERNS = [
  "VerticalPreviewSwitcher",
  "VerticalDemoHero",
  "VerticalCapabilityCards",
  "VerticalSettingsProvider",
  "useActiveVerticalSettings",
  "getVerticalCommercialProfile",
  "getOnlineDemoVerticalProfile",
  "getInteractiveDemoProfile",
  "INTERACTIVE_DEMO_PROFILES",
  "ONLINE_DEMO_VERTICAL_PROFILES",
  "VERTICAL_PREVIEW_STORAGE_KEY",
  "fitapp.verticalPreview",
  "Modo demo vertical",
  "Solo afecta a esta demo local",
  "No activo para esta vertical",
  "no activo para esta vertical",
  "no activos para esta vertical",
  "Capacidad no activa para esta vertical",
  "QR/check-in no activo para esta vertical",
  "Pagos no activos para esta vertical",
  "Historial de asistencia no activo para esta vertical",
];

function isScannableFile(filePath) {
  return SCANNED_EXTENSIONS.has(path.extname(filePath));
}

function toDisplayPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function collectFiles(targetPath, files = []) {
  if (!fs.existsSync(targetPath)) {
    return files;
  }

  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    if (isScannableFile(targetPath)) {
      files.push(targetPath);
    }

    return files;
  }

  if (!stat.isDirectory()) {
    return files;
  }

  const directoryName = path.basename(targetPath);
  if (IGNORED_DIRS.has(directoryName)) {
    return files;
  }

  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    collectFiles(path.join(targetPath, entry.name), files);
  }

  return files;
}

function findViolations(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const violations = [];

  lines.forEach((line, index) => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (line.includes(pattern)) {
        violations.push({
          file: toDisplayPath(filePath),
          line: index + 1,
          pattern,
        });
      }
    }
  });

  return violations;
}

const files = SCAN_TARGETS.flatMap((target) =>
  collectFiles(path.join(ROOT, target)),
);

const violations = files.flatMap(findViolations);

if (violations.length > 0) {
  console.error(
    "ERROR: demo/vertical preview code found in real gym app surfaces.",
  );

  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} -> ${violation.pattern}`,
    );
  }

  process.exit(1);
}

console.log("OK: real gym app boundaries are clean.");
