// Content script for DAT integration - Using FleetOne tab communication
class DATSimple {
  constructor() {
    this.isInIframe = window !== window.top;
    this.injectedCSS = false;
    this.mcChecker = null;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setup();
      });
    } else {
      this.setup();
    }
  }

  setup() {
    console.log(`[WFX] DAT setup - isInIframe: ${this.isInIframe}`);
    console.log(`[WFX] DAT URL: ${window.location.href}`);

    // Always try to add buttons regardless of iframe status for DAT
    console.log("[WFX] Setting up DAT button monitoring");
    this.injectCSS();
    this.setupDATHover();

    // Also initialize shared MC checker component on main page
    if (!this.isInIframe) {
      console.log("[WFX] Setting up main page MC checker for DAT");
      if (window.MCChecker) {
        this.mcChecker = new window.MCChecker("DAT");
        this.mcChecker.init();
      }
    }
  }

  injectCSS() {
    if (this.injectedCSS) return;

    const style = document.createElement("style");
    style.textContent = `
      .wfx-dat-hover-buttons {
        position: absolute;
        top: 2px;
        right: 2px;
        display: none;
        gap: 4px;
        z-index: 1000;
      }
      
      .wfx-dat-hover-buttons.show {
        display: flex;
      }
      
      .wfx-dat-hover-button {
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        transition: background-color 0.2s;
        min-width: 24px;
        text-align: center;
      }
      
      .wfx-dat-hover-button.y-button {
        background: #16a34a;
        color: white;
      }
      
      .wfx-dat-hover-button.y-button:hover {
        background: #15803d;
      }
      
      .wfx-dat-hover-button.n-button {
        background: #dc2626;
        color: white;
      }
      
      .wfx-dat-hover-button.n-button:hover {
        background: #b91c1c;
      }
      
      .wfx-dat-hover-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .wfx-dat-mc-result {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-width: 90vw;
        background: rgba(255, 255, 255, 0.98);
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 8px 12px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .wfx-dat-mc-result table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        margin: 4px 0;
      }
      
      .wfx-dat-mc-result table td,
      .wfx-dat-mc-result table th {
        padding: 4px 6px;
        border: 1px solid #ddd;
        text-align: left;
        vertical-align: top;
      }
      
      .wfx-dat-mc-result table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .wfx-dat-mc-result table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
    `;

    document.head.appendChild(style);
    this.injectedCSS = true;
  }

  setupDATHover() {
    console.log("[WFX] Setting up DAT hover detection");

    // Start monitoring for DAT load elements with interval
    this.startDATMonitoring();
  }

  startDATMonitoring() {
    console.log("[WFX] Starting DAT monitoring...");

    // Initial scan
    this.scanForDATLoads();

    // Set up interval scanning every 1 second
    setInterval(() => {
      this.scanForDATLoads();
    }, 1000);

    console.log("[WFX] DAT monitoring started with 1-second interval");
  }

  scanForDATLoads() {
    console.log("[WFX] Scanning for DAT loads...");

    // Simple direct query as suggested by user
    const mcElements = document.querySelectorAll(".city-spacing");
    console.log(`[WFX] Found ${mcElements.length} .city-spacing elements`);

    mcElements.forEach((element, index) => {
      const text = element.textContent?.trim() || "";
      console.log(`[WFX] Element ${index} text:`, text);

      // Check if text contains MC number in DAT format (MC#1620490)
      if (text.includes("MC#") && !element.dataset.wfxDatProcessed) {
        console.log(`[WFX] Found DAT MC element:`, text);
        console.log(`[WFX] Element HTML:`, element.outerHTML.substring(0, 300));

        this.addButtonsToMCElement(element);
        element.dataset.wfxDatProcessed = "true";
      } else if (element.dataset.wfxDatProcessed) {
        console.log(`[WFX] Element ${index} already processed`);
      }
    });
  }

  addButtonsToMCElement(mcElement) {
    console.log("[WFX] addButtonsToMCElement called");

    // Extract MC number from text like "MC#1620490"
    const text = mcElement.textContent?.trim() || "";
    const mcMatch = text.match(/MC#(\d+)/);
    if (!mcMatch) {
      console.log("[WFX] No MC number found in text:", text);
      return;
    }

    const mcNumber = mcMatch[1];
    console.log(`[WFX] Adding buttons for MC: ${mcNumber}`);

    // Check if our buttons already exist
    if (mcElement.querySelector(".wfx-dat-mc-buttons")) {
      console.log("[WFX] Buttons already exist, skipping");
      return;
    }

    console.log("[WFX] Creating independent Y and N buttons container");

    // Create our own independent container - not using loadconnect-actions
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "wfx-dat-mc-buttons";
    buttonsContainer.style.cssText = `
      display: inline-flex !important;
      gap: 4px !important;
      margin-left: 8px !important;
      vertical-align: middle !important;
    `;

    // Create Y button
    const yButton = document.createElement("button");
    yButton.className = "wfx-dat-mc-button";
    yButton.title = "Check MC as Yankee";
    yButton.style.cssText = `
      background: #16a34a !important; 
      color: white !important;
      padding: 2px 6px !important;
      border: none !important;
      border-radius: 3px !important;
      cursor: pointer !important;
      font-size: 11px !important;
      font-weight: bold !important;
      display: inline-block !important;
      z-index: 9999 !important;
      min-width: 18px !important;
      height: 20px !important;
      line-height: 16px !important;
    `;
    yButton.innerHTML = "Y";

    yButton.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[WFX] DAT Y button clicked - MC Number:", mcNumber);

      // Show loading state
      const originalText = yButton.innerHTML;
      yButton.innerHTML = "...";
      yButton.disabled = true;

      try {
        const result = await this.performFleetOneSearch(mcNumber, "Yankee");
        this.showResultInline(mcElement, result, "yankee");
      } catch (error) {
        console.error("[WFX] Error checking MC:", error);
        this.showResultInline(mcElement, { error: "Check failed" }, "yankee");
      } finally {
        yButton.innerHTML = originalText;
        yButton.disabled = false;
      }
    };

    // Create N button
    const nButton = document.createElement("button");
    nButton.className = "wfx-dat-mc-button";
    nButton.title = "Check MC as NIS";
    nButton.style.cssText = `
      background: #dc2626 !important; 
      color: white !important;
      padding: 2px 6px !important;
      border: none !important;
      border-radius: 3px !important;
      cursor: pointer !important;
      font-size: 11px !important;
      font-weight: bold !important;
      display: inline-block !important;
      z-index: 9999 !important;
      min-width: 18px !important;
      height: 20px !important;
      line-height: 16px !important;
    `;
    nButton.innerHTML = "N";

    nButton.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[WFX] DAT N button clicked - MC Number:", mcNumber);

      // Show loading state
      const originalText = nButton.innerHTML;
      nButton.innerHTML = "...";
      nButton.disabled = true;

      try {
        const result = await this.performFleetOneSearch(mcNumber, "NIS");
        this.showResultInline(mcElement, result, "nis");
      } catch (error) {
        console.error("[WFX] Error checking MC:", error);
        this.showResultInline(mcElement, { error: "Check failed" }, "nis");
      } finally {
        nButton.innerHTML = originalText;
        nButton.disabled = false;
      }
    };

    // Add buttons to our independent container
    buttonsContainer.appendChild(yButton);
    buttonsContainer.appendChild(nButton);

    // Append our container directly to the MC element (not to loadconnect-actions)
    mcElement.appendChild(buttonsContainer);

    console.log(
      `[WFX] Successfully added independent Y/N buttons for MC ${mcNumber}`
    );
    console.log(`[WFX] Buttons container HTML:`, buttonsContainer.outerHTML);
    console.log(
      `[WFX] Y button visible:`,
      yButton.offsetWidth > 0 && yButton.offsetHeight > 0
    );
    console.log(
      `[WFX] N button visible:`,
      nButton.offsetWidth > 0 && nButton.offsetHeight > 0
    );
  }

  async performFleetOneSearch(mc, companyName) {
    try {
      console.log(
        `[WFX] DAT sending MC check to background script: MC ${mc} for ${companyName}`
      );

      // Send message to background script to route to correct FleetOne tab
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "CHECK_MC",
            mc: mc,
            companyName: companyName,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      console.log(`[WFX] DAT background script response:`, response);

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    } catch (error) {
      console.error(`[WFX] DAT background script error:`, error);
      throw error;
    }
  }

  showResultInline(element, result, company) {
    // Remove any existing result display
    const existingResult = document.querySelector(".wfx-dat-mc-result");
    if (existingResult) {
      existingResult.remove();
    }

    // Create result display
    const resultDiv = document.createElement("div");
    resultDiv.className = "wfx-dat-mc-result";

    if (result.error) {
      resultDiv.innerHTML = `<span style="color: #ef4444; font-size: 11px;">❌ ${result.error}</span>`;
    } else if (
      result.data &&
      result.data.rawData &&
      result.data.rawData.table_data
    ) {
      // Parse and render the HTML table data (same as Sylectus)
      let tableHtml = result.data.rawData.table_data;

      // Remove any style tags that might interfere
      tableHtml = tableHtml.replace(/<style[\s\S]*?<\/style>/gi, "");

      // Wrap the table rows in a proper table structure if needed
      if (!tableHtml.includes("<table")) {
        tableHtml = `<table style="width: 100%; border-collapse: collapse;">${tableHtml}</table>`;
      }

      resultDiv.innerHTML = `
        <div style="font-size: 12px; color: #333;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong>FleetOne Results (DAT):</strong>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #dc2626; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 10px;">✕</button>
          </div>
          <div style="max-height: 300px; overflow-y: auto;">
            ${tableHtml}
          </div>
        </div>
      `;
    } else if (result.rawData && result.rawData.table_data) {
      // Fallback for direct rawData structure
      let tableHtml = result.rawData.table_data;

      // Remove any style tags that might interfere
      tableHtml = tableHtml.replace(/<style[\s\S]*?<\/style>/gi, "");

      // Wrap the table rows in a proper table structure if needed
      if (!tableHtml.includes("<table")) {
        tableHtml = `<table style="width: 100%; border-collapse: collapse;">${tableHtml}</table>`;
      }

      resultDiv.innerHTML = `
        <div style="font-size: 12px; color: #333;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong>FleetOne Results (DAT - fallback):</strong>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #dc2626; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 10px;">✕</button>
          </div>
          <div style="max-height: 300px; overflow-y: auto;">
            ${tableHtml}
          </div>
        </div>
      `;
    } else if (
      result.data &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      // Fallback for old data structure
      const record = result.data[0];
      const companyName = record.debtorName || "Unknown";
      const status = company === "yankee" ? "Y" : "N";
      resultDiv.innerHTML = `
        <div style="font-size: 11px; color: #10b981; margin-top: 2px;">
          ✅ ${status}: ${companyName}
        </div>
      `;
    } else {
      resultDiv.innerHTML = `<span style="color: #f59e0b; font-size: 11px;">⚠️ No records found</span>`;
    }

    // Add result to the top-right of the page (same as Sylectus)
    document.body.appendChild(resultDiv);

    // Auto-remove result after 10 seconds
    setTimeout(() => {
      if (resultDiv.parentNode) {
        resultDiv.remove();
      }
    }, 10000);
  }
}

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new DATSimple();
  });
} else {
  new DATSimple();
}
