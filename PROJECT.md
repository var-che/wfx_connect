This is an attempt to ease up the MC check more efficiently the WEX / fleetone.com to see if the MC is factoring with them.

The main problem I have in the company, is that we need to open an incognito tab in the chrome, go to https://apps.fleetone.com/FleetDocs/CreditLookup/Search

go on one fied there, and enter the MC that we have from the Sylectus or DAT. The job is mundaine and time consuming.
It is browser window navigation and it gets annoying really fast.

The solution?
I want to create a Chrome extension v3 manifest, that will link the fleetone with background script of the extension.
Then, when user types on some popup module (or something like that) on the Sylectus or the DAT tab, the DAT or Sylectus context will send a message to the background script, then background script will rely the message to the fleetone site, it will perform the FETCH request, the request is then relied back to the BG script, and to the requester tab id.

Example:
User can open one or more https://apps.fleetone.com/FleetDocs/CreditLookup/Search incognito windows, because we have sometimes one or two fleetone accounts. On each of those logged in accounts, we link to a some name, for example: I open a https://apps.fleetone.com/FleetDocs/CreditLookup/Search window, i enter the credentials for Yankee, and when I am logged in, on the bottom left, there will be a dropdown meny where I can link that tab to a Yankee. Then on the DAT and/or Sylectus tab, I will have like an input field standing in the bottom left corner, where user can paste the MC that they want to chec, also from the dropdown menu, they can select Yankee, or NIS. Once user clicks on "Check" button that will also be in that form field, message will go to the background script, back to the linked incognito tab, it performs the FETCH request (i will later tell you what it is), then the response is sent back to the requester tab (for example the DAT). And bellow that form field that we defined, we render the response.

Target websites: https://one.dat.com/search-loads (for now, i will add sylectus later)
FleetOne API: ```
fetch("https://apps.fleetone.com/FleetDocs/CreditLookup/get_credit_lookup_paginate", {
"headers": {
"accept": "_/_",
"accept-language": "en-US,en;q=0.6",
"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
"priority": "u=1, i",
"sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Brave\";v=\"140\"",
"sec-ch-ua-mobile": "?0",
"sec-ch-ua-platform": "\"Linux\"",
"sec-fetch-dest": "empty",
"sec-fetch-mode": "cors",
"sec-fetch-site": "same-origin",
"sec-gpc": "1",
"x-requested-with": "XMLHttpRequest"
},
"referrer": "https://apps.fleetone.com/FleetDocs/CreditLookup/Search",
"body": "page_no=1&results_per_page=25&sort_order=asc&debtor=&postalCode=&mc=524119&dot=&status=",
"method": "POST",
"mode": "cors",
"credentials": "include"
});

```
where `mc` is the parameter we are interested in.

```

3 UI Preferences: nothing specific, as long as it is functional. 4. Company management: there will be two. It can be hard coded as "Yankee" and "NIS" 5. Response format: This is what i get:

```
{
    "table_data": "    <tr>\r\n        <td title=Approve style=\"vertical-align: middle; width: 14px; color: white; background-color:#009933\">A</td>\r\n        <td style=\"vertical-align: middle\">\r\n            #1 SOLUTIONS\r\n        </td>\r\n        <td class=\"no_wrap_class\" style=\"vertical-align: middle\">\r\n            \r\n            22077 MOUND RD, WARREN, MI, 48091\r\n        </td>\r\n        <td class=\"no_wrap_class\" style=\"vertical-align: middle\">\r\n            20759\r\n        </td>\r\n        <td class=\"no_wrap_class\" style=\"vertical-align: middle\">\r\n            524119\r\n        </td>\r\n        <td class=\"elipsis_class\" style=\"vertical-align: middle\">\r\n            2234274\r\n        </td>\r\n        <td style=\"vertical-align: middle\">\r\n                <span>\r\n                28<br />\r\n                </span>\r\n            181\r\n        </td>\r\n        <td style=\"vertical-align: middle\">\r\n                <span>\r\n                    0<br />\r\n                </span>\r\n            0\r\n        </td>\r\n        <td style=\"vertical-align: middle\">\r\n                <span>\r\n                    0<br />\r\n                </span>\r\n            0\r\n        </td>\r\n    </tr>\r\n<style>\r\n    .rate input {\r\n        width: 80px;\r\n    }\r\n\r\n    .rate {\r\n        display: block;\r\n        text-align: right;\r\n        position: relative;\r\n        float: right;\r\n    }\r\n\r\n    .dollar {\r\n        margin-top: 0px;\r\n        position: relative;\r\n        float: left;\r\n        line-height: 17px;\r\n    }\r\n</style>",
    "page_links": "<div class=\"dataTables_paginate paging_ellipses\" id=\"results-grid_paginate\" style=\"visibility: visible;\">\r\n    <b>< </b>\r\n    <span class=\"paginate_numbers\">\r\n        \r\n\r\n        <a href=\"javascript:void(0)\" class=\"paginate_button paginate_number  selected \" onclick=\"getCreditLookupRows(1 )\">\r\n            <b>1</b>\r\n        </a>\r\n\r\n\r\n\r\n    </span>\r\n    <b>></b>\r\n</div>\r\n",
    "table_records_details": "1 - 1 of 1 Results"
}
```

and i need to render:

```Name, Address	Key	MC #, 	DOT # ,	Days to Pay All # of Pmts All, 	Days to Pay 90
# of Pmts 90 ,	Days to Pay 60
# of Pmts 60
```

separated by commas.

6. Permissions - yes, all permissions are good
