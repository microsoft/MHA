// ---------------------------------------------------------------------------
// <copyright file="IExchangeAccess.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Utilities
{
    using EmailHeaderService.Models;

    /// <summary>
    /// Interface to abstract out, to support testing, accesses to the Exchange Server
    /// </summary>
    public interface IExchangeAccess
    {
        /// <summary>
        /// Create and send a request to the Exchange Server to get Attachment Information
        /// </summary>
        /// <param name="request">Service Request from Client</param>
        /// <param name="attachmentId">Attachment that we want header for</param>
        /// <returns>Response from Exchange Server</returns>
        ExchangeAccessResponse GetAttachment(ServiceRequest request, string attachmentId);

        /// <summary>
        /// Create and send a request to the REST exchange Server to get Attachment Information
        /// </summary>
        /// <param name="request">Service Request from Client</param>
        /// <param name="attachmentId">Attachment that we want header for</param>
        /// <returns>Response from Exchange Server</returns>
        ExchangeAccessResponse GetAttachmentFromRestServer(ServiceRequest request, string attachmentId);

        /// <summary>
        /// Create and send a request to the Exchange Server to get the Header Information
        /// </summary>
        /// <param name="request">Service Request from Client</param>
        /// <param name="attachmentId">Attachment that we want header for</param>
        /// <returns>Response from Exchange Server</returns>
        ExchangeAccessResponse DoRequestToExchangeServer(ServiceRequest request, string attachmentId);

        /// <summary>
        /// Determine if the Request contains a valid Exchange Server token
        /// </summary>
        /// <param name="request">Request from the user.  Callback token (from caller) is verified against Exchange Server</param>
        /// <returns>True if it is valid</returns>
        bool IsValidExchangeToken(ServiceRequest request);
    }
}