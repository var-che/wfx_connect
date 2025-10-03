# WFX Connect - Chrome Extension

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this project folder
4. The extension should now be installed and active

## Usage

### Step 1: Register FleetOne Tabs

1. Open one or more incognito tabs with `https://apps.fleetone.com/FleetDocs/CreditLookup/Search`
2. Log in with your company credentials
3. A blue WFX Connect widget will appear in the bottom left
4. Select the company name from the dropdown (Yankee or NIS)
5. Click "Register Tab" to link this FleetOne session to the selected company

### Step 2: Use MC Checker on DAT

1. Navigate to `https://one.dat.com/search-loads`
2. A WFX Connect widget will appear in the bottom left
3. Enter the MC number you want to check
4. Select which company's FleetOne session to use for the lookup
5. Click "Check MC" to perform the search
6. Results will be displayed below the form, including both formatted data and CSV format

## Features

- **Multi-Company Support**: Register up to two different FleetOne accounts
- **Seamless Integration**: Widgets appear automatically on target sites
- **Real-time Results**: Get FleetOne credit lookup data without tab switching
- **CSV Export**: Results formatted for easy copying to spreadsheets
- **Error Handling**: Clear status messages and error reporting

## Project Structure

```
wfx_connect/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for message handling
├── content-dat.js         # DAT integration script
├── content-fleetone.js    # FleetOne integration script
├── styles.css             # Widget styling
├── PROJECT.md             # Project documentation
└── README.md              # Installation and usage guide
```

## Technical Details

The extension uses Chrome's Manifest V3 architecture with:

- **Background Script**: Manages communication between tabs and stores FleetOne connections
- **Content Scripts**: Inject UI widgets and handle site-specific functionality
- **Message Passing**: Secure communication between different parts of the extension
- **Cross-Origin Requests**: Properly configured permissions for FleetOne API calls

## Troubleshooting

- **No FleetOne tab found**: Make sure you've registered at least one FleetOne tab
- **API errors**: Ensure you're logged into FleetOne and the session is active
- **Widget not appearing**: Refresh the page or check that the extension is enabled
- **Permission errors**: The extension requires access to both DAT and FleetOne domains
