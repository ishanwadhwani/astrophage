const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertHundreds(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n] + " ";
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "") + " ";
  return (
    ones[Math.floor(n / 100)] +
    " Hundred" +
    (n % 100 ? " " + convertHundreds(n % 100) : " ")
  );
}

export function numberToWords(amount: number): string {
  const n = Math.floor(amount);
  const paise = Math.round((amount - n) * 100);

  if (n === 0) return "Zero Rupees Only";

  let result = "";

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  if (crore) result += convertHundreds(crore) + "Crore ";
  if (lakh) result += convertHundreds(lakh) + "Lakh ";
  if (thousand) result += convertHundreds(thousand) + "Thousand ";
  if (hundred) result += convertHundreds(hundred);

  result = result.trim() + " Rupees";
  if (paise) result += " and " + convertHundreds(paise).trim() + " Paise";
  result += " Only";

  return result;
}
