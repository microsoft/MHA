// ---------------------------------------------------------------------------
// <copyright file="AttachmentDetails.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    /// <summary>
    /// Data sent from requester to EmailHeaderService to tell which attachment we are interested in.
    /// </summary>
    public class AttachmentDetails
    {
        /// <summary>
        /// Attachment Type
        /// </summary>
        public string AttachmentType
        {
            get; set;
        }

        /// <summary>
        /// Content Type
        /// </summary>
        public string ContentType
        {
            get; set;
        }

        /// <summary>
        /// Attachment ID
        /// </summary>
        public string Id
        {
            get; set;
        }

        /// <summary>
        /// Is Attachment InLine
        /// </summary>
        public bool IsInline
        {
            get; set;
        }

        /// <summary>
        /// Attachment Name
        /// </summary>
        public string Name
        {
            get; set;
        }

        /// <summary>
        /// Attachment Size
        /// </summary>
        public int Size
        {
            get; set;
        }
    }
}
