// ---------------------------------------------------------------------------
// <copyright file="WebApiConfig.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService
{
    using System.Web.Http;

    /// <summary>
    /// API Configuration
    /// </summary>
    public static class WebApiConfig
    {
        /// <summary>
        /// Register the configuration
        /// </summary>
        /// <param name="config">HTTP Configuration to update</param>
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services
            config.EnableCors();

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new
                {
                    id = RouteParameter.Optional
                });
        }
    }
}
