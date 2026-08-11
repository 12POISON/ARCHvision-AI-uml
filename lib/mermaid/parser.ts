import type {
  DiagramType,
  UMLAttribute,
  UMLClass,
  UMLLink,
  UMLMethod,
  UMLModel,
  Visibility,
} from "@/types/diagram";

const VISIBILITY_MAP: Record<string, Visibility> = {
  "+": "public",
  "-": "private",
  "#": "protected",
};

export class MermaidParseError extends Error {
  readonly line: number | null;

  constructor(message: string, line: number | null = null) {
    super(message);
    this.name = "MermaidParseError";
    this.line = line;
  }
}

interface ParsedBlock {
  className: string;
  body: string[];
}

function stripComment(line: string): string {
  const idx = line.indexOf("%%");
  return idx >= 0 ? line.slice(0, idx) : line;
}

function extractBlock(lines: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;
  for (const raw of lines) {
    const line = stripComment(raw).trim();
    if (!line) continue;
    if (current) {
      if (line === "}") {
        blocks.push(current);
        current = null;
      } else {
        current.body.push(line);
      }
      continue;
    }
    const open = line.indexOf("{");
    if (open > 0 && line.endsWith("}")) {
      const className = stripClassKeyword(line.slice(0, open).trim());
      blocks.push({ className, body: [] });
    } else if (open > 0) {
      current = { className: stripClassKeyword(line.slice(0, open).trim()), body: [] };
    }
  }
  return blocks;
}

function stripClassKeyword(name: string): string {
  return name.replace(/^class\s+/i, "");
}

function parseVisibility(token: string): { visibility: Visibility; rest: string } {
  const first = token[0];
  if (first === "+" || first === "-" || first === "#") {
    return { visibility: VISIBILITY_MAP[first], rest: token.slice(1) };
  }
  return { visibility: "public", rest: token };
}

function isMethodToken(token: string): boolean {
  return /\(.*\)/.test(token);
}

function parseMember(raw: string): { attribute: UMLAttribute } | { method: UMLMethod } {
  const { visibility, rest } = parseVisibility(raw.trim());
  const isStatic = rest.endsWith("$");
  const body = isStatic ? rest.slice(0, -1) : rest;

  if (isMethodToken(body)) {
    const nameMatch = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)/.exec(body);
    const returnMatch = /\s*:\s*(.+)$/.exec(body.replace(/^[^(]+\([^)]*\)/, ""));
    const name = nameMatch ? nameMatch[1] : body.replace(/\s*\(.*\)\s*$/, "").trim();
    const paramsRaw = nameMatch ? nameMatch[2] : "";
    const parameters = paramsRaw
      ? paramsRaw.split(",").map((p) => {
          const [pname, ptype] = p.trim().split(/\s+/);
          return { name: pname ?? "", type: ptype ?? "unknown" };
        })
      : [];
    const returnType = returnMatch ? returnMatch[1].trim() : "void";
    return {
      method: {
        name,
        parameters,
        returnType,
        visibility,
        isStatic,
        isAbstract: name.startsWith("_") || /\{\s*\}/.test(body),
      },
    };
  }

  const colon = body.indexOf(":");
  const name = colon >= 0 ? body.slice(0, colon).trim() : body.trim();
  const type = colon >= 0 ? body.slice(colon + 1).trim() : "unknown";
  return {
    attribute: { name, type, visibility, isStatic, isDerived: false },
  };
}

const RELATION_PATTERNS: Array<{
  regex: RegExp;
  type: UMLLink["type"];
}> = [
  { regex: /\s--\|\>\s/, type: "inheritance" },
  { regex: /\s\.\.\|\>\s/, type: "implementation" },
  { regex: /\s\*\--\s/, type: "composition" },
  { regex: /\so\--\s/, type: "aggregation" },
  { regex: /\s\.\.\>\s/, type: "dependency" },
  { regex: /\s--\>\s/, type: "association" },
  { regex: /\s--\s/, type: "association" },
  { regex: /\s\.\.\s/, type: "dependency" },
];

interface RelationMatch {
  from: string;
  to: string;
  type: UMLLink["type"];
  label: string | null;
  fromMultiplicity: string | null;
  toMultiplicity: string | null;
}

interface RelationSide {
  name: string;
  multiplicity: string | null;
}

/**
 * Parse one side of a relationship edge. Accepts a bare class name or a name
 * with a quoted multiplicity on either order:
 *   `User`, `User "1"`, `"1" User`
 */
function parseSide(raw: string): RelationSide | null {
  let m = /^([A-Za-z_$][\w$]*)\s+"([^"]+)"$/.exec(raw.trim());
  if (m) return { name: m[1], multiplicity: m[2] };
  m = /^"([^"]+)"\s+([A-Za-z_$][\w$]*)$/.exec(raw.trim());
  if (m) return { name: m[2], multiplicity: m[1] };
  if (/^[A-Za-z_$][\w$]*$/.test(raw.trim())) return { name: raw.trim(), multiplicity: null };
  return null;
}

function parseRelation(raw: string): RelationMatch | null {
  const cleaned = raw.replace(/^class\s+/i, "").trim();
  for (const pattern of RELATION_PATTERNS) {
    const parts = cleaned.split(pattern.regex);
    if (parts.length >= 2) {
      const leftRaw = parts[0].trim();
      const rightRaw = parts.slice(1).join(" ").trim();

      const left = parseSide(leftRaw);
      const labelMatch = /:\s*(.+)$/.exec(rightRaw);
      const rightSource = labelMatch ? rightRaw.slice(0, labelMatch.index).trim() : rightRaw.trim();
      const right = parseSide(rightSource);
      const label = labelMatch ? labelMatch[1].trim().replace(/^"|"$/g, "") : null;

      if (!left || !right) return null;
      return {
        from: left.name,
        to: right.name,
        type: pattern.type,
        label,
        fromMultiplicity: left.multiplicity,
        toMultiplicity: right.multiplicity,
      };
    }
  }
  return null;
}

function extractStereotype(className: string): { name: string; stereotype: string | null } {
  const match = /^(.*?)\s*<<([^>]+)>>$/.exec(className);
  if (match) return { name: match[1].trim(), stereotype: match[2].trim() };
  return { name: className, stereotype: null };
}

export function parseMermaidClassDiagram(code: string): UMLModel {
  const lines = code.split(/\r?\n/);
  const blocks = extractBlock(lines);
  const classes = new Map<string, UMLClass>();
  const links: UMLLink[] = [];

  const ensureClass = (rawName: string): UMLClass => {
    const { name, stereotype } = extractStereotype(rawName);
    if (!classes.has(name)) {
      classes.set(name, {
        id: name,
        name,
        stereotype,
        attributes: [],
        methods: [],
        isAbstract: false,
        isInterface: stereotype?.toLowerCase() === "interface",
      });
    }
    return classes.get(name)!;
  };

  for (const block of blocks) {
    const { name, stereotype } = extractStereotype(block.className);
    const cls = ensureClass(name);
    cls.stereotype = stereotype;
    cls.isInterface = stereotype?.toLowerCase() === "interface";
    cls.isAbstract = stereotype?.toLowerCase() === "abstract";
    for (const member of block.body) {
      const parsed = parseMember(member);
      if ("attribute" in parsed) {
        if (!cls.attributes.some((a) => a.name === parsed.attribute.name)) {
          cls.attributes.push(parsed.attribute);
        }
      } else {
        if (!cls.methods.some((m) => m.name === parsed.method.name)) {
          cls.methods.push(parsed.method);
        }
      }
    }
  }

  for (const raw of lines) {
    const line = stripComment(raw).trim();
    if (!line) continue;
    if (line.includes("{") || line === "}") continue;
    if (/^direction/i.test(line)) continue;
    if (line.startsWith("classDiagram")) continue;
    if (line.startsWith("namespace ")) continue;

    if (!line.includes("--") && !line.includes("..")) {
      if (/^class\s+[A-Za-z_$][\w$]*$/i.test(line)) {
        ensureClass(line.replace(/^class\s+/i, ""));
      }
      continue;
    }

    const relation = parseRelation(line);
    if (relation) {
      ensureClass(relation.from);
      ensureClass(relation.to);
      links.push({
        id: `${relation.from}_${relation.to}_${links.length}`,
        from: relation.from,
        to: relation.to,
        type: relation.type,
        label: relation.label,
        fromMultiplicity: relation.fromMultiplicity,
        toMultiplicity: relation.toMultiplicity,
      });
    }
  }

  return {
    title: "Untitled",
    diagramType: "CLASS",
    classes: Array.from(classes.values()),
    links,
  };
}

export function modelToMermaid(model: UMLModel): string {
  const lines: string[] = ["classDiagram", "    direction TB", ""];
  for (const cls of model.classes) {
    const stereotype = cls.stereotype ? `<<${cls.stereotype}>>` : "";
    lines.push(`    class ${cls.name}${stereotype} {`);
    for (const attr of cls.attributes) {
      const vis = attr.visibility === "public" ? "+" : attr.visibility === "private" ? "-" : "#";
      const suffix = attr.isStatic ? "$" : "";
      lines.push(`        ${vis}${attr.name}${attr.type !== "unknown" ? ` : ${attr.type}` : ""}${suffix}`);
    }
    for (const method of cls.methods) {
      const vis = method.visibility === "public" ? "+" : method.visibility === "private" ? "-" : "#";
      const params = method.parameters.map((p) => `${p.name}${p.type ? `: ${p.type}` : ""}`).join(", ");
      const suffix = method.isStatic ? "$" : "";
      lines.push(`        ${vis}${method.name}(${params}) : ${method.returnType}${suffix}`);
    }
    lines.push("    }");
    lines.push("");
  }
  for (const link of model.links) {
    const mermaidOp = relationToMermaid(link.type);
    const left = link.fromMultiplicity ? `${link.from} "${link.fromMultiplicity}"` : link.from;
    const right = link.toMultiplicity
      ? `${link.to} "${link.toMultiplicity}"${link.label ? ` : ${link.label}` : ""}`
      : `${link.to}${link.label ? ` : ${link.label}` : ""}`;
    lines.push(`    ${left} ${mermaidOp} ${right}`);
  }
  return lines.join("\n").trim() + "\n";
}

export function relationToMermaid(type: UMLLink["type"]): string {
  switch (type) {
    case "inheritance":
      return "--|>";
    case "implementation":
      return "..|>";
    case "composition":
      return "*--";
    case "aggregation":
      return "o--";
    case "dependency":
      return "..>";
    case "association":
      return "-->";
  }
}

export function detectDiagramType(code: string): DiagramType {
  const first = code.trim().split(/\r?\n/)[0] ?? "";
  if (/^classDiagram/i.test(first)) return "CLASS";
  if (/^sequenceDiagram/i.test(first)) return "SEQUENCE";
  if (/^erDiagram/i.test(first)) return "ER";
  if (/^stateDiagram/i.test(first)) return "STATE";
  if (/^flowchart|^graph/i.test(first)) return "ACTIVITY";
  if (/^gantt/i.test(first)) return "ACTIVITY";
  return "CLASS";
}

export function isMermaidModelType(code: string): boolean {
  return /^\s*classDiagram/i.test(code);
}

export function modelToPlantUml(model: UMLModel): string {
  const lines: string[] = ["@startuml", ""];
  for (const cls of model.classes) {
    if (cls.isInterface) {
      lines.push(`interface ${cls.name} {`);
    } else {
      lines.push(`class ${cls.name}${cls.stereotype ? ` <<${cls.stereotype}>>` : ""} {`);
    }
    for (const attr of cls.attributes) {
      const vis = attr.visibility === "public" ? "+" : attr.visibility === "private" ? "-" : "#";
      lines.push(`  ${vis}${attr.name}: ${attr.type}`);
    }
    for (const method of cls.methods) {
      const vis = method.visibility === "public" ? "+" : method.visibility === "private" ? "-" : "#";
      const params = method.parameters.map((p) => `${p.name}: ${p.type}`).join(", ");
      lines.push(`  ${vis}${method.name}(${params}): ${method.returnType}`);
    }
    lines.push("}");
    lines.push("");
  }
  for (const link of model.links) {
    const arrow =
      link.type === "inheritance" ? "<|--" : link.type === "implementation" ? "..|>" : link.type === "composition" ? "*--" : link.type === "aggregation" ? "o--" : link.type === "dependency" ? "..>" : "-->";
    lines.push(`${link.from} ${arrow} ${link.to}${link.label ? ` : ${link.label}` : ""}`);
  }
  lines.push("@enduml");
  return lines.join("\n");
}