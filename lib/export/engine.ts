"use client";

import type { UMLModel } from "@/types/diagram";
import { modelToPlantUml } from "@/lib/mermaid/parser";
import { downloadFile } from "@/lib/utils";

export type ExportFormat = "svg" | "png" | "pdf" | "plantuml" | "mermaid" | "json";

export interface ExportOptions {
  scale?: 1 | 2 | 4;
  filename?: string;
}

async function renderMermaidSvg(code: string): Promise<string> {
  const mermaidModule = await import("mermaid");
  mermaidModule.default.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme: "base",
    themeVariables: {
      primaryColor: "#2563EB",
      primaryTextColor: "#0F172A",
      primaryBorderColor: "#BFDBFE",
      lineColor: "#94A3B8",
      secondaryColor: "#F8FAFC",
      tertiaryColor: "#FEF3C7",
      clusterBkg: "#F8FAFC",
      clusterBorder: "#E2E8F0",
      edgeLabelBackground: "#FFFFFF",
      fontFamily: "Inter, -apple-system, sans-serif",
      fontSize: "13px",
    },
    flowchart: { htmlLabels: true, curve: "basis" },
  });
  const { svg } = await mermaidModule.default.render(`export-${Date.now()}`, code);
  return svg;
}

export function svgToFile(svg: string, filename: string): void {
  downloadFile(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svg}`, filename, "image/svg+xml");
}

export function jsonToFile(model: UMLModel, filename: string): void {
  downloadFile(JSON.stringify(model, null, 2), filename, "application/json");
}

export function plantUmlToFile(model: UMLModel, filename: string): void {
  downloadFile(modelToPlantUml(model), filename, "text/plain");
}

export function mermaidToFile(code: string, filename: string): void {
  downloadFile(code, filename, "text/plain");
}

export async function pngFromElement(element: HTMLElement, filename: string, scale: 1 | 2 | 4 = 2): Promise<void> {
  const html2canvasModule = await import("html2canvas");
  const canvas = await html2canvasModule.default(
    element,
    { scale, backgroundColor: "#FFFFFF", useCORS: true, logging: false } as unknown as Parameters<typeof html2canvasModule.default>[1]
  );
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG encoding failed");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function pdfFromElement(element: HTMLElement, filename: string): Promise<void> {
  const html2canvasModule = await import("html2canvas");
  const { jsPDF } = await import("jspdf");
  const canvas = await html2canvasModule.default(
    element,
    { scale: 2, backgroundColor: "#FFFFFF", useCORS: true, logging: false } as unknown as Parameters<typeof html2canvasModule.default>[1]
  );
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
}

export async function exportDiagram(
  format: ExportFormat,
  element: HTMLElement,
  model: UMLModel,
  options: ExportOptions
): Promise<void> {
  const base = options.filename ?? "diagram";
  switch (format) {
    case "svg": {
      const svg = await renderMermaidSvg(element.dataset.mermaidCode ?? "");
      svgToFile(svg, `${base}.svg`);
      break;
    }
    case "png":
      await pngFromElement(element, `${base}.png`, options.scale ?? 2);
      break;
    case "pdf":
      await pdfFromElement(element, `${base}.pdf`);
      break;
    case "plantuml":
      plantUmlToFile(model, `${base}.puml`);
      break;
    case "mermaid":
      mermaidToFile(element.dataset.mermaidCode ?? "", `${base}.mmd`);
      break;
    case "json":
      jsonToFile(model, `${base}.json`);
      break;
  }
}

export { renderMermaidSvg };