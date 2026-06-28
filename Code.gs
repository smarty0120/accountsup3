/**
 * Google Apps Script - Lead Capture System for Accountsup.com
 * 
 * Instructions:
 * 1. Open Google Sheets (create a new spreadsheet or open an existing one).
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. Update the CONFIG object below with your preferred recipient email.
 * 5. Click Save (disk icon).
 * 6. Click "Deploy" -> "New deployment".
 * 7. Choose type: "Web app".
 * 8. Set Configuration:
 *    - Description: Accountsup Lead Capture API
 *    - Execute as: "Me" (your-email@gmail.com)
 *    - Who has access: "Anyone" (crucial for public submissions to succeed)
 * 9. Click "Deploy" and authorize the permissions.
 * 10. Copy the Web App URL and paste it in `js/form-handler.js`.
 */

// Configuration Options
const CONFIG = {
  // Email address to send lead notifications. If left blank, notifications
  // are sent to the owner of this script (the one deploying the web app).
  NOTIFICATION_EMAIL: "", 

  // Specific Google Spreadsheet ID. If left blank, the script binds to 
  // the active spreadsheet where the script editor is running.
  SPREADSHEET_ID: "" 
};

/**
 * Handle POST request from client forms.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received in post body.");
    }

    // Parse incoming payload
    const data = JSON.parse(e.postData.contents);
    const formType = data.formType; // Expected to be 'contact' or 'consultation'
    
    if (!formType) {
      throw new Error("Missing 'formType' identifier in payload.");
    }

    // Connect to Google Spreadsheet
    let ss;
    if (CONFIG.SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      throw new Error("Spreadsheet context not found. Please bind this script to a Google Sheet or configure SPREADSHEET_ID.");
    }

    const timestamp = new Date();
    let sheetName = "";
    let headers = [];
    let rowData = [];
    let emailSubject = "";
    let emailHtml = "";

    // Process based on form type
    if (formType === "contact") {
      sheetName = "Contact Submissions";
      headers = ["Timestamp", "Name", "Email", "Subject", "Message"];
      rowData = [
        timestamp,
        data.name || "",
        data.email || "",
        data.subject || "",
        data.message || ""
      ];
      
      const cleanName = data.name ? data.name.trim() : "Anonymous";
      emailSubject = `New New Contact Form: ${cleanName}`;
      emailHtml = generateContactEmailHtml(data, timestamp);

    } else if (formType === "consultation") {
      sheetName = "Consultation Submissions";
      headers = [
        "Timestamp",
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Company",
        "Jurisdiction",
        "Company Size",
        "Service Interest",
        "Preferred Time",
        "Message"
      ];
      rowData = [
        timestamp,
        data.firstName || "",
        data.lastName || "",
        data.email || "",
        data.phone || "",
        data.company || "",
        data.country || "",
        data.companySize || "",
        data.serviceInterest || "",
        data.preferredTime || "",
        data.message || ""
      ];
      
      const cleanFirstName = data.firstName ? data.firstName.trim() : "";
      const cleanLastName = data.lastName ? data.lastName.trim() : "";
      const fullName = `${cleanFirstName} ${cleanLastName}`.trim() || "Anonymous";
      const companyInfo = data.company ? ` (${data.company.trim()})` : "";
      
      emailSubject = `New New Consultation Request: ${fullName}${companyInfo}`;
      emailHtml = generateConsultationEmailHtml(data, timestamp);

    } else {
      throw new Error(`Unsupported formType: ${formType}`);
    }

    // Get existing sheet tab or create it if missing
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      
      // Style headers: Bold text, light grey background, centered, frozen row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f4f6");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // Append raw submission row
    sheet.appendRow(rowData);
    
    // Auto-fit columns to content size for nice display
    sheet.autoResizeColumns(1, headers.length);

    // Send email notification via Google Apps Script MailApp service
    const recipient = CONFIG.NOTIFICATION_EMAIL || Session.getEffectiveUser().getEmail();
    if (recipient) {
      MailApp.sendEmail({
        to: recipient,
        subject: emailSubject,
        htmlBody: emailHtml
      });
    }

    // Return success response to the client
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Lead processed and saved successfully."
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("doPost Error:", error);
    // Return error status to the client
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Visual styling layout helpers for Gmail Notifications
 */
function getEmailBaseStyles() {
  return `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #333333;
    line-height: 1.6;
    background-color: #f7f9fc;
    margin: 0;
    padding: 30px;
  `;
}

function getEmailHeaderBlock(title) {
  return `
    <div style="background-color: #0A192F; border-bottom: 3px solid #D4AF37; padding: 25px 30px; border-radius: 6px 6px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
        Accountsup<span style="color: #D4AF37;">.com</span>
      </h1>
      <p style="color: #a8b2c4; margin: 5px 0 0 0; font-size: 13px;">${title}</p>
    </div>
  `;
}

function getEmailTableStyle() {
  return `
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    background-color: #ffffff;
  `;
}

function getEmailTableRow(label, value) {
  return `
    <tr>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; font-weight: bold; color: #4a5568; width: 30%; vertical-align: top;">
        ${label}
      </td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #2d3748; width: 70%; white-space: pre-line; vertical-align: top;">
        ${value ? value.trim() : "<em>Not Provided</em>"}
      </td>
    </tr>
  `;
}

/**
 * Generate Contact Form Submission HTML
 */
function generateContactEmailHtml(data, timestamp) {
  return `
    <div style="${getEmailBaseStyles()}">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
        ${getEmailHeaderBlock("New General Enquiry Submission")}
        <div style="padding: 30px;">
          <h2 style="font-size: 18px; margin-top: 0; margin-bottom: 20px; color: #0A192F;">Lead Details</h2>
          <table style="${getEmailTableStyle()}">
            ${getEmailTableRow("Submission Date", timestamp.toLocaleString())}
            ${getEmailTableRow("Full Name", data.name)}
            ${getEmailTableRow("Email Address", `<a href="mailto:${data.email}" style="color: #D4AF37; text-decoration: none; font-weight: 600;">${data.email}</a>`)}
            ${getEmailTableRow("Subject Option", getSubjectLabel(data.subject))}
            ${getEmailTableRow("Detailed Message", data.message)}
          </table>
          <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p style="font-size: 11px; color: #a0aec0; margin: 0;">This email was generated automatically by the Accountsup.com integration.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate Consultation Form Submission HTML
 */
function generateConsultationEmailHtml(data, timestamp) {
  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Anonymous";
  return `
    <div style="${getEmailBaseStyles()}">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
        ${getEmailHeaderBlock("New Consultation Request")}
        <div style="padding: 30px;">
          <h2 style="font-size: 18px; margin-top: 0; margin-bottom: 20px; color: #0A192F;">Lead & Booking Details</h2>
          <table style="${getEmailTableStyle()}">
            ${getEmailTableRow("Submission Date", timestamp.toLocaleString())}
            ${getEmailTableRow("Full Name", fullName)}
            ${getEmailTableRow("Business Email", `<a href="mailto:${data.email}" style="color: #D4AF37; text-decoration: none; font-weight: 600;">${data.email}</a>`)}
            ${getEmailTableRow("Phone Number", data.phone)}
            ${getEmailTableRow("Company Name", data.company)}
            ${getEmailTableRow("Primary Jurisdiction", getJurisdictionLabel(data.country))}
            ${getEmailTableRow("Company Size", getCompanySizeLabel(data.companySize))}
            ${getEmailTableRow("Service Interest", getServiceLabel(data.serviceInterest))}
            ${getEmailTableRow("Preferred Time Slot", getPreferredTimeLabel(data.preferredTime))}
            ${getEmailTableRow("Additional Context", data.message)}
          </table>
          <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p style="font-size: 11px; color: #a0aec0; margin: 0;">This email was generated automatically by the Accountsup.com integration.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Format helper for Subject codes
 */
function getSubjectLabel(subject) {
  const mapping = {
    "pricing": "Pricing & Packages",
    "services": "Services Information",
    "technical": "Technical / Platform Support",
    "partnership": "Partnership & Referrals",
    "billing": "Billing & Invoicing",
    "other": "Other"
  };
  return mapping[subject] || subject || "Not Specified";
}

/**
 * Format helper for Country/Jurisdiction codes
 */
function getJurisdictionLabel(country) {
  const mapping = {
    "us": "United States",
    "ca": "Canada",
    "both": "Both US & Canada"
  };
  return mapping[country] || country || "Not Specified";
}

/**
 * Format helper for Company Size codes
 */
function getCompanySizeLabel(size) {
  const mapping = {
    "1-10": "1-10 employees",
    "11-50": "11-50 employees",
    "51-200": "51-200 employees",
    "201-500": "201-500 employees",
    "500+": "500+ employees"
  };
  return mapping[size] || size || "Not Specified";
}

/**
 * Format helper for Service Interest codes
 */
function getServiceLabel(interest) {
  const mapping = {
    "bookkeeping": "End-to-End Bookkeeping",
    "payroll": "Managed Payroll Accounting",
    "tax": "Cross-Border Tax Filing & Compliance",
    "full": "Full financial operations Suite"
  };
  return mapping[interest] || interest || "Not Specified";
}

/**
 * Format helper for Preferred Time codes
 */
function getPreferredTimeLabel(time) {
  const mapping = {
    "morning": "Morning (8:00 AM - 12:00 PM ET)",
    "afternoon": "Afternoon (12:00 PM - 4:00 PM ET)",
    "late": "Late Afternoon (4:00 PM - 6:00 PM ET)"
  };
  return mapping[time] || time || "Not Specified";
}
