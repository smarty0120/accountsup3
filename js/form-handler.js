/**
 * form-handler.js
 * 
 * Modular form handler for Accountsup.com
 * Handles AJAX submission to Google Apps Script Web App without page refresh.
 * Includes honeypot spam protection, duplicate submission prevention, and feedback handling.
 */

// REPLACE THIS with your deployed Google Apps Script Web App URL!
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwBOdJ9MR0dTkKPBPUgYT7Pb5-y_CtbyjvONpZKMh3rAai9IXPjYYgs5qMU6XH9Y1UF/exec";

/**
 * Submit form data to Google Apps Script Web App using fetch and async/await.
 * 
 * @param {string} formType - Identifier for the form type ('contact' or 'consultation')
 * @param {Object} data - Form field values to submit
 * @param {string} buttonId - ID of the submit button to disable/update
 * @param {string} successContainerId - ID of the success state div to reveal
 * @param {string} formId - ID of the HTML form element
 * @param {string} errorContainerId - ID of the container to display error messages
 * @param {Function} [onCompleted] - Optional callback function to execute on success
 */
async function submitForm(formType, data, buttonId, successContainerId, formId, errorContainerId, onCompleted) {
  const form = document.getElementById(formId);
  const btn = document.getElementById(buttonId);
  const errorContainer = document.getElementById(errorContainerId);
  const successContainer = document.getElementById(successContainerId);

  if (!form || !btn) {
    console.error("Required DOM elements not found for form submission.");
    return;
  }

  // 1. Double Submission Protection: prevent execution if button is already disabled
  if (btn.disabled) return;

  // Clear any previous error messages
  if (errorContainer) {
    errorContainer.classList.remove("visible");
    errorContainer.textContent = "";
  }

  // Save the original button state to restore in case of failure
  const originalHtml = btn.innerHTML;

  // 2. Disable submit button and show loading spinner UI
  btn.disabled = true;
  const loadingText = formType === "contact" ? "Sending..." : "Submitting...";
  btn.innerHTML = `
    <svg style="animation: spin 1s linear infinite; margin-right: 8px;" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg> 
    ${loadingText}
  `;

  // 3. Spam Protection: Honeypot check
  const honeypot = form.querySelector('input[name="website_honeypot"]');
  if (honeypot && honeypot.value.trim() !== "") {
    console.warn("Spam detected via honeypot. Faking successful response.");

    // Simulate natural network lag then display success state (silent drop)
    setTimeout(() => {
      form.style.display = "none";
      if (successContainer) {
        successContainer.classList.add("show");

        // Ensure success message matches the requested requirement
        const successParagraph = successContainer.querySelector("p");
        if (successParagraph) {
          successParagraph.textContent = "Thank you! Your request has been submitted successfully. We will contact you shortly.";
        }
      }
      if (onCompleted) onCompleted();
    }, 1500);
    return;
  }

  try {
    // 4. Send request via Modern fetch API with async/await
    // Note: We use 'text/plain' as Content-Type to prevent the browser from sending 
    // a CORS preflight OPTIONS request, which Google Apps Script does not support.
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        formType: formType,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP network error! Status: ${response.status}`);
    }

    const result = await response.json();

    if (result && result.status === "success") {
      // 5. Display success state and hide form
      form.style.display = "none";
      if (successContainer) {
        successContainer.classList.add("show");

        // Update success paragraph text to match requirement 7 exactly
        const successParagraph = successContainer.querySelector("p");
        if (successParagraph) {
          successParagraph.textContent = "Thank you! Your request has been submitted successfully. We will contact you shortly.";
        }
      }

      // Hide draft-notice if it exists on consultation page
      const draftNotice = document.getElementById("draft-notice");
      if (draftNotice) {
        draftNotice.style.display = "none";
      }

      // Execute success callback (like clearing drafts)
      if (onCompleted) onCompleted();

    } else {
      // Handle server-side logic errors
      throw new Error(result.message || "An error occurred on the server while processing submission.");
    }

  } catch (error) {
    console.error("Submission failed:", error);

    // 6. Restore button state on failure so the user can retry
    btn.disabled = false;
    btn.innerHTML = originalHtml;

    // 7. Display visual feedback for submission failure
    if (errorContainer) {
      errorContainer.textContent = `Submission failed: ${error.message || "Please check your internet connection and try again."}`;
      errorContainer.classList.add("visible");
    } else {
      alert(`Submission failed: ${error.message || "Please try again."}`);
    }
  }
}
