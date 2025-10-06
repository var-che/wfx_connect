// Content script for Sylectus integration - Using FleetOne tab communication
class SylectusSimple {
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
    console.log(`[WFX] Sylectus setup - isInIframe: ${this.isInIframe}`);

    if (this.isInIframe) {
      // In iframe: Add hover detection for load TD elements
      console.log("[WFX] Setting up iframe hover detection");
      this.injectCSS();
      this.setupTargetedHover();
    } else {
      // Main page: Initialize shared MC checker component
      console.log("[WFX] Setting up main page MC checker");
      if (window.MCChecker) {
        this.mcChecker = new window.MCChecker("Sylectus");
        this.mcChecker.init();
      }
    }
  }

  injectCSS() {
    if (this.injectedCSS) return;

    const style = document.createElement("style");
    style.textContent = `
      .wfx-hover-buttons {
        position: absolute;
        top: 2px;
        right: 2px;
        display: none;
        gap: 4px;
        z-index: 1000;
      }
      
      .wfx-hover-buttons.show {
        display: flex;
      }
      
      .wfx-hover-button {
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
      
      .wfx-hover-button.y-button {
        background: #16a34a;
        color: white;
      }
      
      .wfx-hover-button.y-button:hover {
        background: #15803d;
      }
      
      .wfx-hover-button.n-button {
        background: #dc2626;
        color: white;
      }
      
      .wfx-hover-button.n-button:hover {
        background: #b91c1c;
      }
      
      .wfx-hover-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .wfx-mc-result {
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
      
      .wfx-mc-result table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        margin: 4px 0;
      }
      
      .wfx-mc-result table td,
      .wfx-mc-result table th {
        padding: 4px 6px;
        border: 1px solid #ddd;
        text-align: left;
        vertical-align: top;
      }
      
      .wfx-mc-result table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .wfx-mc-result table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
    `;

    document.head.appendChild(style);
    this.injectedCSS = true;
  }

  setupTargetedHover() {
    // Only proceed if we're in iframe
    if (!this.isInIframe) return;

    // Add hover listeners to existing px9 TD elements
    this.addHoverListeners();

    // Watch for new TD elements being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === "TD" && node.className === "px9") {
                this.addHoverToElement(node);
              } else if (node.querySelectorAll) {
                const tds = node.querySelectorAll("td.px9");
                tds.forEach((td) => this.addHoverToElement(td));
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  addHoverListeners() {
    const targetTds = document.querySelectorAll("td.px9");

    targetTds.forEach((td, index) => {
      this.addHoverToElement(td, index);
    });
  }

  addHoverToElement(td, index = "new") {
    // Skip if already has hover listener
    if (td.dataset.wfxHover) return;

    // Mark as processed
    td.dataset.wfxHover = "true";

    // Ensure the TD has relative positioning for absolute button positioning
    if (getComputedStyle(td).position === "static") {
      td.style.position = "relative";
    }

    td.addEventListener("mouseenter", (e) => {
      const innerHTML = td.innerHTML;

      // Check if innerHTML matches our patterns:
      // Pattern 1: starts with <br> and has digits after <br>
      // Pattern 2: starts with digits and has <br> somewhere
      const startsWithBr = innerHTML.startsWith("<br>") && /\d/.test(innerHTML);
      const startsWithDigitsAndHasBr =
        /^\d/.test(innerHTML) && innerHTML.includes("<br>");

      if (startsWithBr || startsWithDigitsAndHasBr) {
        const text = td.textContent?.trim() || "";
        console.log(`[WFX] TARGETED HOVER - px9 TD with load pattern:`, {
          text: text,
          innerHTML: innerHTML,
        });

        // Show buttons
        this.showButtons(td);
      }
    });

    td.addEventListener("mouseleave", (e) => {
      // Hide buttons
      this.hideButtons(td);
    });
  }

  showButtons(td) {
    // Remove any existing buttons first
    this.hideButtons(td);

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "wfx-hover-buttons show";

    // Create Y button
    const yButton = document.createElement("button");
    yButton.className = "wfx-hover-button y-button";
    yButton.textContent = "Y";
    yButton.title = "Check MC as Yankee";
    yButton.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mcNumber = this.extractMCNumber(td);
      if (mcNumber) {
        console.log("[WFX] Y button clicked - MC Number:", mcNumber);
        // Show loading state
        yButton.textContent = "...";
        yButton.disabled = true;

        try {
          const result = await this.performFleetOneSearch(mcNumber, "Yankee");
          this.showResultInline(td, result, "yankee");
        } catch (error) {
          console.error("[WFX] Error checking MC:", error);
          this.showResultInline(td, { error: "Check failed" }, "yankee");
        } finally {
          yButton.textContent = "Y";
          yButton.disabled = false;
        }
      }
    };

    // Create N button
    const nButton = document.createElement("button");
    nButton.className = "wfx-hover-button n-button";
    nButton.textContent = "N";
    nButton.title = "Check MC as NIS";
    nButton.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mcNumber = this.extractMCNumber(td);
      if (mcNumber) {
        console.log("[WFX] N button clicked - MC Number:", mcNumber);
        // Show loading state
        nButton.textContent = "...";
        nButton.disabled = true;

        try {
          const result = await this.performFleetOneSearch(mcNumber, "NIS");
          this.showResultInline(td, result, "nis");
        } catch (error) {
          console.error("[WFX] Error checking MC:", error);
          this.showResultInline(td, { error: "Check failed" }, "nis");
        } finally {
          nButton.textContent = "N";
          nButton.disabled = false;
        }
      }
    };

    buttonContainer.appendChild(yButton);
    buttonContainer.appendChild(nButton);
    td.appendChild(buttonContainer);
  }

  hideButtons(td) {
    const existingButtons = td.querySelector(".wfx-hover-buttons");
    if (existingButtons) {
      existingButtons.remove();
    }
  }

  extractMCNumber(td) {
    const innerHTML = td.innerHTML;
    const textContent = td.textContent?.trim() || "";

    // Method 1: Extract numbers after the last <br> tag in innerHTML
    const lastBrIndex = innerHTML.lastIndexOf("<br>");
    if (lastBrIndex !== -1) {
      const afterLastBr = innerHTML.substring(lastBrIndex + 4); // +4 for '<br>'
      const numbersAfterBr = afterLastBr.match(/\d+/);
      if (numbersAfterBr) {
        return numbersAfterBr[0];
      }
    }

    // Method 2: Extract the last sequence of digits from text content
    const allNumbers = textContent.match(/\d+/g);
    if (allNumbers && allNumbers.length > 0) {
      return allNumbers[allNumbers.length - 1]; // Return the last number found
    }

    // Method 3: Try to find MC number at the end of text
    const endNumbers = textContent.match(/\d+$/);
    if (endNumbers) {
      return endNumbers[0];
    }

    return null;
  }

  async performFleetOneSearch(mc, companyName) {
    try {
      console.log(
        `[WFX] Sending MC check to background script: MC ${mc} for ${companyName}`
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

      console.log(`[WFX] Background script response:`, response);

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    } catch (error) {
      console.error(`[WFX] Background script error:`, error);
      throw error;
    }
  }

  showResultInline(td, result, company) {
    // Remove any existing result display
    const existingResult = td.querySelector(".wfx-mc-result");
    if (existingResult) {
      existingResult.remove();
    }

    // Create result display
    const resultDiv = document.createElement("div");
    resultDiv.className = "wfx-mc-result";

    if (result.error) {
      resultDiv.innerHTML = `<span style="color: #ef4444; font-size: 11px;">❌ ${result.error}</span>`;
    } else if (
      result.data &&
      result.data.rawData &&
      result.data.rawData.table_data
    ) {
      // Parse and render the HTML table data
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
            <strong>FleetOne Results:</strong>
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
            <strong>FleetOne Results (fallback):</strong>
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

    // Add result to the top-right of the page instead of the TD
    document.body.appendChild(resultDiv);

    // Auto-remove result after 10 seconds (longer since it's more prominent)
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
    new SylectusSimple();
  });
} else {
  new SylectusSimple();
}
