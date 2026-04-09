import type { ExifData } from "./types";

// piexifjs is untyped — declare minimal interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let piexif: any = null;

async function loadPiexif() {
  if (!piexif) {
    piexif = (await import("piexifjs")).default;
  }
  return piexif;
}

function arrayBufferToDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
  }
  return "data:image/jpeg;base64," + btoa(parts.join(""));
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function gpsToDecimal(ref: string, coords: [number, number][]): number | null {
  if (!coords || coords.length < 3) return null;
  const [degN, degD] = coords[0];
  const [minN, minD] = coords[1];
  const [secN, secD] = coords[2];
  const deg = degN / degD;
  const min = minN / minD;
  const sec = secN / secD;
  let decimal = deg + min / 60 + sec / 3600;
  if (ref === "S" || ref === "W") decimal = -decimal;
  return Math.round(decimal * 10000) / 10000;
}

function rationalToString(val: [number, number] | undefined): string | null {
  if (!val) return null;
  const [n, d] = val;
  if (d === 0) return null;
  return `${n / d}`;
}

export async function readExif(buffer: ArrayBuffer): Promise<ExifData | null> {
  try {
    const p = await loadPiexif();
    const dataUrl = arrayBufferToDataUrl(buffer);
    const exifObj = p.load(dataUrl);

    if (
      !exifObj ||
      (Object.keys(exifObj["0th"] || {}).length === 0 &&
        Object.keys(exifObj["Exif"] || {}).length === 0)
    ) {
      return null;
    }

    const zeroth = exifObj["0th"] || {};
    const exifIFD = exifObj["Exif"] || {};
    const gps = exifObj["GPS"] || {};

    let lat: number | null = null;
    let lng: number | null = null;
    if (gps[p.GPSIFD.GPSLatitude] && gps[p.GPSIFD.GPSLatitudeRef]) {
      lat = gpsToDecimal(
        gps[p.GPSIFD.GPSLatitudeRef],
        gps[p.GPSIFD.GPSLatitude],
      );
    }
    if (gps[p.GPSIFD.GPSLongitude] && gps[p.GPSIFD.GPSLongitudeRef]) {
      lng = gpsToDecimal(
        gps[p.GPSIFD.GPSLongitudeRef],
        gps[p.GPSIFD.GPSLongitude],
      );
    }

    const isoVal = exifIFD[p.ExifIFD.ISOSpeedRatings];
    const apertureRaw = exifIFD[p.ExifIFD.FNumber];
    const shutterRaw = exifIFD[p.ExifIFD.ExposureTime];
    const focalRaw = exifIFD[p.ExifIFD.FocalLength];

    return {
      make: zeroth[p.ImageIFD.Make] || null,
      model: zeroth[p.ImageIFD.Model] || null,
      dateTaken: exifIFD[p.ExifIFD.DateTimeOriginal] || null,
      gpsLatitude: lat,
      gpsLongitude: lng,
      width: exifIFD[p.ExifIFD.PixelXDimension] || 0,
      height: exifIFD[p.ExifIFD.PixelYDimension] || 0,
      iso: typeof isoVal === "number" ? isoVal : null,
      aperture: apertureRaw ? `f/${rationalToString(apertureRaw)}` : null,
      shutterSpeed: shutterRaw
        ? shutterRaw[0] < shutterRaw[1]
          ? `1/${Math.round(shutterRaw[1] / shutterRaw[0])}s`
          : `${shutterRaw[0] / shutterRaw[1]}s`
        : null,
      focalLength: focalRaw ? `${rationalToString(focalRaw)}mm` : null,
      copyright: zeroth[p.ImageIFD.Copyright] || null,
      orientation: zeroth[p.ImageIFD.Orientation] || null,
    };
  } catch {
    return null;
  }
}

export async function stripExifFromJpeg(
  buffer: ArrayBuffer,
  options: {
    stripAll: boolean;
    stripGps: boolean;
    stripCamera: boolean;
    keepCopyright: boolean;
  },
): Promise<ArrayBuffer> {
  try {
    const p = await loadPiexif();
    const dataUrl = arrayBufferToDataUrl(buffer);

    if (options.stripAll && !options.keepCopyright) {
      return dataUrlToArrayBuffer(p.remove(dataUrl));
    }

    const exifObj = p.load(dataUrl);

    if (options.stripAll) {
      // Keep only copyright
      const copyright = exifObj["0th"]?.[p.ImageIFD.Copyright];
      const artist = exifObj["0th"]?.[p.ImageIFD.Artist];
      const orientation = exifObj["0th"]?.[p.ImageIFD.Orientation];
      const newExif: Record<string, Record<number, unknown>> = {
        "0th": {},
        Exif: {},
        GPS: {},
        Interop: {},
        "1st": {},
      };
      if (copyright) newExif["0th"][p.ImageIFD.Copyright] = copyright;
      if (artist) newExif["0th"][p.ImageIFD.Artist] = artist;
      if (orientation) newExif["0th"][p.ImageIFD.Orientation] = orientation;
      const bytes = p.dump(newExif);
      return dataUrlToArrayBuffer(p.insert(bytes, dataUrl));
    }

    if (options.stripGps) {
      exifObj["GPS"] = {};
    }

    if (options.stripCamera) {
      delete exifObj["0th"][p.ImageIFD.Make];
      delete exifObj["0th"][p.ImageIFD.Model];
      delete exifObj["0th"][p.ImageIFD.Software];
    }

    if (!options.keepCopyright) {
      delete exifObj["0th"][p.ImageIFD.Copyright];
      delete exifObj["0th"][p.ImageIFD.Artist];
    }

    const bytes = p.dump(exifObj);
    return dataUrlToArrayBuffer(p.insert(bytes, dataUrl));
  } catch {
    return buffer;
  }
}
