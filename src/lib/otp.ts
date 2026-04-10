/**
 * Samsung Service Mode OTP Logic
 */

// --- Java-based Logic (Legacy / Keys with letters) ---

export function makeHashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + (h << 5) + h;
    h = h | 0; // Force 32-bit signed integer
  }
  return h < 0 ? h * -1 : h;
}

export function getDateString(minutesOffset: number): string {
  const now = new Date();
  const gmtTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  gmtTime.setMinutes(gmtTime.getMinutes() - minutesOffset);

  const year = gmtTime.getFullYear() - 2000;
  const month = gmtTime.getMonth() + 1;
  const minute = gmtTime.getMinutes();
  const date = gmtTime.getDate();
  const hour = gmtTime.getHours();

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(year)}${pad(month)}${pad(minute)}${pad(date)}${pad(hour)}`;
}

// --- Python-based Logic (OneUI 8.0 / Numeric keys) ---

const SECRET_HEX = "120395F099840593405B03838449A72933484040A3034750C0403938290A293B";
const INTERVAL = 300; // 5 minutes
const CODE_DIGITS = 6;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function generateTotpNonce(counterHex: string, nonce: string): Promise<string> {
  let inputStr = "";
  if (/^\d+$/.test(nonce) && nonce.length === 6) {
    inputStr = (nonce + counterHex).padStart(22, '0');
  } else {
    inputStr = counterHex.padStart(16, '0');
  }

  const msgBytes = hexToBytes(inputStr);
  const keyBytes = hexToBytes(SECRET_HEX);

  // Use Web Crypto API for HMAC-SHA256
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
  const hmacHash = new Uint8Array(signature);

  const offset = hmacHash[hmacHash.length - 1] & 0x0F;

  const code = (
    ((hmacHash[offset] & 0x7F) << 24) |
    ((hmacHash[offset + 1] & 0xFF) << 16) |
    ((hmacHash[offset + 2] & 0xFF) << 8) |
    (hmacHash[offset + 3] & 0xFF)
  ) % Math.pow(10, CODE_DIGITS);

  return code.toString().padStart(CODE_DIGITS, '0');
}

export async function getOTP(baseKey: string): Promise<string> {
  // Check if baseKey is purely numeric
  if (/^\d+$/.test(baseKey)) {
    // Python logic for OneUI 8.0
    const nonce = baseKey.length > 2 ? baseKey.substring(2) : baseKey;
    const currentTime = Math.floor(Date.now() / 1000);
    const counter = Math.floor(currentTime / INTERVAL);
    const counterHex = counter.toString(16).toUpperCase().padStart(16, '0');
    
    return await generateTotpNonce(counterHex, nonce);
  } else {
    // Java logic for legacy
    return makeHashCode(baseKey + getDateString(4)).toString();
  }
}

export function getExpireMinutes(baseKey: string): number {
  if (/^\d+$/.test(baseKey)) {
    // Python logic interval is 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingSeconds = INTERVAL - (currentTime % INTERVAL);
    return Math.ceil(remainingSeconds / 60);
  } else {
    // Java logic
    const now = new Date();
    const gmtNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const start = new Date(gmtNow.getTime() - 4 * 60000);
    const end = new Date(start.getTime());
    end.setHours(end.getHours() + 1, 0, 0, 0);
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / 60000);
  }
}
