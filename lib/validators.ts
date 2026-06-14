// PAN: 5 letters + 4 digits + 1 letter, all uppercase (e.g. ABCDE1234F)
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Aadhaar: exactly 12 digits (stored without spaces)
export const AADHAAR_REGEX = /^[0-9]{12}$/;

// Indian phone: exactly 10 digits, starts 6-9
export const PHONE_REGEX = /^[6-9][0-9]{9}$/;

// Indian phone: exactly 10 digits, starts 6-9
export const PINCODE_REGEX = /^[0-9]{6}$/;

// Email
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GSTIN: 2-digit state code + 10-char PAN + entity/Z/checksum (e.g. 09ABCDE1234F1Z5)
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const panRules = {
  pattern: {
    value: PAN_REGEX,
    message: "Enter a valid PAN number",
  },
};

export const aadhaarRules = {
  validate: (value: string) => {
    if (!value) return true;
    const digits = value.replace(/\s/g, "");
    return AADHAAR_REGEX.test(digits) || "Aadhaar must be exactly 12 digits";
  },
};

export const phoneRules = {
  pattern: {
    value: PHONE_REGEX,
    message: "Enter a valid 10-digit mobile number",
  },
};

export const pincodeRules = {
  pattern: {
    value: PINCODE_REGEX,
    message: "Enter a valid 6-digit pincode number",
  },
};

export const emailRules = {
  pattern: {
    value: EMAIL_REGEX,
    message: "Enter a valid email address",
  },
};

export const gstinRules = {
  pattern: {
    value: GSTIN_REGEX,
    message: "Enter a valid 15-character GSTIN",
  },
};

// Uppercase + strip spaces — for PAN/GSTIN inputs as the user types
export const toUpperNoSpace = (value: string) =>
  value.toUpperCase().replace(/\s/g, "");

export const formatAadhaar = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

export const stripAadhaar = (value: string) => value.replace(/\D/g, "");

export const formatPhone = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10);
