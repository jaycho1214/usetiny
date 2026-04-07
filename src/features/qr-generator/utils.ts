export const qrTypes = [
  "text",
  "url",
  "wifi",
  "email",
  "phone",
  "sms",
  "bitcoin",
] as const;

export type QRType = (typeof qrTypes)[number];

export interface WiFiData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export interface SMSData {
  phone: string;
  message: string;
}

export interface BitcoinData {
  address: string;
  amount: string;
  label: string;
}

export const defaultWifiData: WiFiData = {
  ssid: "",
  password: "",
  encryption: "WPA",
  hidden: false,
};

export const defaultEmailData: EmailData = {
  to: "",
  subject: "",
  body: "",
};

export const defaultSmsData: SMSData = {
  phone: "",
  message: "",
};

export const defaultBitcoinData: BitcoinData = {
  address: "",
  amount: "",
  label: "",
};

export function generateQRValue(
  qrType: QRType,
  textValue: string,
  wifiData: WiFiData,
  emailData: EmailData,
  smsData: SMSData,
  bitcoinData: BitcoinData,
): string {
  switch (qrType) {
    case "text":
    case "url":
    case "phone":
      return textValue;
    case "wifi": {
      const { ssid, password, encryption, hidden } = wifiData;
      if (!ssid) return "";
      return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
    }
    case "email": {
      const { to, subject, body } = emailData;
      if (!to) return "";
      let mailto = `mailto:${to}`;
      const params: string[] = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      if (params.length) mailto += `?${params.join("&")}`;
      return mailto;
    }
    case "sms": {
      const { phone, message } = smsData;
      if (!phone) return "";
      return message
        ? `sms:${phone}?body=${encodeURIComponent(message)}`
        : `sms:${phone}`;
    }
    case "bitcoin": {
      const { address, amount, label } = bitcoinData;
      if (!address) return "";
      let btc = `bitcoin:${address}`;
      const params: string[] = [];
      if (amount) params.push(`amount=${amount}`);
      if (label) params.push(`label=${encodeURIComponent(label)}`);
      if (params.length) btc += `?${params.join("&")}`;
      return btc;
    }
    default:
      return textValue;
  }
}
