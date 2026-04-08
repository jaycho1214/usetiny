declare module "piexifjs" {
  const piexif: {
    load(data: string): Record<string, Record<number, unknown>>;
    dump(exifObj: Record<string, Record<number, unknown>>): string;
    insert(exifStr: string, jpegData: string): string;
    remove(jpegData: string): string;
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
  };
  export default piexif;
}
