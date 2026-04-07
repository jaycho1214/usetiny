"use client";

import { useCallback, useState } from "react";
import { FileUp, Lock, Shield, Zap } from "lucide-react";
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
    [onFileLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
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
    <div className="flex h-full flex-col items-center justify-center gap-12 px-6">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn("group flex w-full max-w-xl cursor-pointer flex-col items-center gap-6 rounded-2xl border-2 border-dashed p-14 transition-all duration-200", isDragging ? "scale-[1.02] border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border hover:border-primary/50 hover:bg-accent/50")}
      >
        <div
          className={cn("rounded-2xl p-5 transition-colors", isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}
        >
          <FileUp className="h-10 w-10" strokeWidth={1.5} />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Open a PDF
          </h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop a PDF file, or click to browse
          </p>
        </div>
        <Button size="lg" className="mt-2 gap-2 px-8">
          <FileUp className="h-4 w-4" />
          Choose File
        </Button>
      </div>

      {/* Features */}
      <div className="flex w-full max-w-xl items-center justify-center gap-8 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          <span>Never leaves your browser</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-blue-500" />
          <span>End-to-end private</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span>Instant processing</span>
        </div>
      </div>
    </div>
  );
}
