// ---------------------------------------------------------------------------
// <copyright file="ServiceRequest.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    using System;

    /// <summary>
    /// Service Request from Client to Email Header Service.
    /// </summary>
    public class ServiceRequest
    {
        /// <summary>
        /// Attachment Token
        /// </summary>
        public string AttachmentToken
        {
            get; set;
        }

        /// <summary>
        /// User Identity Token
        /// </summary>
        public string IdToken
        {
            get; set;
        }

        /// <summary>
        /// Exchange Web Server URL
        /// </summary>
        public string EwsUrl
        {
            get; set;
        }

        /// <summary>
        /// URL to use for REST calls
        /// </summary>
        public string RestUrl
        {
            get; set;
        }

        /// <summary>
        /// Identifier of current email
        /// </summary>
        public string EmailId
        {
            get;
            set;
        }

        /// <summary>
        /// Identifier of current email for use in REST commands
        /// </summary>
        public string EmailRestId
        {
            get;
            set;
        }

        /// <summary>
        /// Is this command to always use REST
        /// </summary>
        public bool IsRest
        {
            get; set;
        }

        /// <summary>
        /// Identifier of user that will be used to compare with token sent from Auth routines
        /// </summary>
        public string UserToken
        {
            get;
            set;
        }

        /// <summary>
        /// How long to wait for validation.  If first-time may want to wait for user to login.
        /// Passed from client to host.
        /// </summary>
        public int TimeoutInMs
        {
            get;
            set;
        }

        /// <summary>
        /// What type of browser are we running on
        /// </summary>
        public string Browser
        {
            get;
            set;
        }

        /// <summary>
        /// Attachments array
        /// </summary>
        public AttachmentDetails[] Attachments
        {
            get; set;
        }

        /// <summary>
        /// Create ServiceRequest instance with empty Attachments array.
        /// </summary>
        public ServiceRequest()
        {
            this.Attachments = Array.Empty<AttachmentDetails>();
        }
    }
}
