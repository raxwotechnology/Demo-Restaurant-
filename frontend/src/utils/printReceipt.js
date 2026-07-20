// src/utils/printReceipt.js
import { toast } from "react-toastify";

/**
 * Prints the given receiptHTML using the browser's native print engine.
 * Supports silent printing via Chrome Kiosk Mode (--kiosk-printing).
 * @param {string} receiptHTML - The HTML string to print
 */
export const printReceiptToBoth = async (receiptHTML) => {
  if (!receiptHTML || typeof receiptHTML !== "string") {
    toast.error("❌ Invalid receipt data.");
    return;
  }

  try {
    // Open a small temporary print window
    const printWindow = window.open("", "_blank", "width=300,height=600");
    if (!printWindow) {
      toast.error("❌ Popup blocked! Please allow popups for this site in your browser.");
      return;
    }

    // Write the receipt HTML content
    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Wait a brief moment to ensure the document is parsed in the new window before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);

  } catch (err) {
    console.error("Print Error:", err);
    toast.error("❌ Print failed.");
  }
};