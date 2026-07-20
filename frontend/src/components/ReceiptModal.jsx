import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { printReceiptToBoth } from "../utils/printReceipt";
import LogoImage from "../upload/logo.png";
import API_BASE_URL from "../api.js";

const exportToPDF = () => {
  const input = document.getElementById("receipt-content");

  if (!input) {
    alert("Receipt not found");
    return;
  }

  html2canvas(input).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("receipt.pdf");
  });
};

const ReceiptModal = ({ order, onClose }) => {
  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "OAK & IVORY RESTAURANT",
    address: "No: 5/B/C, Ja- Ela Road, Gampaha.",
    phone: "071 1635912",
    logo: ""
  });

  useEffect(() => {
    const fetchRestaurantSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/auth/settings/restaurant`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setRestaurantDetails({
            name: res.data.name || "OAK & IVORY RESTAURANT",
            address: res.data.address || "No: 5/B/C, Ja- Ela Road, Gampaha.",
            phone: res.data.phone || "071 1635912",
            logo: res.data.logo || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch restaurant settings in modal:", err);
      }
    };
    fetchRestaurantSettings();
  }, []);

  if (!order) return null;

  const symbol = localStorage.getItem("currencySymbol") || "$";

  const {
    customerName,
    customerPhone,
    tableNo,
    items,
    totalPrice
  } = order;

  const getAbsoluteLogo = (logo) => {
    if (!logo || typeof logo !== "string") return "";
    if (logo.startsWith("data:") || logo.startsWith("http://") || logo.startsWith("https://")) {
      return logo;
    }
    return window.location.origin + logo;
  };

  const logoSrc = getAbsoluteLogo(restaurantDetails.logo) || getAbsoluteLogo(LogoImage);


  // Inside ReceiptModal component
  const generatePrintableHTML = () => {
    const symbol = localStorage.getItem("currencySymbol") || "$";
    const now = new Date().toLocaleString();

    // Build items rows
    const itemsRows = order.items.map((item, idx) => `
      <tr key="${idx}">
        <td style="padding:4px 0;width:50%;text-align:left;">${item.name}</td>
        <td style="padding:4px 0;width:20%;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 0;width:30%;text-align:right;">${symbol}${(item.price || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    let serviceChargeRow = '';
    if (order.serviceCharge > 0) {
      const pct = order.subtotal ? ((order.serviceCharge * 100) / order.subtotal).toFixed(2) : '0.00';
      serviceChargeRow = `
        <tr>
          <td style="padding:4px 0;text-align:left;">Service Charge (${pct}%)</td>
          <td></td>
          <td style="padding:4px 0;text-align:right;">${symbol}${order.serviceCharge.toFixed(2)}</td>
        </tr>
      `;
    }

    let deliveryChargeRow = '';
    if (order.deliveryCharge > 0) {
      deliveryChargeRow = `
        <tr>
          <td style="padding:4px 0;text-align:left;">Delivery Charge</td>
          <td></td>
          <td style="padding:4px 0;text-align:right;">${symbol}${order.deliveryCharge.toFixed(2)}</td>
        </tr>
      `;
    }

    let paymentSection = '';
    if (order.payment) {
      const p = order.payment;
      let lines = '';
      if (p.cash > 0) lines += `<p class="mb-1">Cash: ${symbol}${p.cash.toFixed(2)}</p>`;
      if (p.card > 0) lines += `<p class="mb-1">Card: ${symbol}${p.card.toFixed(2)}</p>`;
      if (p.bankTransfer > 0) lines += `<p class="mb-1">Bank Transfer: ${symbol}${p.bankTransfer.toFixed(2)}</p>`;
      
      paymentSection = `
        <div class="mb-1">
          <p class="mb-1"><strong>Paid via:</strong></p>
          ${lines}
          <p class="mb-1"><strong>Total Paid:</strong> ${symbol}${(p.totalPaid || 0).toFixed(2)}</p>
          <p class="mb-1"><strong>Change Due:</strong> ${symbol}${(p.changeDue || 0).toFixed(2)}</p>
        </div>
      `;
    }

    let deliveryNoteSection = '';
    if (order.deliveryCharge > 0 && order.deliveryNote) {
      deliveryNoteSection = `<p><strong>Delivery Note:</strong><br>${order.deliveryNote}</p>`;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt</title>
          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
              width: 275px;
              margin: 0;
              padding: 7.5px;
              background: #fff;
              color: #000;
              line-height: 1.4;
              box-sizing: border-box;
            }
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0 16px;
            }
            th, td {
              padding: 4px 0;
            }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            .mb-1 { margin-bottom: 4px; }
            h3, h4, h5 { margin: 6px 0; }
            p { margin: 4px 0; }
          </style>
        </head>
        <body>
        <!-- Logo Section -->
        <div class="text-center mb-2">
          ${logoSrc ? `<img src="${logoSrc}" alt="Logo" style="width:80px; height:80px; border-radius:40px; display:inline-block;" />` : ''}
        </div>
        
        <h3 class="text-center" style="font-size:20px; font-weight:bold; margin:6px 0;">${restaurantDetails.name}</h3>
        <p class="text-center" style="font-size:12px; margin:4px 0;">${restaurantDetails.address}</p>
        <p class="text-center" style="font-size:15px; font-weight:bold; margin:4px 0 12px 0;">${restaurantDetails.phone}</p>
        
        <hr />

        <!-- Invoice Details Table (Robust replacement for display:flex) -->
        <table style="width:100%; border-collapse:collapse; font-size:14px; margin:8px 0;">
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Invoice No:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.invoiceNo || 'N/A'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Date:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${now}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Customer:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.customerName || 'Walk-in'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Phone:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.customerPhone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Order Type:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.tableNo > 0 ? `Dine In - Table ${order.tableNo}` : `Takeaway ( ${order.deliveryType} )`}</td>
          </tr>
          ${order.tableNo === "Takeaway" && order.deliveryType === "Delivery Service" ? `
          <tr>
            <td style="width:95px; font-weight:bold; padding:2px 0; text-align:left; vertical-align:top;">Delivery Place:</td>
            <td style="padding:2px 0; text-align:left; vertical-align:top;">${order.deliveryPlaceName}</td>
          </tr>` : ''}
        </table>

        <hr />

        <table style="width:100%; border-collapse:collapse; font-size:14px; margin:8px 0 16px 0;">
          <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid #000; padding:4px 0;">Items</th>
              <th style="text-align:center; border-bottom:1px solid #000; padding:4px 0;">Qty</th>
              <th style="text-align:right; border-bottom:1px solid #000; padding:4px 0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            ${serviceChargeRow}
            ${deliveryChargeRow}
          </tbody>
        </table>

        <hr />

        <table style="width:100%; border-collapse:collapse; font-size:15px; margin-top:4px;">
          <tr>
            <td style="text-align:left; font-weight:bold; padding:4px 0;">Total:</td>
            <td style="text-align:right; font-weight:bold; padding:4px 0;">${symbol}${(order.totalPrice || 0).toFixed(2)}</td>
          </tr>
        </table>

        ${paymentSection ? `<hr />${paymentSection}` : ''}

        <hr />
        <p class="text-center" style="font-size:15px; font-weight:bold; margin:8px 0 4px 0;">Thank you for your order!</p>
        <p class="text-center" style="font-size:12px; margin:2px 0; color:#555;">Software By: Raxwo (Pvt) Ltd.</p>
        <p class="text-center" style="font-size:12px; margin:2px 0; color:#555;">Contact: 074 357 3333</p>
        <hr />

        ${deliveryNoteSection}
        </body>
      </html>
    `;
  };

  return (
    <div
      className="receipt-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: "#f8f9fa",
        width: "100%",
        height: "100%",
        overflowY: "auto",
        padding: "30px"
      }}
    >
      {/* Controls */}
      <div className="text-center mb-4 d-print-none">
        <button onClick={onClose} className="btn btn-secondary me-2">
          Close
        </button>
        <button onClick={exportToPDF} className="btn btn-primary me-2">
          📄 Export PDF
        </button>
        <button
          className="btn btn-success"
          // onClick={() => window.print()}
          onClick={() => {
            // const content = document.getElementById("receipt-content").innerHTML;
            const fullHTML = generatePrintableHTML();
            printReceiptToBoth(fullHTML);
          }}
        >
          🖨️ Print Receipt
        </button>
      </div>

      {/* Receipt Content */}
      <div
        id="receipt-content"
        style={{
          maxWidth: "283px",
          margin: "auto",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "7.5px",
          lineHeight: 1.4,
          fontFamily: "Calibri, sans-serif", // ✅ Set Calibri font globally
          boxShadow: "0 0 10px rgba(0,0,0,0.15)"
        }}
      >
        {/* Logo Section */}
        <div className="text-center mb-2">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Logo"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '40px',
                display: 'inline-block',
                objectFit: 'cover'
              }}
            />
          ) : null}
        </div>
        <h3 className="mb-1 fs-4" style={{ textAlign: "center" }}><strong>{restaurantDetails.name}</strong></h3>
        <p className="mb-0" style={{ textAlign: "center", fontSize: "13px" }}>{restaurantDetails.address}</p>
        <p className="mb-3" style={{ textAlign: "center", fontSize: "14px" }}><strong>{restaurantDetails.phone}</strong></p>
        <hr style={{ margin: "10px 4px" }}/>

        {/* Invoice Details Table (Robust replacement for display:flex) */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", margin: "8px 0", lineHeight: "1.4" }}>
          <tbody>
            <tr>
              <td style={{ width: "95px", fontWeight: "bold", padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>Invoice No:</td>
              <td style={{ padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>{order.invoiceNo || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ width: "95px", fontWeight: "bold", padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>Date:</td>
              <td style={{ padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>{new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ width: "95px", fontWeight: "bold", padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>Customer:</td>
              <td style={{ padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>{customerName || 'Walk-in'}</td>
            </tr>
            <tr>
              <td style={{ width: "95px", fontWeight: "bold", padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>Phone:</td>
              <td style={{ padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>{customerPhone || 'N/A'}</td>
            </tr>
            <tr>
              <td style={{ width: "95px", fontWeight: "bold", padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>Order Type:</td>
              <td style={{ padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>{tableNo > 0 ? `Dine In - Table ${tableNo}` : `Takeaway ( ${order.deliveryType} )`}</td>
            </tr>
            {tableNo === "Takeaway" && order.deliveryType === "Delivery Service" && (
              <tr>
                <td style={{ width: "95px", fontWeight: "bold", padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>Delivery Place:</td>
                <td style={{ padding: "2px 0", textAlign: "left", verticalAlign: "top" }}>{order.deliveryPlaceName}</td>
              </tr>
            )}
          </tbody>
        </table>

        <hr style={{ margin: "10px 4px" }}/>

        {/* <ul className="mb-3" style={{ listStyle: "none", padding: 0 }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: "6px" }} className="list-group-item d-flex justify-content-between">
              <span>{item.name} x {item.quantity} </span>              
              <span className="text-end">{symbol}{item.price?.toFixed(2)}</span>
            </li>
          ))}
          {order.serviceCharge > 0 && (
            <li className="list-group-item d-flex justify-content-between">
              <span>Service Charge ({order.serviceCharge * 100 / order.subtotal?.toFixed(2) || 0}%)</span>
              <span className="text-end">{symbol}{order.serviceCharge?.toFixed(2)}</span>
              
            </li>
          )}

          {order.deliveryCharge > 0 && (
            <li className="list-group-item d-flex justify-content-between">
              <span>Delivery Charge </span>
              <span className="text-end">{symbol}{order.deliveryCharge?.toFixed(2)}</span>
            </li>
          )}
        </ul> */}

        {/* ✅ Replaced list with table for cleaner, aligned display */}
        <table style={{ width: "100%", borderCollapse: "collapse", paddingTop: "0px", paddingBottom:"0px", fontSize: "15px"  }}>
          <thead>
              <th style={{ padding: "4px 0", width: "50%", textAlign: "left" }}> Items</th>
              <th style={{ padding: "4px 0", width: "20%", textAlign: "center" }}> Qty</th>
              <th style={{ padding: "4px 0", width: "30%", textAlign: "right" }}> Amount</th>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: "4px 0", width: "50%", textAlign: "left" }}>
                  {item.name}
                </td>
                <td style={{ padding: "4px 0", width: "20%", textAlign: "center" }}>
                  {item.quantity}
                </td>
                <td style={{ padding: "4px 0", width: "30%", textAlign: "right" }}>
                  {symbol}{item.price?.toFixed(2)}
                </td>
              </tr>
            ))}

            {order.serviceCharge > 0 && (
              <tr>
                <td style={{ padding: "4px 0", textAlign: "left" }}>
                  Service Charge ({((order.serviceCharge * 100) / (order.subtotal || 1)).toFixed(2)}%)
                </td>
                <td></td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {symbol}{order.serviceCharge?.toFixed(2)}
                </td>
              </tr>
            )}

            {order.deliveryCharge > 0 && (
              <tr>
                <td style={{ padding: "4px 0", textAlign: "left" }}>
                  Delivery Charge
                </td>
                <td></td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {symbol}{order.deliveryCharge?.toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <hr style={{ margin: "10px 4px" }}/>
        <h5 className="text-end fs-6 mb-1">Total: {symbol}{totalPrice?.toFixed(2)}</h5>

        {/* {order.payment && (
          <div className="mb-1">
            <p className="mb-1"><strong>Paid via:</strong></p>
            {order.payment.cash > 0 && <p className="mb-1">Cash: {symbol}{order.payment.cash.toFixed(2)}</p>}
            {order.payment.card > 0 && <p className="mb-1">Card: {symbol}{order.payment.card.toFixed(2)}</p>}
            {order.payment.bankTransfer > 0 && (
              <p className="mb-1">Bank Transfer: {symbol}{order.payment.bankTransfer.toFixed(2)}</p>
            )}
            <p className="mb-1"><strong>Total Paid:</strong> {symbol}{order.payment.totalPaid.toFixed(2)}</p>
            <p className="mb-1"><strong>Change Due:</strong> {symbol}{order.payment.changeDue.toFixed(2)}</p>
          </div>
        )} */}
        <hr style={{ margin: "10px 4px" }}/>
        <p className="text-center mb-1 fw-bold" style={{ fontSize: "16px" }}> Thank you for your order! </p>
        <p className="text-center  mb-1" style={{ fontSize: "13px" }}>Software By: Raxwo (Pvt) Ltd.</p>
        <p className="text-center  mb-1 " style={{ fontSize: "13px" }}>Contact: 074 357 3333</p>
        <hr style={{ margin: "10px 4px" }}/>
        {order.deliveryCharge > 0 && order.deliveryNote?.trim() && (
          <p>
            <p>
              <strong>Delivery Note :</strong>
            </p>
            <span >{order.deliveryNote}</span>
          </p>
        )}
      </div>

      {/* Hide everything except receipt when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;
