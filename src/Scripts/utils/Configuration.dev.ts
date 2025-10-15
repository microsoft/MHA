// Development configuration override
// This file will be used for local development

export const ConfigurationClass = function ()
{
    // Local development server
    this.Server = "http://localhost:44337";    // Local development server for EmailHeaderService
    this.Port = null; // For Azure App Service set to null
    this.RedirectUri = "http://localhost:44337/api/TokenIn"; // Local redirect for development

    this.ServiceName = "AttachmentService";
    this.RulesServiceName = "RulesService";

    // Configuration for Outlook Plugin Client AAD (development)
    this.WebSiteApplicationClientId = "9e9f1e7e-16a3-41bd-947b-78008bef89f3";
    this.ServerExposedScope = "8c88b519-a21c-4afe-bc73-e29b838a7c0c/access_as_user";
    this.AzureTenant = "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47";
};

export const Configuration = new ConfigurationClass();