import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Annotation } from "./types";
import { toArrayBuffer } from "./utils";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export async function exportPdf(
  originalData: ArrayBuffer,
  annotations: Annotation[],
): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.load(originalData);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  for (const ann of annotations) {
    const page = pdfDoc.getPage(ann.pageIndex);
    const { width, height } = page.getSize();

    switch (ann.type) {
      case "text": {
        const color = hexToRgb(ann.color);
        const lines = ann.content.split("\n");
        const lineHeight = ann.fontSize * 1.3;
        let y = (1 - ann.position.y) * height - ann.fontSize;
        for (const line of lines) {
          try {
            page.drawText(line, {
              x: ann.position.x * width,
              y,
              size: ann.fontSize,
              font,
              color,
            });
          } catch {
            /* non-encodable chars */
          }
          y -= lineHeight;
        }
        break;
      }
      case "highlight": {
        page.drawRectangle({
          x: ann.position.x * width,
          y: (1 - ann.position.y - ann.size.height) * height,
          width: ann.size.width * width,
          height: ann.size.height * height,
          color: hexToRgb(ann.color),
          opacity: ann.opacity,
        });
        break;
      }
      case "draw": {
        const color = hexToRgb(ann.color);
        for (let i = 0; i < ann.points.length - 1; i++) {
          page.drawLine({
            start: {
              x: ann.points[i].x * width,
              y: (1 - ann.points[i].y) * height,
            },
            end: {
              x: ann.points[i + 1].x * width,
              y: (1 - ann.points[i + 1].y) * height,
            },
            thickness: ann.lineWidth,
            color,
          });
        }
        break;
      }
      case "form": {
        const fx = ann.position.x * width;
        const fy = (1 - ann.position.y - ann.size.height) * height;
        const fw = ann.size.width * width;
        const fh = ann.size.height * height;
        const name = `field_${ann.id}`;

        // Helper: setText safely — skip non-Latin chars that WinAnsi can't encode
        const safeSetText = (
          field: ReturnType<typeof form.createTextField>,
          val: string,
        ) => {
          if (!val) return;
          try {
            field.setText(val);
          } catch {
            /* non-encodable chars — field left empty */
          }
        };

        switch (ann.fieldType) {
          case "checkbox": {
            const cb = form.createCheckBox(name);
            if (ann.checked) cb.check();
            cb.addToPage(page, { x: fx, y: fy, width: fh, height: fh });
            break;
          }
          case "dropdown": {
            const dd = form.createDropdown(name);
            const opts = ann.options?.length
              ? ann.options
              : ["Option 1", "Option 2", "Option 3"];
            dd.setOptions(opts);
            try {
              if (ann.value) dd.select(ann.value);
            } catch {
              /* skip */
            }
            dd.addToPage(page, { x: fx, y: fy, width: fw, height: fh });
            break;
          }
          case "signature": {
            const sig = form.createTextField(name);
            safeSetText(sig, ann.value);
            sig.addToPage(page, {
              x: fx,
              y: fy,
              width: fw,
              height: fh,
              borderWidth: 1,
              borderColor: rgb(0.42, 0.45, 0.5),
            });
            break;
          }
          default: {
            const tf = form.createTextField(name);
            safeSetText(tf, ann.value);
            tf.addToPage(page, {
              x: fx,
              y: fy,
              width: fw,
              height: fh,
              borderWidth: 1,
              borderColor: rgb(0.23, 0.51, 0.93),
            });
            break;
          }
        }
        break;
      }
    }
  }

  return toArrayBuffer(await pdfDoc.save());
}
