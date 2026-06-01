import QRCode from "qrcode";

export const generateUPIUrl = (
  upiId: string,
  businessName: string,
  amount: number,
  invoiceNumber: string,
): string => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: businessName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Invoice ${invoiceNumber}`,
  });
  return `upi://pay?${params.toString()}`;
};

export const generateQRDataUrl = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, {
    width: 160,
    margin: 1,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
};
