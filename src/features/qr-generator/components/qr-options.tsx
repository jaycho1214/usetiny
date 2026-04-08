"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ButtonGroup } from "@/components/ui/button-group";
import { X, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ModuleStyle = "squares" | "dots" | "fluid";
type EyeStyle = "square" | "rounded" | "circle";
type ECLevel = "L" | "M" | "Q" | "H";

export interface QROptions {
  fgColor: string;
  bgColor: string;
  ecLevel: ECLevel;
  marginSize: number;
  moduleStyle: ModuleStyle;
  eyeStyle: EyeStyle;
  logoSrc: string;
  logoSize: number;
}

export const defaultQROptions: QROptions = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  ecLevel: "M",
  marginSize: 10,
  moduleStyle: "squares",
  eyeStyle: "square",
  logoSrc: "",
  logoSize: 40,
};

export function isQRCustomized(options: QROptions): boolean {
  return (
    options.fgColor !== defaultQROptions.fgColor ||
    options.bgColor !== defaultQROptions.bgColor ||
    options.ecLevel !== defaultQROptions.ecLevel ||
    options.marginSize !== defaultQROptions.marginSize ||
    options.moduleStyle !== defaultQROptions.moduleStyle ||
    options.eyeStyle !== defaultQROptions.eyeStyle ||
    options.logoSrc !== ""
  );
}

export function eyeRadiusFromStyle(
  style: EyeStyle,
): [number, number, number, number] {
  switch (style) {
    case "rounded":
      return [8, 8, 8, 8];
    case "circle":
      return [100, 100, 100, 100];
    default:
      return [0, 0, 0, 0];
  }
}

// --- Shape icons ---

function ModuleIcon({ style }: { style: ModuleStyle }) {
  if (style === "squares") {
    return (
      <svg width={18} height={18} viewBox="0 0 18 18">
        <rect x={1} y={1} width={5} height={5} fill="currentColor" />
        <rect x={7} y={1} width={5} height={5} fill="currentColor" />
        <rect x={13} y={1} width={4} height={5} fill="currentColor" />
        <rect x={1} y={7} width={5} height={5} fill="currentColor" />
        <rect x={13} y={7} width={4} height={5} fill="currentColor" />
        <rect x={1} y={13} width={5} height={4} fill="currentColor" />
        <rect x={7} y={13} width={5} height={4} fill="currentColor" />
        <rect x={13} y={13} width={4} height={4} fill="currentColor" />
      </svg>
    );
  }
  if (style === "dots") {
    return (
      <svg width={18} height={18} viewBox="0 0 18 18">
        <circle cx={3.5} cy={3.5} r={2.5} fill="currentColor" />
        <circle cx={9} cy={3.5} r={2.5} fill="currentColor" />
        <circle cx={14.5} cy={3.5} r={2.5} fill="currentColor" />
        <circle cx={3.5} cy={9} r={2.5} fill="currentColor" />
        <circle cx={14.5} cy={9} r={2.5} fill="currentColor" />
        <circle cx={3.5} cy={14.5} r={2.5} fill="currentColor" />
        <circle cx={9} cy={14.5} r={2.5} fill="currentColor" />
        <circle cx={14.5} cy={14.5} r={2.5} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={18} height={18} viewBox="0 0 18 18">
      <rect x={1} y={1} width={11} height={5} rx={2.5} fill="currentColor" />
      <rect x={14} y={1} width={3} height={5} rx={1.5} fill="currentColor" />
      <rect x={1} y={7} width={5} height={10} rx={2.5} fill="currentColor" />
      <rect x={7} y={12} width={10} height={5} rx={2.5} fill="currentColor" />
      <rect x={14} y={7} width={3} height={4} rx={1.5} fill="currentColor" />
    </svg>
  );
}

function EyeIcon({ style }: { style: EyeStyle }) {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18">
      {style === "square" && (
        <>
          <rect
            x={1}
            y={1}
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          />
          <rect x={5.5} y={5.5} width={7} height={7} fill="currentColor" />
        </>
      )}
      {style === "rounded" && (
        <>
          <rect
            x={1}
            y={1}
            width={16}
            height={16}
            rx={4}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          />
          <rect
            x={5.5}
            y={5.5}
            width={7}
            height={7}
            rx={2}
            fill="currentColor"
          />
        </>
      )}
      {style === "circle" && (
        <>
          <circle
            cx={9}
            cy={9}
            r={7.5}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          />
          <circle cx={9} cy={9} r={3.5} fill="currentColor" />
        </>
      )}
    </svg>
  );
}

const ecLabels: { value: ECLevel; label: string }[] = [
  { value: "L", label: "Low" },
  { value: "M", label: "Med" },
  { value: "Q", label: "High" },
  { value: "H", label: "Max" },
];

// --- Validated hex input ---

const isValidHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function HexColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (v && !v.startsWith("#")) v = "#" + v;
    v = v.slice(0, 7).replace(/[^#0-9a-fA-F]/g, "");
    setDraft(v);
    if (isValidHex(v)) {
      setInvalid(false);
      onChange(v);
    } else {
      setInvalid(v.length === 7);
    }
  };

  const handleBlur = () => {
    if (!isValidHex(draft)) {
      setDraft(value);
      setInvalid(false);
    }
  };

  if (isValidHex(value) && value !== draft && !invalid) {
    setDraft(value);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1.5">
        <label
          className="relative h-8 w-8 shrink-0 rounded-md border border-border cursor-pointer overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              setDraft(v);
              setInvalid(false);
              onChange(v);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <Input
          value={draft}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "h-8 font-mono text-xs",
            invalid && "border-destructive focus-visible:ring-destructive",
          )}
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// --- Grouped toggle button ---

function OptionButton({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn("h-9", className)}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

// --- Main panel ---

interface QROptionsProps {
  options: QROptions;
  onChange: (options: QROptions) => void;
}

export function QROptionsPanel({ options, onChange }: QROptionsProps) {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const set = useCallback(
    (patch: Partial<QROptions>) => onChange({ ...options, ...patch }),
    [options, onChange],
  );

  const loadImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          set({ logoSrc: reader.result as string, ecLevel: "H" });
        }
      };
      reader.readAsDataURL(file);
    },
    [set],
  );

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadImageFile(file);
    },
    [loadImageFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadImageFile(file);
    },
    [loadImageFile],
  );

  const handleRemoveLogo = useCallback(() => {
    set({ logoSrc: "" });
    if (logoInputRef.current) logoInputRef.current.value = "";
  }, [set]);

  return (
    <div className="space-y-5">
      {/* Shape: Module */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Module</Label>
        <ButtonGroup>
          {(["squares", "dots", "fluid"] as const).map((s) => (
            <OptionButton
              key={s}
              active={options.moduleStyle === s}
              onClick={() => set({ moduleStyle: s })}
              className="flex-1 px-3"
            >
              <ModuleIcon style={s} />
            </OptionButton>
          ))}
        </ButtonGroup>
      </div>

      {/* Shape: Eye */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Eye</Label>
        <ButtonGroup>
          {(["square", "rounded", "circle"] as const).map((s) => (
            <OptionButton
              key={s}
              active={options.eyeStyle === s}
              onClick={() => set({ eyeStyle: s })}
              className="flex-1 px-3"
            >
              <EyeIcon style={s} />
            </OptionButton>
          ))}
        </ButtonGroup>
      </div>

      <Separator className="-mx-5" style={{ width: "calc(100% + 2.5rem)" }} />

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <HexColorInput
          label="Foreground"
          value={options.fgColor}
          onChange={(v) => set({ fgColor: v })}
        />
        <HexColorInput
          label="Background"
          value={options.bgColor}
          onChange={(v) => set({ bgColor: v })}
        />
      </div>

      <Separator className="-mx-5" style={{ width: "calc(100% + 2.5rem)" }} />

      {/* Scan reliability */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Scan reliability
          {options.logoSrc && (
            <span className="ml-1 opacity-50">(Max with logo)</span>
          )}
        </Label>
        <ButtonGroup>
          {ecLabels.map((ec) => (
            <OptionButton
              key={ec.value}
              active={options.ecLevel === ec.value}
              onClick={() => set({ ecLevel: ec.value })}
              className="flex-1 text-xs h-8"
            >
              {ec.label}
            </OptionButton>
          ))}
        </ButtonGroup>
      </div>

      {/* Padding */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Padding</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {options.marginSize}
          </span>
        </div>
        <Slider
          value={[options.marginSize]}
          onValueChange={([v]) => set({ marginSize: v })}
          min={0}
          max={40}
          step={5}
        />
      </div>

      <Separator className="-mx-5" style={{ width: "calc(100% + 2.5rem)" }} />

      {/* Logo */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Center logo</Label>
        {options.logoSrc ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={options.logoSrc}
              alt="Logo"
              className="h-8 w-8 rounded-md border border-border object-contain"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Size</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {options.logoSize}px
                </span>
              </div>
              <Slider
                value={[options.logoSize]}
                onValueChange={([v]) => set({ logoSize: v })}
                min={20}
                max={80}
                step={2}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleRemoveLogo}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => logoInputRef.current?.click()}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 cursor-pointer transition-colors text-xs text-muted-foreground",
              dragging
                ? "border-foreground/30 bg-accent"
                : "border-border hover:border-foreground/20 hover:bg-accent/50",
            )}
          >
            {dragging ? (
              <Upload className="h-3.5 w-3.5" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            {dragging ? "Drop image" : "Drop or click to upload"}
          </div>
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Reset */}
      {isQRCustomized(options) && (
        <>
          <Separator
            className="-mx-5"
            style={{ width: "calc(100% + 2.5rem)" }}
          />
          <Button
            variant="destructive"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              onChange(defaultQROptions);
              if (logoInputRef.current) logoInputRef.current.value = "";
            }}
          >
            Reset to defaults
          </Button>
        </>
      )}
    </div>
  );
}
