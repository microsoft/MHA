// ---------------------------------------------------------------------------
// <copyright file="TokenInController.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Controllers
{
    using System;
    using System.Configuration;
    using System.Diagnostics.CodeAnalysis;
    using System.Net.Http;
    using System.Web.Http;
    using EmailHeaderService.Models;
    using EmailHeaderService.Utilities;
    using Microsoft.Exchange.Diagnostics;

    /// <summary>
    /// Receive the authorization message from the tenant and store the token (GUID)
    /// for later access
    /// </summary>
    [SuppressMessage("Exchange.Usage", "EX0004:IDisposableMustBeIDisposeTrackable", Scope = "type",
        Target = "Microsoft.Exchange.Hygiene.ReactiveTools.EmailHeaderService.TokenInController", Justification = "Stylebot Generated FxCop Exclusion.")]
    public class TokenInController : ApiController, IDisposeTrackable
    {
        /// <summary>
        /// First part of the scope clause.  This value comes from the Service Application (client) ID
        /// field within the Azure service application registration (portal.azure.com->Azure Active Directory->
        /// App Registrations (Preview)->Service -> Application (client) ID.
        /// This is stored in a variable so it can be 'played with' during testing.
        /// </summary>
        internal static string ValidScope
        {
            get;
            set;
        }

        /// <summary>
        /// Class constructor to initialize the Valid Scope.
        /// </summary>
        static TokenInController()
        {
            ValidScope = ConfigurationManager.AppSettings["ida:Audience"];
            
            if (ValidScope == null)
            {
                MessageHandler.Information("No ida:Audience defined, using default (for testing)");
                ValidScope = "XXXXXXXX";
            }
        }

        /// <summary>
        /// Get: New login/token has been approved.
        /// </summary>
        /// <returns>HTML to close the login dialog box.</returns>
        [Route("api/TokenIn")]
        [HttpGet]
        public HttpResponseMessage Get()
        {
            try
            {
                MessageHandler.Information($"{MessageHandler.Time}: New TokenIn Request... '{this.Request.Headers.Referrer.ToString()}'");

                SaveToken(this.Request.Headers.Referrer.ToString());
            }
            catch (Exception ex)
            {
                // Ignore Invalid call quietly, returning normal
                MessageHandler.Error($"Invalid call to TokenIn/Get", this.Request, ex);
            }

            HttpResponseMessage response = new HttpResponseMessage();
            response.Content = new StringContent(AttachmentConstants.CloseWindowHtml);
            response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/html");

            return response;
        }

        /// <summary>
        /// Function required for unneeded IDisposeTrackable interface and has to be near the top of the file
        /// </summary>
        /// <returns>Null, nothing...</returns>
        public IDisposeTracker GetDisposeTracker()
        {
            return null;
        }

        /// <summary>
        /// Suppress Dispose Tracker, required for unneeded IDisposeTrackable interface
        /// </summary>
        public void SuppressDisposeTracker()
        {
        }

        /// <summary>
        /// Save the token for use by a call to this service.  If invalid token, then silently act as if accepted
        /// </summary>
        /// <param name="referer">Referer parameter on call to this entry point</param>
        internal static void SaveToken(string referer)
        {
            var queryDictionary = System.Web.HttpUtility.ParseQueryString(referer);

            string scope = queryDictionary["scope"];
            string state = queryDictionary["state"];

            if ((scope != null) && (state != null) && scope.StartsWith(ValidScope))
            {
                string[] stateParts = state.Split('|');

                string jsonWebToken;

                if (stateParts.Length == 1)
                {
                    jsonWebToken = stateParts[0];
                }
                else
                {
                    jsonWebToken = stateParts[1];
                }

                string emailAddress = ValidUsers.GetUserFromToken(jsonWebToken);

                if (!string.IsNullOrWhiteSpace(emailAddress))
                {
                    new ValidToken(emailAddress);
                }
            }
            else
            {
                MessageHandler.Error($"Invalid Token sent to Service.  Scope:'{scope}', State:'{state}', referer:'{referer}'");

                string ctx = queryDictionary["https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47/reprocess?ctx"];
                MessageHandler.Information($"CTX: '{ctx}', Claims:{Environment.NewLine}{ValidUsers.ShowClaims(ctx)}");
            }
        }
    }
}