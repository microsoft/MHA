// ---------------------------------------------------------------------------
// <copyright file="ServiceResponse.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    /// <summary>
    /// Response data from Email Header Service, returned to Client.  'attachmentNames' and 'attachmentHeaders' are
    /// parallel arrays which have the name and header of the attachments that are emails.
    /// </summary>
    public class ServiceResponse
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
        /// How many attachments were processed
        /// </summary>
        public int AttachmentsProcessed
        {
            get; set;
        }

        /// <summary>
        /// Array of names of the attachments (synced with AttachmentHeaders) with
        /// AttachmentsProcessed entries
        /// </summary>
        public string[] AttachmentNames
        {
            get; set;
        }

        /// <summary>
        /// Array of headers associated with the attachments (synced with AttachmentNames)
        /// with AttachmentsProcessed entries
        /// </summary>
        public string[] AttachmentHeaders
        {
            get; set;
        }
    }
}
