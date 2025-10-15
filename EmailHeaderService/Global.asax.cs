// <copyright file="Global.asax.cs" company="Microsoft">
//   Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>

namespace EmailHeaderService
{
    using System.Diagnostics.CodeAnalysis;
    using System.Web.Http;

    /// <summary>
    /// Main Controlling Class
    /// </summary>
    [SuppressMessage("Exchange.Usage", "EX0004:IDisposableMustBeIDisposeTrackable", Justification = "Assembly used externally and cannot reference Microsoft.Exchange.Diagnostics")]
    public class WebApiApplication : System.Web.HttpApplication
    {
        /// <summary>
        /// Run this when the Application Starts Up.
        /// </summary>
        protected void Application_Start()
        {
            GlobalConfiguration.Configure(WebApiConfig.Register);
        }

        /// <summary>
        /// Trap any OPTIONS calls and make sure they return 200. 
        /// </summary>
        protected void Application_BeginRequest()
        {
            if (this.Request.HttpMethod == "OPTIONS")
            {
                this.Response.StatusCode = 200;
                this.Response.Flush();

                // Following Eliminates Error: Server cannot set status after HTTP headers have been sent.
                this.Response.End();
            }
        }
    }
}
