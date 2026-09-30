declare module "piexifjs" {
  type IFD = Record<number, unknown>;

  export interface ExifObject {
    "0th"?: IFD;
    Exif?: IFD;
    GPS?: IFD;
    Interop?: IFD;
    "1st"?: IFD;
    thumbnail?: string | null;
  }

  const piexif: {
    load(data: string): ExifObject;
    dump(exifObj: ExifObject): string;
    insert(exifStr: string, jpegData: string): string;
    remove(jpegData: string): string;
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
  };
  export default piexif;
}
