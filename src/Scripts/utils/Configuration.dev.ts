// Development configuration override
// This file will be used for local development

export const ConfigurationClass = function ()
{
    // NO SERVER REQUIRED - All functionality is now client-side only
    // Rules are loaded from local JSON file, no server component needed

    // Note: Server, attachment service, and authentication configuration removed
    // as they are no longer needed for the local-only implementation
};

export const configuration = new ConfigurationClass();