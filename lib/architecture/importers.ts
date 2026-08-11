/**
 * Convert foreign formats into mermaid code so imported data becomes an
 * editable diagram. Each importer returns mermaid (or null if the input
 * could not be parsed).
 */

export function importJsonToMermaid(input: string): string | null {
  try {
    const data = JSON.parse(input);
    if (Array.isArray(data)) {
      const rows = data.slice(0, 30);
      if (rows.length === 0) return null;
      const keys = Object.keys(rows[0]).slice(0, 12);
      if (keys.length === 0) return null;
      const lines = rows.map((row, i) => {
        const cells = keys
          .map((k) => {
            const v = row?.[k];
            return `${k}: ${typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? "")}`;
          })
          .join("<br/>");
        return `  R${i}[${cells}]`;
      });
      return `flowchart LR\n${lines.join("\n")}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function importCsvToMermaid(input: string): string | null {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  const parse = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const header = parse(lines[0]);
  const rows = lines.slice(1, 31).map(parse);
  if (rows.length === 0) return null;
  const out = rows
    .map((row, i) => {
      const cells = header
        .map((h, j) => `${h}: ${row[j] ?? ""}`)
        .join("<br/>");
      return `  R${i}[${cells}]`;
    })
    .join("\n");
  return `flowchart LR\n${out}`;
}

const SQL_TYPE_RE = /[a-z]+(?:\([^)]*\))?/i;

export function importSqlToMermaid(input: string): string | null {
  const tables: { name: string; cols: string[] }[] = [];
  const refs: { from: string; to: string; label?: string }[] = [];

  const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?([`"\[]?[\w]+[`"\]]?)/gi;
  const colRe = /^\s*[`"\[]?[\w]+[`"\]]?\s+[a-z][\w\s()]*?(?:[,)]|$)/gim;

  const blocks = input.split(/(?=create\s+table)/gi);
  for (const block of blocks) {
    const m = block.match(createRe);
    if (!m) continue;
    const rawName = m[0].replace(/create\s+table\s+(?:if\s+not\s+exists\s+)?/gi, "").replace(/[`"[\]]/g, "");
    const name = rawName.trim().toUpperCase();
    const cols: string[] = [];
    let body = block.replace(createRe, "").trim();
    body = body.replace(/^\(|\)\s*;?\s*$/g, "");
    for (const line of body.split(/\r?\n/)) {
      const colMatch = line.match(colRe);
      if (!colMatch) continue;
      const clean = line.trim();
      if (/^(primary|foreign|unique|constraint|check|index)/i.test(clean)) continue;
      const parts = clean.split(/\s+/);
      const colName = parts[0].replace(/[`"[\]]/g, "");
      const typeMatch = clean.match(SQL_TYPE_RE);
      if (colName && typeMatch) {
        const isPk = /primary\s+key/i.test(clean);
        cols.push(`${isPk ? "+" : ""}${typeMatch[0].toUpperCase()} ${colName}`);
      }
    }
    const fkRe = /foreign\s+key\s*\([^)]*\)\s*references\s+([`"\[]?[\w]+[`"\]]?)\s*\(([^)]+)\)/gi;
    let fk: RegExpExecArray | null;
    while ((fk = fkRe.exec(block)) !== null) {
      refs.push({
        from: name,
        to: fk[1].replace(/[`"[\]]/g, "").toUpperCase(),
        label: `fk_${fk[2].replace(/[`"[\]]/g, "").split(/[\s,]/)[0]}`,
      });
    }
    if (cols.length > 0) tables.push({ name, cols });
  }
  if (tables.length === 0) return null;
  const lines = tables.map((t) => {
    const body = t.cols.map((c) => `    ${c}`).join("\n");
    return `${t.name} {\n${body}\n  }`;
  });
  for (const r of refs) {
    lines.push(`${r.from} ||--o{ ${r.to} : "${r.label ?? "ref"}"`);
  }
  return `erDiagram\n${lines.join("\n")}`;
}

export function importPrismaToMermaid(input: string): string | null {
  const models: { name: string; fields: string[] }[] = [];
  const refs: { from: string; to: string; label: string }[] = [];

  const modelRe = /model\s+(\w+)\s*\{([\s\S]*?)\n\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = modelRe.exec(input)) !== null) {
    const name = m[1].toUpperCase();
    const fields: string[] = [];
    for (const line of m[2].split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("//") || t.startsWith("@@")) continue;
      const parts = t.split(/\s+/);
      if (parts.length < 2) continue;
      const field = parts[0];
      const type = parts[1].replace(/\[\]/g, "");
      const isPk = /\b@id\b/.test(t);
      const isRel = /@relation\b/.test(t);
      const isArray = /\[\]/.test(parts[1]);
      if (isRel) {
        const relMatch = t.match(/@relation\("([^"]+)"\)/);
        refs.push({ from: name, to: type.toUpperCase(), label: relMatch?.[1] ?? field });
      } else {
        fields.push(`${isPk ? "+" : ""}${type.toUpperCase()} ${field}${isArray ? " []" : ""}`);
      }
    }
    models.push({ name, fields });
  }
  if (models.length === 0) return null;
  const lines = models.map((mod) => {
    const body = mod.fields.map((f) => `    ${f}`).join("\n");
    return `${mod.name} {\n${body}\n  }`;
  });
  for (const r of refs) {
    lines.push(`${r.from} ||--o{ ${r.to} : "${r.label}"`);
  }
  return `erDiagram\n${lines.join("\n")}`;
}

export type ImportFormat = "json" | "csv" | "sql" | "prisma";

const IMPORTERS: Record<ImportFormat, (input: string) => string | null> = {
  json: importJsonToMermaid,
  csv: importCsvToMermaid,
  sql: importSqlToMermaid,
  prisma: importPrismaToMermaid,
};

export function detectImportFormat(filename: string): ImportFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json":
      return "json";
    case "csv":
      return "csv";
    case "sql":
      return "sql";
    case "prisma":
      return "prisma";
    default:
      return null;
  }
}

export function importToMermaid(filename: string, content: string): { code: string; format: ImportFormat } | null {
  const format = detectImportFormat(filename);
  if (!format) return null;
  const code = IMPORTERS[format](content);
  if (!code) return null;
  return { code, format };
}
