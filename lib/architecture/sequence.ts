import type { Architecture, ArchitectureRelationshipType } from "@/types/diagram";

/* ------------------------------------------------------------------ */
/* generateSequenceMermaid — derive a sequence diagram from the        */
/* canonical model by walking controller -> service -> repository ->   */
/* entity call chains. Deterministic: same model always yields the     */
/* same sequence.                                                      */
/* ------------------------------------------------------------------ */

export function generateSequenceMermaid(arch: Architecture): string {
  const nodes = arch.nodes;
  const byName = new Map(nodes.map((n) => [n.name, n]));

  const kindMatches = (name: string, kind: string): boolean =>
    (byName.get(name)?.kind ?? "").toLowerCase() === kind.toLowerCase() ||
    new RegExp(kind, "i").test(name);

  const controllers = nodes.filter((n) => n.kind === "controller" || /controller$/i.test(n.name)).map((n) => n.name);
  const services = nodes.filter((n) => n.kind === "service" || /service$/i.test(n.name)).map((n) => n.name);
  const repositories = nodes.filter((n) => n.kind === "repository" || /repo/i.test(n.name)).map((n) => n.name);
  const entities = nodes.filter((n) => n.kind === "entity" || n.kind === "table" || /entity|table$/i.test(n.name)).map((n) => n.name);
  const databases = nodes.filter((n) => n.kind === "database" || /db|database/i.test(n.name)).map((n) => n.name);

  const participantOrder: string[] = [];
  const push = (name: string): void => {
    if (name && !participantOrder.includes(name)) participantOrder.push(name);
  };

  // Client / actor first if any
  for (const node of nodes) {
    if (node.kind === "actor" || /client|user$/i.test(node.name)) push(node.name);
  }

  const involved = new Set<string>();
  for (const controller of controllers) {
    involved.add(controller);
    const calls = arch.relationships.filter((r) => r.source === controller);
    for (const call of calls) {
      if (services.includes(call.target) || kindMatches(call.target, "service")) involved.add(call.target);
    }
  }
  for (const service of services) {
    const calls = arch.relationships.filter((r) => r.source === service);
    for (const call of calls) {
      if (repositories.includes(call.target) || kindMatches(call.target, "repo")) involved.add(call.target);
    }
  }
  for (const repo of repositories) {
    const calls = arch.relationships.filter((r) => r.source === repo);
    for (const call of calls) {
      if (databases.includes(call.target) || kindMatches(call.target, "db")) involved.add(call.target);
      else if (entities.includes(call.target)) involved.add(call.target);
    }
  }
  for (const name of involved) push(name);
  if (participantOrder.length === 0) {
    for (const node of nodes) push(node.name);
  }
  if (participantOrder.length === 0) {
    return "sequenceDiagram\n    Note over All: No participants available";
  }

  const lines: string[] = ["sequenceDiagram", "    autonumber"];
  for (const name of participantOrder) lines.push(`    participant ${name}`);

  let client: string | null = null;
  for (const node of nodes) {
    if (node.kind === "actor" || /client|user$/i.test(node.name)) {
      client = node.name;
      break;
    }
  }

  const emit = (source: string, target: string, label: string, type: ArchitectureRelationshipType = "call"): void => {
    const arrow = type === "return" ? "-->>" : "->>";
    lines.push(`    ${source}${arrow}${target}: ${label}`);
  };

  const seenCalls = new Set<string>();

  const walk = (controller: string): void => {
    const serviceCalls = arch.relationships
      .filter((r) => r.source === controller && r.type !== "return")
      .filter((r) => services.includes(r.target) || kindMatches(r.target, "service"));
    for (const sc of serviceCalls) {
      const svc = sc.target;
      if (seenCalls.has(`${controller}|${svc}`)) continue;
      seenCalls.add(`${controller}|${svc}`);
      emit(controller, svc, sc.label ?? `call ${svc}`);
      const repoCalls = arch.relationships
        .filter((r) => r.source === svc && r.type !== "return")
        .filter((r) => repositories.includes(r.target) || kindMatches(r.target, "repo"));
      for (const rc of repoCalls) {
        const repo = rc.target;
        if (seenCalls.has(`${svc}|${repo}`)) continue;
        seenCalls.add(`${svc}|${repo}`);
        emit(svc, repo, rc.label ?? `persist/load via ${repo}`);
        const dbCalls = arch.relationships
          .filter((r) => r.source === repo && r.type !== "return")
          .filter((r) => databases.includes(r.target) || kindMatches(r.target, "db") || entities.includes(r.target));
        for (const dc of dbCalls) {
          if (seenCalls.has(`${repo}|${dc.target}`)) continue;
          seenCalls.add(`${repo}|${dc.target}`);
          emit(repo, dc.target, dc.label ?? `query ${dc.target}`);
          emit(dc.target, repo, "result", "return");
        }
        emit(repo, svc, "result", "return");
      }
      emit(svc, controller, "result", "return");
    }
  };

  if (controllers.length > 0) {
    if (client) emit(client, controllers[0], "request");
    for (const controller of controllers) walk(controller);
  } else if (services.length > 0) {
    const origin = client ?? participantOrder[0];
    emit(origin, services[0], "trigger");
    for (const service of services) {
      const repoCalls = arch.relationships
        .filter((r) => r.source === service && r.type !== "return")
        .filter((r) => repositories.includes(r.target) || kindMatches(r.target, "repo"));
      for (const rc of repoCalls) {
        emit(service, rc.target, rc.label ?? `persist/load via ${rc.target}`);
        emit(rc.target, service, "result", "return");
      }
    }
  } else {
    for (const rel of arch.relationships.slice(0, 12)) {
      if (seenCalls.has(`${rel.source}|${rel.target}`)) continue;
      seenCalls.add(`${rel.source}|${rel.target}`);
      emit(rel.source, rel.target, rel.label ?? rel.type);
    }
  }

  return lines.join("\n");
}
