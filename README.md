# MHA
Message Header Analyzer mail app.

This is the source for the Message Header Analyzer. Install the app from the store here:
https://appsource.microsoft.com/en-us/product/office/WA104005406

## Installation Procedure
Because MHA requires the ReadWriteMailbox permission it can only be installed by the Administrator through the Exchange admin center or by a user as a custom addon. Here are some steps I put together:
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

## Development & Custom Deployment
You can run multiple copies at once as long as you change the add-ins ID (and recommend changing the name to make it clear).  Recommend setting the cache-control header to "no-store" so you don't need to redeploy a new version every time during development.

- Clone the repo to your local drive, note whatever root you clone into the deploy script will copy everything to the parent folder under a new folder called artifacts.
- Edit Manifest.xml and ManifestMobile.xml changing:
	- <id> tag to a new GUID (same GUID for each)
	- Change the display name/description to what you would like 
	- Find and replace in both files "https://mha.azurewebsites.net" with the base URL you will be using (or localhost:port for development)
- Edit src/Scripts/diag.ts and set USE_APP_INSIGHTS=false (instead of true) unless you plan to add your app insights key.
- Make any other changes you want
- Run deploy.cmd in the repo root to package everything up and minify things.
- From the wwwroot folder created in ../artifacts  you will need to upload the two Manifest xml files, the Content, node_modules, packages, Pages, Resources, Scripts folders
- Try to access the Pages/unittests.html and Pages/mah.html on your web sever and paste some headers in. If this doesn't work use developer tools in the browser to see what is wrong.
- Install the addin in OWA
	- Note only need to do this if the website for the addin changes, all content is loaded directly from the website so if you just update the same website you do not need to re-add the add-in in outlook.
	- In OWA (outline online) click Get Addin's in one of the ribbons, if you don't have it go to all settings, mail->customize actions and add to the message surface then click the icon.
	- Click My add-ins
	- Under Custom add-ins click the plus to add a custom addin and select your manifest file or give the url to the manifest file
