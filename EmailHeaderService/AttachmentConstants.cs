// ---------------------------------------------------------------------------
// <copyright file="AttachmentConstants.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService
{
    using EmailHeaderService.Utilities;

    /// <summary>
    /// Set of Constants used by the service
    /// </summary>
    internal static class AttachmentConstants
    {
        /// <summary>
        /// Email From Label
        /// </summary>
        internal static string EmailFromLabel
        {
            get
            {
                return "From";
            }
        }

        /// <summary>
        /// Email To Label
        /// </summary>
        internal static string EmailToLabel
        {
            get
            {
                return "To";
            }
        }

        /// <summary>
        /// Email Reply to Field Label
        /// </summary>
        internal static string EmailReplyToLabel
        {
            get
            {
                return "Reply-To";
            }
        }

        /// <summary>
        /// Error Message returned to Client when Error occurs
        /// </summary>
        internal static string ResponseToClientWhenError
        {
            get
            {
                return Properties.Settings.Default.ErrorProcessingAttachments;
            }
        }

        /// <summary>
        /// Error Message returned to Client when Attachment Token is Invalid.
        /// </summary>
        internal static string SecurityTokenInvalid
        {
            get
            {
                return Properties.Settings.Default.SecurityTokenInvalid;
            }
        }

        /// <summary>
        /// Framework for call to Exchange Server
        /// </summary>
        internal static string ExchangeSoapRequestWithoutBody
        {
            get
            {
                return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n" +
                    "  <soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n" +
                    "   xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"\r\n" +
                    "   xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"\r\n" +
                    "   xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\">\r\n" +
                    "   <soap:Header>\r\n" +
                    "   <t:RequestServerVersion Version=\"Exchange2013\" />\r\n" +
                    "   </soap:Header>\r\n" +
                    "   <soap:Body>\r\n" +
                    "   {0}\r\n" +
                    "   </soap:Body>\r\n" +
                    "  </soap:Envelope>";
            }
        }

        /// <summary>
        /// Body of message to exchange server to retrieve attachment information
        /// </summary>
        internal static string GetAttachmentSoapBody
        {
            get
            {
                return "<GetAttachment xmlns=\"http://schemas.microsoft.com/exchange/services/2006/messages\"\r\n" +
                       " xmlns:t=\"http://schemas.microsoft.com/exchange/services/2006/types\">\r\n" +
                       " <AttachmentShape/>\r\n" +
                       " <AttachmentIds>\r\n" +
                       " <t:AttachmentId Id=\"{0}\"/>\r\n" +
                       " </AttachmentIds>\r\n" +
                       "</GetAttachment>";
            }
        }

        /// <summary>
        /// Template used in ExchangeAccess.GetEmailMessage
        /// </summary>
        internal static string GetEmailMessageUrlTemplate
        {
            get
            {
                return "{0}/v2.0/me/messages/{1}";
            }
        }

        /// <summary>
        /// Template used in EchangeAccess.GetAttachment
        /// </summary>
        internal static string GetEmailUrlTemplate
        {
            get
            {
                return "{0}/v2.0/me/messages/{1}/attachments/{2}";
            }
        }

        /// <summary>
        /// Template used in ExchangeAccess.GetAttachmentFromRestServer
        /// </summary>
        internal static string GetAttachmentFromRestServerTemplate
        {
            get
            {
                return "{0}/v2.0/me/messages/{1}/attachments/{2}?$expand=Microsoft.OutlookServices.ItemAttachment/Item";
            }
        }

        /// <summary>
        /// Get Attachments Called
        /// </summary>
        internal static string GetAttachmentsCalledMessage
        {
            get
            {
                return MessageHandler.Time + ": User '{0}' called https://.../api/GetAttachments";
            }
        }

        /// <summary>
        /// Processing Attachment Message
        /// </summary>
        internal static string ProcessingAttachmentMessage
        {
            get
            {
                return "Processing Attachment '{0}' for user '{1}'";
            }
        }

        /// <summary>
        /// Attachment type unknown, ignoring message
        /// </summary>
        internal static string IgnoringUnkownAttachmentMessage
        {
            get
            {
                return "Attachment '{0}' not a valid email and ignored";
            }
        }

        /// <summary>
        /// Get Rules Called
        /// </summary>
        internal static string GetRulesCalledMessage
        {
            get
            {
                return MessageHandler.Time + ": User '{0}' called https://.../api/GetRules : {1}";
            }
        }

        /// <summary>
        /// General Exception Message
        /// </summary>
        internal static string RecoverableExceptionMessage
        {
            get
            {
                return "Exception while {0}: '{1}'";
            }
        }

        /// <summary>
        /// Context for Exception Error Message
        /// </summary>
        internal static string GettingAttachmentFromRestServerText
        {
            get
            {
                return "Getting Attachment from Rest Server";
            }
        }

        /// <summary>
        /// String that will close a window without prompting the user...
        /// </summary>
        internal static string CloseWindowHtml
        {
            get
            {
                return "<!DOCTYPE html>" +
                       "<html>" +
                       "<head>" +
                       "<title>Test</title><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />" +
                       "<script type=\"text/javascript\">" +
                       "function closeWindow() {window.open('', '_self', ''); window.close();}" +
                       "window.onload = closeWindow;" +
                       "</script>" +
                       "</head><body> </body></html>";
            }
        }
    }
}