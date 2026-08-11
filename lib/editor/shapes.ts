import type { ArchitectureNodeKind } from "@/types/diagram";

/**
 * Creately-style UML shape library.
 * Each shape carries a clean SVG thumbnail for the palette sidebar and a
 * default name; dropping a shape onto the canvas creates a node of that kind
 * (round-tripped through Mermaid via <<stereotype>>).
 */

export type ShapeCategory =
  | "Class Diagram"
  | "Sequence Diagram"
  | "Use Case Diagram"
  | "Activity Diagram"
  | "State Diagram"
  | "Component & Deployment"
  | "ER Diagram"
  | "General";

export interface UMLShape {
  kind: ArchitectureNodeKind;
  label: string;
  category: ShapeCategory;
  keywords: string[];
  /** 48x48 SVG markup (viewBox 0 0 48 48). */
  thumbnail: string;
  defaultName: string;
}

const STROKE = "#C1C7D0";
const FILL = "#FFFFFF";

export const SHAPE_CATEGORIES: Array<{ id: ShapeCategory; label: string }> = [
  { id: "Class Diagram", label: "UML Class Diagram" },
  { id: "Sequence Diagram", label: "UML Sequence Diagram" },
  { id: "Use Case Diagram", label: "UML Use Case Diagram" },
  { id: "Activity Diagram", label: "UML Activity Diagram" },
  { id: "State Diagram", label: "UML State Diagram" },
  { id: "Component & Deployment", label: "Component & Deployment" },
  { id: "ER Diagram", label: "ER Diagram" },
  { id: "General", label: "General Shapes" },
];

const rect = (label: string, cls = ""): string => `
  <rect x="8" y="14" width="32" height="20" rx="3"${cls} fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"/>
  <text x="24" y="27.5" text-anchor="middle" font-size="7.5" font-family="Inter, sans-serif" fill="#172B4D">${label}</text>`;

const ellipse = (label: string, dashed = false): string => `
  <ellipse cx="24" cy="24" rx="17" ry="11" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"${dashed ? ' stroke-dasharray="3 2"' : ""}/>
  <text x="24" y="27" text-anchor="middle" font-size="7.5" font-family="Inter, sans-serif" fill="#172B4D">${label}</text>`;

const diamond = (label: string, cls = ""): string => `
  <polygon points="24,10 40,24 24,38 8,24" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"${cls}/>
  <text x="24" y="27" text-anchor="middle" font-size="7.5" font-family="Inter, sans-serif" fill="#172B4D">${label}</text>`;

const actor = (): string => `
  <circle cx="24" cy="15" r="5.5" fill="none" stroke="#172B4D" stroke-width="1.4"/>
  <path d="M 13 35 C 13 27 18 23.5 24 23.5 C 30 23.5 35 27 35 35" fill="none" stroke="#172B4D" stroke-width="1.4"/>
  <path d="M 24 23.5 L 24 30" stroke="#172B4D" stroke-width="1.4"/>
  <path d="M 24 27 L 15.5 30.5" stroke="#172B4D" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M 24 27 L 32.5 30.5" stroke="#172B4D" stroke-width="1.4" stroke-linecap="round"/>`;

const note = (): string => `
  <path d="M 9 14 h 22 l 8 8 v 12 a 1.5 1.5 0 0 1 -1.5 1.5 h -28.5 a 1.5 1.5 0 0 1 -1.5 -1.5 v -18 a 1.5 1.5 0 0 1 1.5 -1.5 z" fill="#FFFDF5" stroke="#E6A817" stroke-width="1.2"/>
  <path d="M 31 14 v 8 h 8" fill="none" stroke="#E6A817" stroke-width="1.2"/>
  <text x="24" y="28.5" text-anchor="middle" font-size="7.5" font-family="Inter, sans-serif" fill="#8A5A00">Note</text>`;

const constraint = (): string => `
  <path d="M 13 17 a 3.5 3.5 0 0 1 3.5 3.5 v 4 a 3.5 3.5 0 0 0 3.5 3.5 a 3.5 3.5 0 0 0 -3.5 3.5 v 4 a 3.5 3.5 0 0 1 -3.5 3.5" fill="none" stroke="${STROKE}" stroke-width="1.4"/>
  <path d="M 35 17 a 3.5 3.5 0 0 0 -3.5 3.5 v 4 a 3.5 3.5 0 0 1 -3.5 3.5 a 3.5 3.5 0 0 1 3.5 3.5 v 4 a 3.5 3.5 0 0 0 3.5 3.5" fill="none" stroke="${STROKE}" stroke-width="1.4"/>
  <text x="24" y="25" text-anchor="middle" font-size="7.5" font-family="Inter, sans-serif" fill="#172B4D">constraint</text>`;

const lifeline = (): string => `
  <rect x="13" y="8" width="22" height="9" rx="1.5" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"/>
  <text x="24" y="14.5" text-anchor="middle" font-size="6" font-family="Inter, sans-serif" fill="#172B4D">object</text>
  <line x1="24" y1="17" x2="24" y2="40" stroke="#94A3B8" stroke-width="1" stroke-dasharray="3 2"/>`;

const activation = (): string => `
  <rect x="21" y="14" width="6" height="22" fill="#E8F0FE" stroke="#0052CC" stroke-width="1.1"/>
  <line x1="14" y1="14" x2="34" y2="14" stroke="#94A3B8" stroke-width="1" stroke-dasharray="3 2"/>
  <line x1="14" y1="36" x2="34" y2="36" stroke="#94A3B8" stroke-width="1" stroke-dasharray="3 2"/>`;

const message = (): string => `
  <line x1="8" y1="22" x2="36" y2="22" stroke="#172B4D" stroke-width="1.3"/>
  <polygon points="36,22 30,18.5 30,25.5" fill="#172B4D"/>
  <text x="22" y="15" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#5E6C84">message</text>`;

const returnMessage = (): string => `
  <line x1="36" y1="22" x2="8" y2="22" stroke="#172B4D" stroke-width="1.1" stroke-dasharray="4 3"/>
  <polygon points="8,22 14,18.5 14,25.5" fill="#172B4D"/>
  <text x="22" y="15" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#5E6C84">return</text>`;

const fragment = (): string => `
  <rect x="6" y="12" width="36" height="26" fill="none" stroke="#172B4D" stroke-width="1.2" stroke-dasharray="4 3"/>
  <rect x="6" y="12" width="14" height="7" fill="#F8F9FA" stroke="#172B4D" stroke-width="1"/>
  <text x="13" y="17" text-anchor="middle" font-size="6.5" font-family="monospace" fill="#172B4D">alt</text>
  <line x1="6" y1="25" x2="42" y2="25" stroke="#172B4D" stroke-width="1" stroke-dasharray="3 2"/>`;

const startCircle = (): string => `
  <circle cx="24" cy="24" r="9" fill="#172B4D"/>`;

const endCircle = (): string => `
  <circle cx="24" cy="24" r="12" fill="none" stroke="#172B4D" stroke-width="1.4"/>
  <circle cx="24" cy="24" r="6" fill="#172B4D"/>`;

const forkBar = (): string => `
  <rect x="6" y="20" width="36" height="8" rx="1" fill="#5E6C84"/>
  <line x1="14" y1="28" x2="14" y2="36" stroke="#5E6C84" stroke-width="1.3"/>
  <line x1="34" y1="28" x2="34" y2="36" stroke="#5E6C84" stroke-width="1.3"/>`;

const swimlane = (): string => `
  <rect x="8" y="8" width="32" height="8" fill="#F8F9FA" stroke="${STROKE}" stroke-width="1.2"/>
  <text x="24" y="14" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#172B4D">Lane</text>
  <rect x="8" y="16" width="32" height="24" fill="none" stroke="${STROKE}" stroke-width="1"/>
  <line x1="8" y1="26" x2="40" y2="26" stroke="#E5E7EB" stroke-width="1"/>`;

const componentShape = (): string => `
  <rect x="14" y="12" width="22" height="24" rx="2" fill="${FILL}" stroke="#172B4D" stroke-width="1.2"/>
  <rect x="9" y="15" width="5" height="4" fill="${FILL}" stroke="#172B4D" stroke-width="1.1"/>
  <rect x="9" y="21" width="5" height="4" fill="${FILL}" stroke="#172B4D" stroke-width="1.1"/>
  <rect x="9" y="27" width="5" height="4" fill="${FILL}" stroke="#172B4D" stroke-width="1.1"/>
  <text x="25" y="29" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#172B4D">component</text>`;

const nodeCube = (): string => `
  <path d="M 12 16 L 24 9 L 36 16 L 24 23 Z" fill="${FILL}" stroke="#172B4D" stroke-width="1.2"/>
  <path d="M 12 16 L 12 30 L 24 37 L 24 23 Z" fill="#F8F9FA" stroke="#172B4D" stroke-width="1.2"/>
  <path d="M 24 23 L 36 16 L 36 30 L 24 37 Z" fill="#F1F3F4" stroke="#172B4D" stroke-width="1.2"/>`;

const artifactShape = (): string => `
  <path d="M 12 12 h 17 l 7 7 v 17 a 1.5 1.5 0 0 1 -1.5 1.5 h -22.5 a 1.5 1.5 0 0 1 -1.5 -1.5 v -22.5 a 1.5 1.5 0 0 1 1.5 -1.5 z" fill="${FILL}" stroke="#172B4D" stroke-width="1.2"/>
  <path d="M 29 12 v 7 h 7" fill="none" stroke="#172B4D" stroke-width="1.2"/>
  <line x1="15" y1="23" x2="33" y2="23" stroke="#94A3B8" stroke-width="1"/>
  <line x1="15" y1="27" x2="33" y2="27" stroke="#94A3B8" stroke-width="1"/>
  <line x1="15" y1="31" x2="27" y2="31" stroke="#94A3B8" stroke-width="1"/>`;

const portShape = (): string => `
  <rect x="18" y="18" width="12" height="12" fill="${FILL}" stroke="#0052CC" stroke-width="1.4"/>
  <text x="24" y="40" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#5E6C84">port</text>`;

const cloudShape = (): string => `
  <path d="M 15 33 a 8 8 0 0 1 -1.2 -15.9 a 9.5 9.5 0 0 1 18 -2.6 a 6.5 6.5 0 0 1 1.4 16.1 z" fill="#EFF6FF" stroke="#0052CC" stroke-width="1.2"/>
  <text x="24" y="26.5" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#1D4ED8">Cloud</text>`;

const documentShape = (): string => `
  <path d="M 13 12 h 15 l 7 7 v 17 a 1.5 1.5 0 0 1 -1.5 1.5 h -20.5 a 1.5 1.5 0 0 1 -1.5 -1.5 v -22.5 a 1.5 1.5 0 0 1 1.5 -1.5 z" fill="${FILL}" stroke="#172B4D" stroke-width="1.2"/>
  <path d="M 28 12 v 7 h 7" fill="none" stroke="#172B4D" stroke-width="1.2"/>
  <line x1="16" y1="24" x2="32" y2="24" stroke="#C1C7D0" stroke-width="1"/>
  <line x1="16" y1="28" x2="32" y2="28" stroke="#C1C7D0" stroke-width="1"/>
  <line x1="16" y1="32" x2="27" y2="32" stroke="#C1C7D0" stroke-width="1"/>`;

const parallelogramShape = (): string => `
  <polygon points="12,17 40,17 36,31 8,31" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"/>
  <text x="24" y="26.5" text-anchor="middle" font-size="7" font-family="Inter, sans-serif" fill="#172B4D">Action</text>`;

const databaseThumb = (): string => `
  <ellipse cx="24" cy="14" rx="13" ry="5" fill="#F8F9FA" stroke="#172B4D" stroke-width="1.2"/>
  <path d="M 11 14 v 20 a 13 5 0 0 0 26 0 v -20" fill="${FILL}" stroke="#172B4D" stroke-width="1.2"/>
  <path d="M 11 24 a 13 5 0 0 0 26 0" fill="none" stroke="#172B4D" stroke-width="1.2"/>
  <text x="24" y="41" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#5E6C84">database</text>`;

const packageShape = (): string => `
  <path d="M 10 16 h 11 l 4 5 h 13 v 13 a 1.5 1.5 0 0 1 -1.5 1.5 h -26 a 1.5 1.5 0 0 1 -1.5 -1.5 z" fill="${FILL}" stroke="#172B4D" stroke-width="1.2"/>
  <text x="24" y="34" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" fill="#172B4D">package</text>`;

const classThumb = (): string => `
  <rect x="8" y="12" width="32" height="24" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"/>
  <rect x="8" y="12" width="32" height="9" fill="#F8F9FA" stroke="${STROKE}" stroke-width="1.2"/>
  <text x="24" y="18.5" text-anchor="middle" font-size="6.5" font-family="Inter, sans-serif" font-weight="600" fill="#172B4D">Class</text>
  <line x1="10" y1="25" x2="38" y2="25" stroke="#94A3B8" stroke-width="0.9"/>
  <line x1="10" y1="29" x2="38" y2="29" stroke="#94A3B8" stroke-width="0.9"/>
  <line x1="10" y1="33" x2="24" y2="33" stroke="#94A3B8" stroke-width="0.9"/>`;

const interfaceThumb = (): string => `
  <rect x="8" y="12" width="32" height="24" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"/>
  <rect x="8" y="12" width="32" height="9" fill="#F8F9FA" stroke="${STROKE}" stroke-width="1.2"/>
  <text x="24" y="15.5" text-anchor="middle" font-size="5" font-family="Inter, sans-serif" font-style="italic" fill="#5E6C84">&lt;&lt;interface&gt;&gt;</text>
  <text x="24" y="21" text-anchor="middle" font-size="6" font-family="Inter, sans-serif" fill="#172B4D">Interface</text>
  <line x1="10" y1="25" x2="38" y2="25" stroke="#94A3B8" stroke-width="0.9"/>
  <line x1="10" y1="29" x2="38" y2="29" stroke="#94A3B8" stroke-width="0.9"/>`;

const enumThumb = (): string => `
  <rect x="8" y="12" width="32" height="24" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"/>
  <rect x="8" y="12" width="32" height="9" fill="#F0F9FF" stroke="${STROKE}" stroke-width="1.2"/>
  <text x="24" y="18.5" text-anchor="middle" font-size="5.5" font-family="Inter, sans-serif" fill="#0369A1">&lt;&lt;enumeration&gt;&gt;</text>
  <line x1="10" y1="25" x2="38" y2="25" stroke="#94A3B8" stroke-width="0.9"/>
  <line x1="10" y1="29" x2="38" y2="29" stroke="#94A3B8" stroke-width="0.9"/>
  <line x1="10" y1="33" x2="30" y2="33" stroke="#94A3B8" stroke-width="0.9"/>`;

export const UML_SHAPES: UMLShape[] = [
  /* A. Class diagram */
  { kind: "class", label: "Class", category: "Class Diagram", keywords: ["class", "uml", "object", "type"], thumbnail: classThumb(), defaultName: "NewClass" },
  { kind: "abstract", label: "Abstract Class", category: "Class Diagram", keywords: ["abstract", "class", "uml"], thumbnail: classThumb(), defaultName: "NewAbstract" },
  { kind: "interface", label: "Interface", category: "Class Diagram", keywords: ["interface", "contract", "uml"], thumbnail: interfaceThumb(), defaultName: "NewInterface" },
  { kind: "enum", label: "Enumeration", category: "Class Diagram", keywords: ["enum", "enumeration", "values"], thumbnail: enumThumb(), defaultName: "NewEnum" },
  { kind: "package", label: "Package", category: "Class Diagram", keywords: ["package", "namespace", "folder"], thumbnail: packageShape(), defaultName: "NewPackage" },
  { kind: "note", label: "Note", category: "Class Diagram", keywords: ["note", "comment", "annotation"], thumbnail: note(), defaultName: "Note" },
  { kind: "constraint", label: "Constraint", category: "Class Diagram", keywords: ["constraint", "guard", "ocl", "braces"], thumbnail: constraint(), defaultName: "Constraint" },
  { kind: "actor", label: "Actor", category: "Class Diagram", keywords: ["actor", "person", "user", "stick"], thumbnail: actor(), defaultName: "NewActor" },

  /* B. Sequence diagram */
  { kind: "actor", label: "Actor", category: "Sequence Diagram", keywords: ["actor", "participant", "sequence"], thumbnail: actor(), defaultName: "NewActor" },
  { kind: "lifeline", label: "Lifeline", category: "Sequence Diagram", keywords: ["lifeline", "participant", "object", "sequence"], thumbnail: lifeline(), defaultName: "NewLifeline" },
  { kind: "boundary", label: "Boundary", category: "Sequence Diagram", keywords: ["boundary", "interface", "screen"], thumbnail: rect("«boundary»"), defaultName: "NewBoundary" },
  { kind: "controller", label: "Control", category: "Sequence Diagram", keywords: ["control", "controller"], thumbnail: rect("«control»"), defaultName: "NewControl" },
  { kind: "entity", label: "Entity", category: "Sequence Diagram", keywords: ["entity", "model"], thumbnail: rect("«entity»"), defaultName: "NewEntity" },
  { kind: "activation", label: "Activation Bar", category: "Sequence Diagram", keywords: ["activation", "bar", "execution"], thumbnail: activation(), defaultName: "Activation" },
  { kind: "message", label: "Message", category: "Sequence Diagram", keywords: ["message", "arrow", "call"], thumbnail: message(), defaultName: "Message" },
  { kind: "return-message", label: "Return Message", category: "Sequence Diagram", keywords: ["return", "dashed", "reply"], thumbnail: returnMessage(), defaultName: "Return" },
  { kind: "self-message", label: "Self Message", category: "Sequence Diagram", keywords: ["self", "recursive", "message"], thumbnail: `<g stroke="#172B4D" stroke-width="1.2" fill="none"><rect x="24" y="14" width="14" height="9" rx="2"/><polygon points="36,22 30,20.5 30,23.5" fill="#172B4D"/><path d="M 24 19 h -6"/></g><text x="20" y="40" text-anchor="middle" font-size="6" font-family="Inter, sans-serif" fill="#5E6C84">self</text>`, defaultName: "SelfMessage" },
  { kind: "fragment", label: "Fragment (alt/opt/loop)", category: "Sequence Diagram", keywords: ["fragment", "alt", "opt", "loop", "par"], thumbnail: fragment(), defaultName: "Fragment" },
  { kind: "destroy", label: "Destroy", category: "Sequence Diagram", keywords: ["destroy", "delete", "x"], thumbnail: `<g><line x1="14" y1="22" x2="34" y2="22" stroke="#94A3B8" stroke-width="1" stroke-dasharray="3 2"/><g stroke="#172B4D" stroke-width="2" stroke-linecap="round"><line x1="30" y1="16" x2="38" y2="24"/><line x1="38" y1="16" x2="30" y2="24"/></g></g>`, defaultName: "Destroy" },

  /* C. Use case diagram */
  { kind: "actor", label: "Actor", category: "Use Case Diagram", keywords: ["actor", "user", "person"], thumbnail: actor(), defaultName: "NewActor" },
  { kind: "usecase", label: "Use Case", category: "Use Case Diagram", keywords: ["use case", "ellipse", "behavior"], thumbnail: ellipse("Use Case"), defaultName: "NewUseCase" },
  { kind: "boundary", label: "System Boundary", category: "Use Case Diagram", keywords: ["system", "boundary", "rectangle"], thumbnail: rect("System"), defaultName: "System" },
  { kind: "message", label: "Include", category: "Use Case Diagram", keywords: ["include", "dashed", "arrow"], thumbnail: `<line x1="8" y1="24" x2="34" y2="24" stroke="#172B4D" stroke-width="1.2" stroke-dasharray="4 3"/><polygon points="34,24 28,20.5 28,27.5" fill="#172B4D"/><text x="21" y="17" text-anchor="middle" font-size="6" font-family="Inter, sans-serif" fill="#5E6C84">&lt;&lt;include&gt;&gt;</text>`, defaultName: "Include" },
  { kind: "message", label: "Extend", category: "Use Case Diagram", keywords: ["extend", "dashed", "condition"], thumbnail: `<line x1="8" y1="24" x2="34" y2="24" stroke="#172B4D" stroke-width="1.2" stroke-dasharray="4 3"/><polygon points="34,24 28,20.5 28,27.5" fill="#172B4D"/><text x="21" y="17" text-anchor="middle" font-size="6" font-family="Inter, sans-serif" fill="#5E6C84">&lt;&lt;extend&gt;&gt;</text>`, defaultName: "Extend" },
  { kind: "message", label: "Association", category: "Use Case Diagram", keywords: ["association", "line", "solid"], thumbnail: `<line x1="8" y1="24" x2="40" y2="24" stroke="#172B4D" stroke-width="1.3"/>`, defaultName: "Association" },

  /* D. Activity diagram */
  { kind: "start", label: "Start", category: "Activity Diagram", keywords: ["start", "initial", "begin", "circle"], thumbnail: startCircle(), defaultName: "Start" },
  { kind: "end", label: "End", category: "Activity Diagram", keywords: ["end", "final", "finish", "circle"], thumbnail: endCircle(), defaultName: "End" },
  { kind: "activity", label: "Activity", category: "Activity Diagram", keywords: ["activity", "action", "rounded"], thumbnail: rect("Activity", ' rx="6"'), defaultName: "NewActivity" },
  { kind: "decision", label: "Decision", category: "Activity Diagram", keywords: ["decision", "branch", "diamond", "merge"], thumbnail: diamond("?"), defaultName: "Decision" },
  { kind: "fork", label: "Fork / Join", category: "Activity Diagram", keywords: ["fork", "join", "bar", "parallel", "sync"], thumbnail: forkBar(), defaultName: "Fork" },
  { kind: "swimlane", label: "Swimlane", category: "Activity Diagram", keywords: ["swimlane", "lane", "partition"], thumbnail: swimlane(), defaultName: "NewSwimlane" },
  { kind: "message", label: "Flow", category: "Activity Diagram", keywords: ["flow", "arrow", "edge"], thumbnail: `<line x1="8" y1="22" x2="36" y2="22" stroke="#172B4D" stroke-width="1.3"/><polygon points="36,22 30,18.5 30,25.5" fill="#172B4D"/>`, defaultName: "Flow" },

  /* E. State diagram */
  { kind: "initial", label: "Initial State", category: "State Diagram", keywords: ["initial", "start", "state"], thumbnail: startCircle(), defaultName: "Initial" },
  { kind: "final", label: "Final State", category: "State Diagram", keywords: ["final", "end", "state"], thumbnail: endCircle(), defaultName: "Final" },
  { kind: "state", label: "State", category: "State Diagram", keywords: ["state", "rounded", "machine"], thumbnail: rect("State", ' rx="8"'), defaultName: "NewState" },
  { kind: "transition", label: "Transition", category: "State Diagram", keywords: ["transition", "arrow", "guard"], thumbnail: `<line x1="8" y1="22" x2="34" y2="22" stroke="#172B4D" stroke-width="1.3"/><polygon points="34,22 28,18.5 28,25.5" fill="#172B4D"/><text x="21" y="15" text-anchor="middle" font-size="6" font-family="Inter, sans-serif" fill="#5E6C84">event [guard]</text>`, defaultName: "Transition" },

  /* F. Component & deployment */
  { kind: "component", label: "Component", category: "Component & Deployment", keywords: ["component", "module"], thumbnail: componentShape(), defaultName: "NewComponent" },
  { kind: "node", label: "Node", category: "Component & Deployment", keywords: ["node", "server", "cube", "deployment"], thumbnail: nodeCube(), defaultName: "NewNode" },
  { kind: "artifact", label: "Artifact", category: "Component & Deployment", keywords: ["artifact", "file", "jar"], thumbnail: artifactShape(), defaultName: "artifact" },
  { kind: "port", label: "Port", category: "Component & Deployment", keywords: ["port", "interface", "square"], thumbnail: portShape(), defaultName: "Port" },

  /* G. ER diagram */
  { kind: "table", label: "Entity", category: "ER Diagram", keywords: ["entity", "table", "er"], thumbnail: rect("Entity"), defaultName: "NewEntity" },
  { kind: "weak-entity", label: "Weak Entity", category: "ER Diagram", keywords: ["weak", "entity", "double"], thumbnail: `<rect x="8" y="16" width="32" height="18" fill="${FILL}" stroke="#172B4D" stroke-width="1.3"/><rect x="11" y="19" width="26" height="12" fill="none" stroke="#172B4D" stroke-width="1"/>`, defaultName: "NewWeakEntity" },
  { kind: "attribute", label: "Attribute", category: "ER Diagram", keywords: ["attribute", "ellipse"], thumbnail: ellipse("attr"), defaultName: "NewAttribute" },
  { kind: "derived-attribute", label: "Derived Attribute", category: "ER Diagram", keywords: ["derived", "dashed", "attribute"], thumbnail: ellipse("attr", true), defaultName: "NewDerived" },
  { kind: "relationship", label: "Relationship", category: "ER Diagram", keywords: ["relationship", "diamond"], thumbnail: diamond(""), defaultName: "Relationship" },
  { kind: "weak-relationship", label: "Weak Relationship", category: "ER Diagram", keywords: ["weak", "relationship", "double", "diamond"], thumbnail: `<polygon points="24,10 40,24 24,38 8,24" fill="${FILL}" stroke="#172B4D" stroke-width="1.3"/><polygon points="24,14 36,24 24,34 12,24" fill="none" stroke="#172B4D" stroke-width="1"/>`, defaultName: "WeakRelationship" },

  /* H. General shapes */
  { kind: "rect", label: "Rectangle", category: "General", keywords: ["rectangle", "box", "square"], thumbnail: rect(""), defaultName: "Rectangle" },
  { kind: "rounded-rect", label: "Rounded Rectangle", category: "General", keywords: ["rounded", "rectangle", "pill"], thumbnail: rect("", ' rx="6"'), defaultName: "RoundedRect" },
  { kind: "circle", label: "Circle", category: "General", keywords: ["circle", "ellipse"], thumbnail: `<circle cx="24" cy="24" r="12" fill="${FILL}" stroke="${STROKE}" stroke-width="1.2"/>`, defaultName: "Circle" },
  { kind: "diamond", label: "Diamond", category: "General", keywords: ["diamond", "rhombus"], thumbnail: diamond(""), defaultName: "Diamond" },
  { kind: "parallelogram", label: "Parallelogram", category: "General", keywords: ["parallelogram", "input", "output"], thumbnail: parallelogramShape(), defaultName: "Action" },
  { kind: "document", label: "Document", category: "General", keywords: ["document", "file", "report"], thumbnail: documentShape(), defaultName: "Document" },
  { kind: "database", label: "Database", category: "General", keywords: ["database", "db", "cylinder", "storage"], thumbnail: databaseThumb(), defaultName: "NewDatabase" },
  { kind: "cloud", label: "Cloud", category: "General", keywords: ["cloud", "external", "internet"], thumbnail: cloudShape(), defaultName: "Cloud" },
];

export function shapeByKind(kind: ArchitectureNodeKind): UMLShape | undefined {
  return UML_SHAPES.find((s) => s.kind === kind && s.category !== "Class Diagram") ?? UML_SHAPES.find((s) => s.kind === kind);
}

export function searchShapes(query: string): UMLShape[] {
  const q = query.trim().toLowerCase();
  if (!q) return UML_SHAPES;
  return UML_SHAPES.filter((s) => s.label.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q)));
}
