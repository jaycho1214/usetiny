import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { ExportSettings, PageSize, Margins } from "./store";

const pageSizeMM: Record<PageSize, [number, number]> = {
  a4: [210, 297],
  letter: [215.9, 279.4],
  legal: [215.9, 355.6],
};

const marginMM: Record<Margins, number> = {
  narrow: 12.7,
  normal: 25.4,
  wide: 38.1,
};

export async function exportPdf(
  previewElement: HTMLElement,
  settings: ExportSettings,
  filename = "document.pdf",
) {
  const [pageW, pageH] =
    settings.orientation === "landscape"
      ? [pageSizeMM[settings.pageSize][1], pageSizeMM[settings.pageSize][0]]
      : pageSizeMM[settings.pageSize];

  const margin = marginMM[settings.margins];
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  const canvas = await html2canvas(previewElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = contentW;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: settings.orientation === "landscape" ? "l" : "p",
    unit: "mm",
    format: settings.pageSize,
  });

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= contentH;

  while (heightLeft > 0) {
    pdf.addPage();
    position = margin - (imgHeight - heightLeft);
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= contentH;
  }

  pdf.save(filename);
}
