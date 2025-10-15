// ---------------------------------------------------------------------------
// <copyright file="RulesResponse.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    /// <summary>
    /// Response data from Email Header Service, returned to Client.  'attachmentNames' and 'attachmentHeaders' are
    /// parallel arrays which have the name and header of the attachments that are emails.
    /// </summary>
    public class RulesResponse
    {
        /// <summary>
        /// Did an error occur that prohibited the request from completing
        /// </summary>
        public bool IsError
        {
            get; set;
        }

        /// <summary>
        /// Error message, if an error occurred
        /// </summary>
        public string Message
        {
            get; set;
        }

        /// <summary>
        /// Array of Simple Rules to apply
        /// </summary>
        public IRule[] SimpleRules
        {
            get; set;
        }

        /// <summary>
        /// Array of Complex/And Rules to return to the JavaScript Client
        /// </summary>
        public AndValidationRule[] AndRules
        {
            get; set;
        }
    }
}
