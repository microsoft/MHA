MHA
=====

Message Header Analyzer mail app.

This is the source for the Message Header Analyzer. Install the app from the store here:
<https://appsource.microsoft.com/en-us/product/office/WA104005406>

Installation Procedure
-----

Because MHA requires the ReadWriteMailbox permission it can only be installed by the Administrator through the Exchange admin center or by a user as a custom addon. Here are some steps I put together:

1. In Office365, go to the Exchange Admin Center.
1. Click on the Organization tab
1. From there, select the add-ins tab
1. Click the Plus icon/Add from the Office Store
1. Click the Plus icon/Add from the Office Store
1. A new page will load for the store
1. Search for "Message Header Analyzer"
1. Choose MHA in the results
1. Click Add
1. Confirm by clicking Yes
1. Back in the Exchange Admin Center, refresh the list of add-ins
1. You can now edit who the add-in is available for

A Note on Permissions
-----

In order to get the transport message headers I have to use the EWS [makeEwsRequestAsync](https://learn.microsoft.com/en-us/javascript/api/outlook/office.mailbox?view=outlook-js-preview&preserve-view=true#outlook-office-mailbox-makeewsrequestasync-member(1)) method, which requires the ReadWriteMailbox permission level. See the article [Understanding Outlook add-in permissions](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/understanding-outlook-add-in-permissions) for more on this. If I could request fewer permissions I would, since I only ever read the one property, but I have no choice in the matter.

When REST is more widely available, and a few REST specific bugs are fixed, I'll be able to switch to REST and request a lower permission level.

Standalone
-----

Here is a standalone Message Header Analyzer running the same backend code as the MHA app:
<https://mha.azurewebsites.net/pages/mha.html>

Unit Tests
-----

<https://mha.azurewebsites.net/pages/unittests.html>

Mobile
-----

For both IOS and Android click open an email, then press the three dots under the date. There you should see the MHA icon. See [outlook-mobile-addins](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/outlook-mobile-addins) page for more details.

Development & Custom Deployment
======

Install and prereqs
-----

1. Ensure [node.js (LTS)](https://nodejs.org/en) is installed
1. Clone the repo to your local drive
1. Run the following to install packages: `npm install`

Manual build
-----

- The commands below for unit/site/add-in testing will also build before starting the server, but you can also build on demand.
- Manual build: `npm run build`
- For continuous build on changes, you can use watch: `npm run watch`

Unit Testing
-----

- Start the dev server: `npm run dev-server`
- Run unit tests from command line: `npm run test`
- Run unit tests locally in browser: <https://localhost:44336/Pages/unittests.html>
- Changes made to source should live compile and reload page. Ctrl+R/refresh as needed.

Live site testing
-----

- Start the dev server: `npm run dev-server`
- Run website locally: <https://localhost:44336/Pages/mha.html>
- Changes made to source should live compile and reload page. Ctrl+R/refresh as needed.

Add-in testing (Command line)
-----

- Close Outlook
- Start the dev server: `npm start`
- Outlook should start with add-in added as "View Headers Debug Local"
- Changes made to source should live compile and reload in Outlook. Ctrl+R/refresh as needed.

Add-in testing (VSCode)
-----

- Follow the steps given [here](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/debug-desktop-using-edge-chromium#use-the-visual-studio-code-debugger).

Clean
-----

- Clean build artifacts: `npm clean`
