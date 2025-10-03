// Background script for WFX Connect
class WFXConnectBackground {
  constructor() {
    this.fleetOneConnections = new Map(); // Store FleetOne tab connections
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      console.log(`Tab ${tabId} was removed`);
      if (this.fleetOneConnections.has(tabId)) {
        const company = this.fleetOneConnections.get(tabId);
        console.log(
          `Removing FleetOne connection for tab ${tabId} (${company})`
        );
        this.fleetOneConnections.delete(tabId);
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "REGISTER_FLEETONE":
          this.registerFleetOneTab(message.companyName, sender.tab.id);
          sendResponse({ success: true, message: "FleetOne tab registered" });
          break;

        case "GET_FLEETONE_CONNECTIONS":
          const connections = Array.from(
            this.fleetOneConnections.entries()
          ).map(([tabId, company]) => ({
            tabId,
            company,
          }));
          sendResponse({ connections });
          break;

        case "CHECK_MC":
          await this.checkMC(message.mc, message.companyName, sendResponse);
          break;

        default:
          sendResponse({ error: "Unknown message type" });
      }
    } catch (error) {
      console.error("Background script error:", error);
      sendResponse({ error: error.message });
    }
  }

  registerFleetOneTab(companyName, tabId) {
    this.fleetOneConnections.set(tabId, companyName);
    console.log(`Registered FleetOne tab ${tabId} for ${companyName}`);
    console.log(
      "Current connections:",
      Array.from(this.fleetOneConnections.entries())
    );
  }

  async checkMC(mc, companyName, sendResponse) {
    try {
      console.log(`Looking for FleetOne tab for company: ${companyName}`);
      console.log(
        "Available connections:",
        Array.from(this.fleetOneConnections.entries())
      );

      // Find the FleetOne tab for the specified company
      const fleetOneTabId = this.findFleetOneTab(companyName);
      console.log(`Found FleetOne tab ID: ${fleetOneTabId}`);

      if (!fleetOneTabId) {
        sendResponse({
          error: `No FleetOne tab found for ${companyName}. Please open and register a FleetOne tab first.`,
        });
        return;
      }

      // Send message to FleetOne content script to perform the search
      chrome.tabs.sendMessage(
        fleetOneTabId,
        {
          type: "PERFORM_MC_SEARCH",
          mc: mc,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              error: `Failed to communicate with FleetOne tab: ${chrome.runtime.lastError.message}`,
            });
          } else {
            sendResponse(response);
          }
        }
      );
    } catch (error) {
      sendResponse({ error: `MC check failed: ${error.message}` });
    }
  }

  findFleetOneTab(companyName) {
    console.log(`Searching for company: "${companyName}"`);
    for (const [tabId, company] of this.fleetOneConnections.entries()) {
      console.log(`Checking tab ${tabId} with company: "${company}"`);
      if (company === companyName) {
        console.log(`Match found! Tab ${tabId}`);
        return tabId;
      }
    }
    console.log("No match found");
    return null;
  }
}

// Initialize the background script
new WFXConnectBackground();
