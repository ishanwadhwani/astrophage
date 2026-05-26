import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { Invoice } from "@/types/invoice";
import { numberToWords } from "@/lib/numberToWords";

// ─── Styles ───────────────────────────────────────────────

const C = {
  primary: "#2563EB",
  dark: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  overdue: "#DC2626",
  success: "#16A34A",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.dark,
    backgroundColor: C.white,
    padding: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  businessName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 3,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 10,
    color: C.body,
    marginTop: 4,
  },

  // Info grid
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 4,
  },
  infoBoxBorder: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  infoName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 8,
    color: C.body,
    lineHeight: 1.5,
  },
  infoMeta: {
    fontSize: 8,
    color: C.muted,
  },

  // Dates row
  datesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dateBox: {
    flex: 1,
    padding: 8,
    backgroundColor: C.bg,
    borderRadius: 4,
  },
  dateLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },

  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.primary,
    padding: "7 10",
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "6 10",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "6 10",
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdText: {
    fontSize: 8,
    color: C.body,
  },
  tdBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },

  // Column widths
  colDesc: { flex: 3 },
  colHsn: { flex: 1.5 },
  colQty: { flex: 0.8, textAlign: "right" },
  colRate: { flex: 1.2, textAlign: "right" },
  colGst: { flex: 0.8, textAlign: "right" },
  colTax: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },

  // Totals
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  totalLabel: {
    fontSize: 8,
    color: C.muted,
  },
  totalValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    backgroundColor: C.primary,
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  grandTotalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },

  // Words
  wordsBox: {
    backgroundColor: C.bg,
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  wordsLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  wordsText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },

  // Bank + Footer
  bottomRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  bankBox: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 10,
    borderRadius: 4,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bankKey: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    width: 80,
  },
  bankVal: {
    fontSize: 7,
    color: C.dark,
    flex: 1,
  },
  signatureBox: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  signatureLabel: {
    fontSize: 7,
    color: C.muted,
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 4,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
    fontStyle: "italic",
  },
  gstBadge: {
    backgroundColor: C.primary,
    color: C.white,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    padding: "2 6",
    borderRadius: 3,
  },
});

// ─── Helpers ──────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtAmt = (n: number) =>
  "₹" +
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Component ────────────────────────────────────────────

export function InvoicePDF({ invoice }: { invoice: Invoice }) {
  const isIGST = invoice.taxType === "IGST";
  const taxColLabel = isIGST ? "IGST" : "CGST / SGST";

  return (
    <Document
      title={`Invoice-${invoice.number}`}
      author={invoice.business.name}
      subject="Tax Invoice"
    >
      <Page size="A4" style={s.page}>
        {/* ── Header ──────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.businessName}>{invoice.business.name}</Text>
            {invoice.business.address && (
              <Text style={s.infoText}>
                {[
                  invoice.business.address,
                  invoice.business.city,
                  invoice.business.state,
                  invoice.business.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
            {invoice.business.gstin && (
              <Text style={s.infoMeta}>GSTIN {invoice.business.gstin}</Text>
            )}
            {invoice.business.pan && (
              <Text style={s.infoMeta}>PAN {invoice.business.pan}</Text>
            )}
          </View>

          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <Text style={s.invoiceNumber}>#{invoice.number}</Text>
            {invoice.isGstInvoice && (
              <Text style={s.gstBadge}>TAX INVOICE</Text>
            )}
          </View>
        </View>

        {/* ── Dates ───────────────────────────────── */}
        <View style={s.datesRow}>
          <View style={s.dateBox}>
            <Text style={s.dateLabel}>Invoice Date</Text>
            <Text style={s.dateValue}>{fmtDate(invoice.invoiceDate)}</Text>
          </View>
          <View style={s.dateBox}>
            <Text style={s.dateLabel}>Due Date</Text>
            <Text style={s.dateValue}>{fmtDate(invoice.dueDate)}</Text>
          </View>
          <View style={s.dateBox}>
            <Text style={s.dateLabel}>Place of Supply</Text>
            <Text style={s.dateValue}>{invoice.placeOfSupply}</Text>
          </View>
          <View style={s.dateBox}>
            <Text style={s.dateLabel}>Tax Type</Text>
            <Text style={s.dateValue}>{isIGST ? "IGST" : "CGST + SGST"}</Text>
          </View>
        </View>

        {/* ── From / Billed To ────────────────────── */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>From</Text>
            <Text style={s.infoName}>{invoice.business.name}</Text>
            {invoice.business.gstin && (
              <Text style={s.infoText}>GSTIN: {invoice.business.gstin}</Text>
            )}
            {invoice.business.pan && (
              <Text style={s.infoText}>PAN: {invoice.business.pan}</Text>
            )}
            {invoice.business.email && (
              <Text style={s.infoText}>{invoice.business.email}</Text>
            )}
          </View>

          <View style={s.infoBoxBorder}>
            <Text style={s.infoLabel}>Billed To</Text>
            <Text style={s.infoName}>{invoice.client.name}</Text>
            {invoice.client.gstin && (
              <Text style={s.infoText}>GSTIN: {invoice.client.gstin}</Text>
            )}
            {invoice.client.pan && (
              <Text style={s.infoText}>PAN: {invoice.client.pan}</Text>
            )}
            {invoice.client.address && (
              <Text style={s.infoText}>
                {[
                  invoice.client.address,
                  invoice.client.city,
                  invoice.client.state,
                  invoice.client.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Line Items Table ─────────────────────── */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDesc]}>Description</Text>
            <Text style={[s.thText, s.colHsn]}>HSN/SAC</Text>
            <Text style={[s.thText, s.colQty]}>Qty</Text>
            <Text style={[s.thText, s.colRate]}>Rate</Text>
            <Text style={[s.thText, s.colGst]}>GST%</Text>
            <Text style={[s.thText, s.colTax]}>{taxColLabel}</Text>
            <Text style={[s.thText, s.colTotal]}>Total</Text>
          </View>

          {/* Rows */}
          {invoice.lineItems.map((item, i) => {
            const taxAmount = isIGST ? item.igst : item.cgst + item.sgst;
            const rowStyle = i % 2 === 0 ? s.tableRow : s.tableRowAlt;
            return (
              <View key={item.id} style={rowStyle}>
                <Text style={[s.tdBold, s.colDesc]}>{item.description}</Text>
                <Text style={[s.tdText, s.colHsn]}>{item.hsnSac ?? "—"}</Text>
                <Text style={[s.tdText, s.colQty]}>{item.quantity}</Text>
                <Text style={[s.tdText, s.colRate]}>{fmtAmt(item.rate)}</Text>
                <Text style={[s.tdText, s.colGst]}>{item.gstRate}%</Text>
                <Text style={[s.tdText, s.colTax]}>{fmtAmt(taxAmount)}</Text>
                <Text style={[s.tdBold, s.colTotal]}>{fmtAmt(item.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Totals ───────────────────────────────── */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{fmtAmt(invoice.subtotal)}</Text>
            </View>
            {isIGST ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>IGST</Text>
                <Text style={s.totalValue}>{fmtAmt(invoice.totalTax)}</Text>
              </View>
            ) : (
              <>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>CGST</Text>
                  <Text style={s.totalValue}>
                    {fmtAmt(invoice.totalTax / 2)}
                  </Text>
                </View>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>SGST</Text>
                  <Text style={s.totalValue}>
                    {fmtAmt(invoice.totalTax / 2)}
                  </Text>
                </View>
              </>
            )}
            <View style={s.grandTotalRow}>
              <Text style={s.grandTotalLabel}>TOTAL</Text>
              <Text style={s.grandTotalValue}>{fmtAmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Amount in words ──────────────────────── */}
        <View style={s.wordsBox}>
          <Text style={s.wordsLabel}>Amount in Words</Text>
          <Text style={s.wordsText}>{numberToWords(invoice.total)}</Text>
        </View>

        {/* ── Bank Details + Signature ─────────────── */}
        <View style={s.bottomRow}>
          {invoice.business.bankDetails && (
            <View style={s.bankBox}>
              <Text style={s.infoLabel}>Bank Details</Text>
              <View style={s.bankRow}>
                <Text style={s.bankKey}>Bank</Text>
                <Text style={s.bankVal}>
                  {invoice.business.bankDetails.bankName}
                </Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankKey}>Account Name</Text>
                <Text style={s.bankVal}>
                  {invoice.business.bankDetails.accountName}
                </Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankKey}>Account No.</Text>
                <Text style={s.bankVal}>
                  {invoice.business.bankDetails.accountNumber}
                </Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankKey}>IFSC</Text>
                <Text style={s.bankVal}>
                  {invoice.business.bankDetails.ifsc}
                </Text>
              </View>
              <View style={s.bankRow}>
                <Text style={s.bankKey}>Account Type</Text>
                <Text style={s.bankVal}>
                  {invoice.business.bankDetails.accountType}
                </Text>
              </View>
            </View>
          )}

          <View style={s.signatureBox}>
            <Text style={s.infoText}>For {invoice.business.name}</Text>
            <Text style={s.signatureLabel}>Authorised Signatory</Text>
          </View>
        </View>

        {/* ── Footer ───────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            This is an electronically generated document, no signature is
            required.
          </Text>
          <Text style={s.footerText}>
            Invoice #{invoice.number} · {invoice.business.name}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
