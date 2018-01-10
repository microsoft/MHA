# MHA
Message Header Analyzer mail app.

This is the source for the Message Header Analyzer. Install the app from the store here:
https://store.office.com/message-header-analyzer-WA104005406.aspx

## Installation Procedure
Because MHA requires the ReadWriteMailbox permission it can only be installed by the Administrator through the Exchange admin center. Here are some steps I put together:
1. In Office365, go to the Exchange Admin Center.
2. Click on the Organization tab
3. From there, select the add-ins tab
4. Click the Plus icon/Add from the Office Store
5. A new page will load for the store
6. Search for "Message Header Analyzer"
7. Choose MHA in the results
8. Click Add
9. Confirm by clicking Yes
10. Back in the Exchange Admin Center, refresh the list of add-ins
11. You can now edit who the add-in is available for

## A Note on Permissions
In order to get the transport message headers I have to use the EWS [makeEwsRequestAsync](https://dev.office.com/reference/add-ins/outlook/1.5/Office.context.mailbox?product=outlook&version=v1.5#makeewsrequestasyncdata-callback-usercontext) method, which requires the ReadWriteMailbox permission level. See the article [Understanding Outlook add-in permissions](https://dev.office.com/docs/add-ins/outlook/understanding-outlook-add-in-permissions) for more on this. If I could request fewer permissions I would, since I only ever read the one property, but I have no choice in the matter.

When REST is more widely available, and a few REST specific bugs are fixed, I'll be able to switch to REST and request a lower permission level.

## Standalone
Here is a standalone Message Header Analyzer running the same backend code as the MHA app:
https://mha.azurewebsites.net/pages/mha.html

## Unit Tests
https://mha.azurewebsites.net/pages/unittests.html
