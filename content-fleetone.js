// Content script for FleetOne integration
console.log("WFX Connect: FleetOne content script loaded");

class FleetOneIntegration {
  constructor() {
    console.log("WFX Connect: FleetOneIntegration constructor called");
    this.setupUI();
    this.setupMessageHandlers();
  }

  setupUI() {
    console.log("WFX Connect: Setting up FleetOne UI");
    // Create registration widget for FleetOne
    const widget = document.createElement("div");
    widget.id = "wfx-fleetone-widget";
    widget.innerHTML = `
      <div class="wfx-widget-header">
        <span>WFX Connect - FleetOne</span>
        <button class="wfx-toggle-btn" title="Toggle widget">−</button>
      </div>
      <div class="wfx-widget-content">
        <div class="wfx-input-group">
          <label for="wfx-company-register">Register as:</label>
          <select id="wfx-company-register">
            <option value="">Select Company</option>
            <option value="Yankee">Yankee</option>
            <option value="NIS">NIS</option>
          </select>
        </div>
        <button id="wfx-register-btn" class="wfx-btn-primary">Register Tab</button>
        <div id="wfx-fleetone-status" class="wfx-status"></div>
      </div>
    `;

    document.body.appendChild(widget);
    console.log("WFX Connect: FleetOne widget added to DOM");
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    const toggleBtn = document.querySelector(
      "#wfx-fleetone-widget .wfx-toggle-btn"
    );
    const content = document.querySelector(
      "#wfx-fleetone-widget .wfx-widget-content"
    );
    const registerBtn = document.getElementById("wfx-register-btn");

    // Toggle widget visibility
    toggleBtn.addEventListener("click", () => {
      const isVisible = content.style.display !== "none";
      content.style.display = isVisible ? "none" : "block";
      toggleBtn.textContent = isVisible ? "+" : "−";
    });

    // Register tab button
    registerBtn.addEventListener("click", () => this.registerTab());
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "PERFORM_MC_SEARCH") {
        this.performMCSearch(message.mc, sendResponse);
        return true; // Keep message channel open for async response
      }
    });
  }

  registerTab() {
    const companySelect = document.getElementById("wfx-company-register");
    const company = companySelect.value;

    if (!company) {
      this.showFleetOneStatus("Please select a company", "error");
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: "REGISTER_FLEETONE",
        companyName: company,
      },
      (response) => {
        if (response.success) {
          this.showFleetOneStatus(`Registered as ${company}`, "success");
        } else {
          this.showFleetOneStatus("Registration failed", "error");
        }
      }
    );
  }

  async performMCSearch(mc, sendResponse) {
    try {
      this.showFleetOneStatus("Performing MC search...", "loading");

      // Perform the FleetOne API call
      const response = await fetch(
        "https://apps.fleetone.com/FleetDocs/CreditLookup/get_credit_lookup_paginate",
        {
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.6",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            priority: "u=1, i",
            "sec-ch-ua":
              '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Linux"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": "1",
            "x-requested-with": "XMLHttpRequest",
          },
          referrer: "https://apps.fleetone.com/FleetDocs/CreditLookup/Search",
          body: `page_no=1&results_per_page=25&sort_order=asc&debtor=&postalCode=&mc=${mc}&dot=&status=`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const parsedData = this.parseFleetOneResponse(data);

      this.showFleetOneStatus("MC search completed", "success");
      sendResponse({
        success: true,
        data: {
          rawData: data,
          parsedData: parsedData,
        },
      });
    } catch (error) {
      this.showFleetOneStatus(`Search failed: ${error.message}`, "error");
      sendResponse({
        success: false,
        error: error.message,
      });
    }
  }

  parseFleetOneResponse(data) {
    try {
      console.log("WFX Connect: Parsing FleetOne response:", data);

      if (!data.table_data) {
        console.log("WFX Connect: No table_data in response");
        return null;
      }

      // Parse the HTML table data
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.table_data, "text/html");
      const row = doc.querySelector("tr");

      if (!row) {
        console.log("WFX Connect: No table row found");
        return null;
      }

      const cells = row.querySelectorAll("td");
      console.log("WFX Connect: Found cells:", cells.length);

      if (cells.length < 3) {
        console.log("WFX Connect: Not enough cells found");
        return null;
      }

      // Extract name from cell 1 and address from cell 2
      const name = cells[1]?.textContent?.trim() || "";
      const address = cells[2]?.textContent?.trim() || "";

      console.log("WFX Connect: Extracted name:", name);
      console.log("WFX Connect: Extracted address:", address);

      const result = {
        name: name,
        address: address,
      };

      console.log("WFX Connect: Final parsed result:", result);
      return result;
    } catch (error) {
      console.error("WFX Connect: Error parsing FleetOne response:", error);
      return null;
    }
  }

  showFleetOneStatus(message, type) {
    const statusDiv = document.getElementById("wfx-fleetone-status");
    statusDiv.textContent = message;
    statusDiv.className = `wfx-status ${type}`;
  }
}

// Initialize when DOM is ready
console.log(
  "WFX Connect: FleetOne script at bottom, DOM state:",
  document.readyState
);

if (document.readyState === "loading") {
  console.log("WFX Connect: DOM still loading, adding event listener");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("WFX Connect: DOM loaded, initializing FleetOne integration");
    new FleetOneIntegration();
  });
} else {
  console.log(
    "WFX Connect: DOM already ready, initializing FleetOne integration immediately"
  );
  new FleetOneIntegration();
}
