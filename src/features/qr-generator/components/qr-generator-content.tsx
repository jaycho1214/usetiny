"use client";

import {
  type QRType,
  type WiFiData,
  type EmailData,
  type SMSData,
  type BitcoinData,
  defaultWifiData,
  defaultEmailData,
  defaultSmsData,
  defaultBitcoinData,
  generateQRValue,
} from "../utils";
import { useIsMac, useKeyboardShortcuts } from "./keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Download,
  Copy,
  Keyboard,
  Type,
  Link,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Bitcoin,
  ChevronDown,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NextLink from "next/link";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

const qrTypes: { value: QRType; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { value: "url", label: "URL", icon: <Link className="h-4 w-4" /> },
  { value: "wifi", label: "WiFi", icon: <Wifi className="h-4 w-4" /> },
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { value: "phone", label: "Phone", icon: <Phone className="h-4 w-4" /> },
  { value: "sms", label: "SMS", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "bitcoin", label: "Bitcoin", icon: <Bitcoin className="h-4 w-4" /> },
];

export default function QRGeneratorContent({
  initialType = "text",
}: {
  initialType?: QRType;
}) {
  const router = useRouter();
  const [qrType, setQRTypeState] = useState<QRType>(initialType);
  const setQRType = useCallback(
    (type: QRType) => {
      setQRTypeState(type);
      router.replace(type === "text" ? "/qr" : `/qr/${type}`, {
        scroll: false,
      });
    },
    [router],
  );
  const [textValue, setTextValue] = useState("");
  const [wifiData, setWifiData] = useState<WiFiData>(defaultWifiData);
  const [emailData, setEmailData] = useState<EmailData>(defaultEmailData);
  const [smsData, setSmsData] = useState<SMSData>(defaultSmsData);
  const [bitcoinData, setBitcoinData] =
    useState<BitcoinData>(defaultBitcoinData);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const isMac = useIsMac();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const qrRef = useRef<HTMLDivElement | null>(null);

  const qrValue = generateQRValue(
    qrType,
    textValue,
    wifiData,
    emailData,
    smsData,
    bitcoinData,
  );

  const handleDownload = useCallback(() => {
    if (!qrValue) {
      toast.error("Enter data to generate QR code");
      return;
    }

    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `qr-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast.success("QR code downloaded");
  }, [qrValue]);

  const handleCopy = useCallback(async () => {
    if (!qrValue) {
      toast.error("Enter data to generate QR code");
      return;
    }

    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/png");
      });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("QR code copied to clipboard");
    } catch {
      toast.error("Failed to copy QR code");
    }
  }, [qrValue]);

  const handleShowShortcuts = useCallback(() => {
    setShowShortcuts(true);
  }, []);

  const handleClear = useCallback(() => {
    switch (qrType) {
      case "text":
      case "url":
      case "phone":
        setTextValue("");
        break;
      case "wifi":
        setWifiData(defaultWifiData);
        break;
      case "email":
        setEmailData(defaultEmailData);
        break;
      case "sms":
        setSmsData(defaultSmsData);
        break;
      case "bitcoin":
        setBitcoinData(defaultBitcoinData);
        break;
    }
  }, [qrType]);

  useKeyboardShortcuts(
    inputRef,
    handleDownload,
    handleCopy,
    handleShowShortcuts,
    setQRType,
    handleClear,
  );

  const currentType = qrTypes.find((t) => t.value === qrType);

  const typeSelector = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          {currentType?.icon}
          {currentType?.label}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {qrTypes.map((type, index) => (
          <DropdownMenuItem
            key={type.value}
            onClick={() => setQRType(type.value)}
            className="gap-2"
          >
            {type.icon}
            {type.label}
            <KbdGroup className="ml-auto">
              <Kbd className="text-[10px]">{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd className="text-[10px]">{index + 1}</Kbd>
            </KbdGroup>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderInputs = () => {
    switch (qrType) {
      case "text":
      case "url":
      case "phone":
        return (
          <ButtonGroup className="w-full">
            {typeSelector}
            <Input
              ref={inputRef}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={
                qrType === "url"
                  ? "https://example.com"
                  : qrType === "phone"
                    ? "+1234567890"
                    : "Enter text..."
              }
              autoFocus
            />
          </ButtonGroup>
        );

      case "wifi":
        return (
          <div className="space-y-3 w-full">
            <ButtonGroup className="w-full">
              {typeSelector}
              <Input
                ref={inputRef}
                value={wifiData.ssid}
                onChange={(e) =>
                  setWifiData({ ...wifiData, ssid: e.target.value })
                }
                placeholder="Network Name (SSID)"
                autoFocus
              />
            </ButtonGroup>
            <Input
              type="password"
              value={wifiData.password}
              onChange={(e) =>
                setWifiData({ ...wifiData, password: e.target.value })
              }
              placeholder="Password"
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={wifiData.encryption}
                  onValueChange={(v) =>
                    setWifiData({
                      ...wifiData,
                      encryption: v as "WPA" | "WEP" | "nopass",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={wifiData.hidden}
                  onCheckedChange={(checked) =>
                    setWifiData({ ...wifiData, hidden: checked === true })
                  }
                />
                Hidden
              </label>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-3 w-full">
            <ButtonGroup className="w-full">
              {typeSelector}
              <Input
                ref={inputRef}
                type="email"
                value={emailData.to}
                onChange={(e) =>
                  setEmailData({ ...emailData, to: e.target.value })
                }
                placeholder="email@example.com"
                autoFocus
              />
            </ButtonGroup>
            <Input
              value={emailData.subject}
              onChange={(e) =>
                setEmailData({ ...emailData, subject: e.target.value })
              }
              placeholder="Subject (optional)"
            />
            <Input
              value={emailData.body}
              onChange={(e) =>
                setEmailData({ ...emailData, body: e.target.value })
              }
              placeholder="Message (optional)"
            />
          </div>
        );

      case "sms":
        return (
          <div className="space-y-3 w-full">
            <ButtonGroup className="w-full">
              {typeSelector}
              <Input
                ref={inputRef}
                value={smsData.phone}
                onChange={(e) =>
                  setSmsData({ ...smsData, phone: e.target.value })
                }
                placeholder="+1234567890"
                autoFocus
              />
            </ButtonGroup>
            <Input
              value={smsData.message}
              onChange={(e) =>
                setSmsData({ ...smsData, message: e.target.value })
              }
              placeholder="Message (optional)"
            />
          </div>
        );

      case "bitcoin":
        return (
          <div className="space-y-3 w-full">
            <ButtonGroup className="w-full">
              {typeSelector}
              <Input
                ref={inputRef}
                value={bitcoinData.address}
                onChange={(e) =>
                  setBitcoinData({ ...bitcoinData, address: e.target.value })
                }
                placeholder="Bitcoin Address"
                autoFocus
              />
            </ButtonGroup>
            <Input
              value={bitcoinData.amount}
              onChange={(e) =>
                setBitcoinData({ ...bitcoinData, amount: e.target.value })
              }
              placeholder="Amount BTC (optional)"
            />
            <Input
              value={bitcoinData.label}
              onChange={(e) =>
                setBitcoinData({ ...bitcoinData, label: e.target.value })
              }
              placeholder="Label (optional)"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-dvh flex flex-col">
      {/* Navbar */}
      <div className="bg-background px-4 py-2 flex items-center gap-2">
        <NextLink
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </NextLink>
        <span className="text-sm text-muted-foreground">QR Generator</span>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              onClick={handleShowShortcuts}
              className="h-7 w-7"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts</TooltipContent>
        </Tooltip>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 overflow-y-auto">
        {/* Inputs */}
        <div className="w-full max-w-md">{renderInputs()}</div>

        {/* QR Code */}
        <div ref={qrRef} className="bg-white p-4 rounded-lg shadow-sm">
          {qrValue ? (
            <QRCodeCanvas value={qrValue} size={200} level="M" marginSize={1} />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Enter data to generate
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!qrValue}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
                <KbdGroup className="ml-2">
                  <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                  <Kbd>C</Kbd>
                </KbdGroup>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy QR to clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!qrValue}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
                <KbdGroup className="ml-2">
                  <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                  <Kbd>D</Kbd>
                </KbdGroup>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download QR code as PNG</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-background px-4 py-1.5 text-xs text-muted-foreground flex justify-end gap-3 border-t">
        <span>{qrValue.length} characters</span>
      </div>

      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        isMac={isMac}
      />
    </div>
  );
}
