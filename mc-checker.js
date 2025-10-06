// Shared MC Checker Component - Top Banner Layout
class MCChecker {
  constructor(platform = "unknown") {
    this.platform = platform;
    this.isInitialized = false;
    this.widget = null;
  }

  init() {
    if (this.isInitialized) return;

    this.createTopBanner();
    this.setupEventHandlers();
    this.injectCSS();
    this.setupMessageListener();
    this.isInitialized = true;
    console.log(`[WFX] MC Checker initialized for ${this.platform}`);
  }

  setupMessageListener() {
    window.addEventListener("message", (event) => {
      // Check if this is our MC check message
      if (event.data && event.data.type === "WFX_MC_CHECK") {
        const { mcNumber, company } = event.data;
        console.log(
          `[WFX] Received MC check request from iframe: MC ${mcNumber} as ${company}`
        );

        // Set the form values and trigger check
        const mcInput = document.getElementById("wfx-mc-input");
        const companySelect = document.getElementById("wfx-company-select");

        if (mcInput && companySelect) {
          mcInput.value = mcNumber;
          companySelect.value = company;

          // Trigger the MC check
          this.checkMC(mcNumber, company);
        }
      }
    });
  }

  createTopBanner() {
    // Remove any existing widget first
    this.remove();

    // Create the top banner container
    this.widget = document.createElement("div");
    this.widget.id = "wfx-mc-checker";
    this.widget.innerHTML = `
      <div class="wfx-mc-banner">
        <div class="wfx-mc-form">
          <div class="wfx-mc-group">
            <label for="wfx-mc-input">MC:</label>
            <input type="text" id="wfx-mc-input" placeholder="Enter MC number" />
          </div>
          
          <div class="wfx-mc-group">
            <label for="wfx-company-select">Company:</label>
            <select id="wfx-company-select">
              <option value="yankee">Yankee</option>
              <option value="nis">NIS</option>
            </select>
          </div>
          
          <button type="button" id="wfx-submit-btn" class="wfx-submit-btn">Check MC</button>
          
          <div id="wfx-result" class="wfx-result"></div>
        </div>
        
        <button type="button" id="wfx-close-btn" class="wfx-close-btn" title="Close">×</button>
      </div>
    `;

    // Prepend to body (top of page)
    document.body.insertBefore(this.widget, document.body.firstChild);
  }

  injectCSS() {
    // Remove existing CSS if any
    const existingStyle = document.getElementById("wfx-mc-checker-styles");
    if (existingStyle) existingStyle.remove();

    const style = document.createElement("style");
    style.id = "wfx-mc-checker-styles";
    style.textContent = `
      #wfx-mc-checker {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .wfx-mc-banner {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 50px;
      }
      
      .wfx-mc-form {
        display: flex;
        align-items: center;
        gap: 20px;
        flex: 1;
      }
      
      .wfx-mc-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .wfx-mc-group label {
        font-weight: 600;
        font-size: 14px;
        white-space: nowrap;
      }
      
      #wfx-mc-input {
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        width: 120px;
        outline: none;
      }
      
      #wfx-company-select {
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        outline: none;
        cursor: pointer;
      }
      
      .wfx-submit-btn {
        padding: 8px 16px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .wfx-submit-btn:hover {
        background: #059669;
      }
      
      .wfx-submit-btn:disabled {
        background: #6b7280;
        cursor: not-allowed;
      }
      
      .wfx-result {
        font-size: 14px;
        font-weight: 600;
        min-width: 120px;
        text-align: center;
        padding: 4px 8px;
        border-radius: 4px;
      }
      
      .wfx-result.success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }
      
      .wfx-result.error {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      
      .wfx-result.loading {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
      }
      
      .wfx-close-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .wfx-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `;

    document.head.appendChild(style);
  }

  setupEventHandlers() {
    // Submit button
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "wfx-submit-btn") {
        this.performMCCheck();
      }
    });

    // Close button
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "wfx-close-btn") {
        this.remove();
      }
    });

    // Enter key on input
    document.addEventListener("keypress", (e) => {
      if (e.target && e.target.id === "wfx-mc-input" && e.key === "Enter") {
        this.performMCCheck();
      }
    });
  }

  async performMCCheck() {
    const mcInput = document.getElementById("wfx-mc-input");
    const companySelect = document.getElementById("wfx-company-select");
    const submitBtn = document.getElementById("wfx-submit-btn");

    if (!mcInput || !companySelect) return;

    const mcNumber = mcInput.value.trim();
    const company = companySelect.value;

    if (!mcNumber) {
      this.showResult("Please enter MC number", "error");
      return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking...";
    this.showResult("Checking...", "loading");

    try {
      const result = await this.checkMC(mcNumber, company);

      if (result && result.success) {
        this.showResult("✓ Checked", "success");
      } else {
        this.showResult("Check failed", "error");
      }
    } catch (error) {
      console.error("[WFX] MC check error:", error);
      this.showResult("Error occurred", "error");
    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = "Check MC";
    }
  }

  showResult(message, type) {
    const resultDiv = document.getElementById("wfx-result");
    if (resultDiv) {
      resultDiv.textContent = message;
      resultDiv.className = `wfx-result ${type}`;

      // Clear result after 3 seconds if it's not loading
      if (type !== "loading") {
        setTimeout(() => {
          if (resultDiv.className.includes(type)) {
            resultDiv.textContent = "";
            resultDiv.className = "wfx-result";
          }
        }, 3000);
      }
    }
  }

  async checkMC(mcNumber, company) {
    // This method can be called programmatically
    console.log(`[WFX] Checking MC ${mcNumber} with ${company}`);

    // TODO: Implement actual FleetOne API call
    // For now, return mock success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, data: { mc: mcNumber, company } });
      }, 1000);
    });
  }

  remove() {
    if (this.widget && this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }

    // Remove CSS
    const existingStyle = document.getElementById("wfx-mc-checker-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    this.isInitialized = false;
    this.widget = null;
  }
}

// Global instance for use by other scripts
window.MCChecker = MCChecker;
