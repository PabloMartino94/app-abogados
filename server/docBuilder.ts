import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  PageNumber,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { DraftDocument } from "./ai";

const FONT = "Garamond";

// 1 cm = 567 twips. El estudio usa 3 cm en los cuatro márgenes.
const CM = 567;
const MARGIN = 3 * CM;

// A4 en twips.
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;

export type Branding = {
  firmName: string;
  addressLine: string;
  logo?: { data: Buffer; type: "png" | "jpg" } | null;
};

/**
 * Reemplaza las variables del texto con los datos reales.
 * - Variable conocida sin dato: una línea para completar a mano.
 * - Variable desconocida: se deja tal cual, para que el error se vea.
 */
export function fillVariables(text: string, data: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    if (!(key in data)) return match;
    const value = data[key];
    return value && value.trim() ? value : "____________";
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160, line: 276 },
    children: [new TextRun({ text, font: FONT, size: 24 })],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true })],
  });
}

function documentTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: 28, bold: true })],
  });
}

/** Membrete del estudio: logo, línea y dirección, replicando el diseño del estudio. */
function letterheadBlock(branding: Branding): Paragraph[] {
  const blocks: Paragraph[] = [];

  blocks.push(
    new Paragraph({
      spacing: { before: 600 },
      children: [],
    })
  );

  if (branding.logo) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new ImageRun({
            type: branding.logo.type === "jpg" ? "jpg" : "png",
            data: branding.logo.data,
            transformation: { width: 70, height: 70 },
          }),
        ],
      })
    );
  }

  // Línea gruesa centrada, debajo del logo.
  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 1 },
      },
      children: [],
    })
  );

  if (branding.addressLine) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: branding.addressLine, font: FONT, size: 18 })],
      })
    );
  }

  return blocks;
}

function pageFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Página ", font: FONT, size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16 }),
          new TextRun({ text: " de ", font: FONT, size: 16 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16 }),
        ],
      }),
    ],
  });
}

export async function buildDocxFromDraft(
  draft: DraftDocument,
  branding: Branding,
  data: Record<string, string>
): Promise<Buffer> {
  const children: Paragraph[] = [documentTitle(fillVariables(draft.titulo, data))];

  for (const section of draft.secciones) {
    if (section.titulo) {
      children.push(sectionHeading(fillVariables(section.titulo, data)));
    }
    for (const paragraph of section.parrafos) {
      children.push(bodyParagraph(fillVariables(paragraph, data)));
    }
  }

  children.push(...letterheadBlock(branding));

  const doc = new Document({
    creator: branding.firmName || "AboxApp",
    title: draft.titulo,
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH, height: A4_HEIGHT },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        footers: { default: pageFooter() },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
