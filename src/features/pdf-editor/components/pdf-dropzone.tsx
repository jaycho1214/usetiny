"use client";

import { useCallback, useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onFileLoad: (data: ArrayBuffer, fileName: string) => void;
}

export function PDFDropzone({ onFileLoad }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") return;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onFileLoad(reader.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,application/pdf";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "group flex w-full max-w-md cursor-pointer flex-col items-center gap-5 rounded-lg border-2 border-dashed p-10 transition-all duration-150",
          isDragging
            ? "border-foreground/30 bg-accent"
            : "border-border hover:border-foreground/20 hover:bg-accent/50",
        )}
      >
        <FileUp
          className={cn(
            "h-8 w-8 transition-colors duration-150",
            isDragging
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground",
          )}
          strokeWidth={1.5}
        />
        <div className="space-y-1.5 text-center">
          <h2 className="text-lg font-semibold tracking-tight">Open a PDF</h2>
          <p className="text-sm text-muted-foreground">
            Drop a file here or click to browse
          </p>
        </div>
        <Button variant="outline" size="sm" className="mt-1">
          Choose File
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/50">
        Files never leave your browser
      </p>
    </div>
  );
}
