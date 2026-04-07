export type Tool = "select" | "text" | "draw" | "highlight" | "form" | "fill" | "eraser";
export type FormFieldType = "text" | "checkbox" | "dropdown" | "date" | "signature";

export interface Point {
  x: number;
  y: number;
}

interface BaseAnnotation {
  id: string;
  pageIndex: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  position: Point;
  content: string;
  fontSize: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
  fontFamily?: string;
}

export interface DrawAnnotation extends BaseAnnotation {
  type: "draw";
  points: Point[];
  color: string;
  lineWidth: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
  position: Point;
  size: { width: number; height: number };
  color: string;
  opacity: number;
}

export interface FormAnnotation extends BaseAnnotation {
  type: "form";
  fieldType: FormFieldType;
  position: Point;
  size: { width: number; height: number };
  label: string;
  value: string;
  options?: string[];
  checked?: boolean;
}

export type Annotation =
  | TextAnnotation
  | DrawAnnotation
  | HighlightAnnotation
  | FormAnnotation;
