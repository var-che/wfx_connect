// Content script for Sylectus integration
class SylectusIntegration {
  constructor() {
    console.log("WFX Connect: SylectusIntegration constructor called");
    this.setupUI();
    this.setupMessageHandlers();
  }

  setupUI() {
    console.log("WFX Connect: Setting up Sylectus UI");
    // Create the floating widget container
    const widget = document.createElement("div");
    widget.id = "wfx-connect-widget-sylectus";
    widget.innerHTML = `
      <div class="wfx-widget-header">
        <span>WFX Connect - Sylectus</span>
        <button class="wfx-toggle-btn" title="Toggle widget">−</button>
      </div>
      <div class="wfx-widget-content">
        <div class="wfx-input-group">
          <label for="wfx-mc-input-sylectus">MC Number:</label>
          <input type="text" id="wfx-mc-input-sylectus" placeholder="Enter MC number" />
        </div>
        <div class="wfx-input-group">
          <label for="wfx-company-select-sylectus">Company:</label>
          <select id="wfx-company-select-sylectus">
            <option value="">Select Company</option>
            <option value="Yankee">Yankee</option>
            <option value="NIS">NIS</option>
          </select>
        </div>
        <button id="wfx-check-btn-sylectus" class="wfx-btn-primary">Check MC</button>
        <div id="wfx-status-sylectus" class="wfx-status"></div>
        <div id="wfx-results-sylectus" class="wfx-results"></div>
        <div class="wfx-credit">Made from ❤️ from Donja Vrezina</div>
      </div>
    `;

    document.body.appendChild(widget);
    console.log("WFX Connect: Sylectus widget added to DOM");
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    const toggleBtn = document.querySelector(
      "#wfx-connect-widget-sylectus .wfx-toggle-btn"
    );
    const content = document.querySelector(
      "#wfx-connect-widget-sylectus .wfx-widget-content"
    );
    const checkBtn = document.getElementById("wfx-check-btn-sylectus");
    const mcInput = document.getElementById("wfx-mc-input-sylectus");

    // Toggle widget visibility
    toggleBtn.addEventListener("click", () => {
      const isVisible = content.style.display !== "none";
      content.style.display = isVisible ? "none" : "block";
      toggleBtn.textContent = isVisible ? "+" : "−";
    });

    // Check MC button
    checkBtn.addEventListener("click", () => this.performMCCheck());

    // Enter key on MC input
    mcInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performMCCheck();
      }
    });
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "MC_CHECK_RESULT") {
        this.displayResults(message.data);
        sendResponse({ received: true });
      }
    });
  }

  async performMCCheck() {
    const mcInput = document.getElementById("wfx-mc-input-sylectus");
    const companySelect = document.getElementById(
      "wfx-company-select-sylectus"
    );
    const statusDiv = document.getElementById("wfx-status-sylectus");
    const resultsDiv = document.getElementById("wfx-results-sylectus");

    const mc = mcInput.value.trim();
    const company = companySelect.value;

    // Clear previous results
    resultsDiv.innerHTML = "";

    // Validation
    if (!mc) {
      this.showStatus("Please enter an MC number", "error");
      return;
    }

    if (!company) {
      this.showStatus("Please select a company", "error");
      return;
    }

    // Show loading state
    this.showStatus("Checking MC...", "loading");
    document.getElementById("wfx-check-btn-sylectus").disabled = true;

    try {
      console.log("WFX Connect: Sylectus sending MC check request", {
        mc,
        company,
      });

      // Send message to background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "CHECK_MC",
            mc: mc,
            companyName: company,
          },
          resolve
        );
      });

      console.log("WFX Connect: Sylectus received response", response);

      if (response.error) {
        this.showStatus(response.error, "error");
      } else {
        this.displayResults(response.data);
        this.showStatus("MC check completed", "success");
      }
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, "error");
    } finally {
      document.getElementById("wfx-check-btn-sylectus").disabled = false;
    }
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById("wfx-status-sylectus");
    statusDiv.textContent = message;
    statusDiv.className = `wfx-status ${type}`;
  }

  displayResults(data) {
    console.log("WFX Connect: Sylectus displaying results:", data);
    const resultsDiv = document.getElementById("wfx-results-sylectus");

    if (!data || !data.rawData) {
      resultsDiv.innerHTML =
        '<div class="wfx-no-results">No results found</div>';
      return;
    }

    const { rawData } = data;
    console.log("WFX Connect: Raw data to display:", rawData);

    // Check if we have table_data
    if (!rawData.table_data) {
      resultsDiv.innerHTML =
        '<div class="wfx-no-results">No table data found</div>';
      return;
    }

    // Remove the <style> tag from table_data as it should not be displayed
    const cleanTableData = rawData.table_data.replace(
      /<style[\s\S]*?<\/style>/gi,
      ""
    );

    resultsDiv.innerHTML = `
      <div class="wfx-results-header">FleetOne Results:</div>
      <div class="wfx-results-content">
        <table class="wfx-results-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Address</th>
              <th>Key</th>
              <th>MC #</th>
              <th>DOT #</th>
              <th>Days to Pay All<br># of Pmts All</th>
              <th>Days to Pay 90<br># of Pmts 90</th>
              <th>Days to Pay 60<br># of Pmts 60</th>
            </tr>
          </thead>
          <tbody>
            ${cleanTableData}
          </tbody>
        </table>
      </div>
      <div class="wfx-record-details">
        ${rawData.table_records_details || ""}
      </div>
    `;
  }
}

// Initialize when DOM is ready
console.log("WFX Connect: Sylectus content script loaded");
console.log("WFX Connect: Current URL:", window.location.href);
console.log("WFX Connect: DOM state:", document.readyState);

if (document.readyState === "loading") {
  console.log("WFX Connect: DOM still loading, adding event listener");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("WFX Connect: DOM loaded, initializing Sylectus integration");
    new SylectusIntegration();
  });
} else {
  console.log(
    "WFX Connect: DOM already ready, initializing Sylectus integration immediately"
  );
  new SylectusIntegration();
}
