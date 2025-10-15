// ---------------------------------------------------------------------------
// <copyright file="ExchangeAccess.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Utilities
{
    using System;
    using System.IO;
    using System.Net;
    using System.Text;
    using EmailHeaderService.Models;

    /// <summary>
    /// Functions to access the email Exchange Server
    /// </summary>
    internal class ExchangeAccess : IExchangeAccess
    {
        /// <summary>
        /// Determine if the Request contains a valid Exchange Server token
        /// </summary>
        /// <param name="request">Request from the user.  Callback token (from caller) is verified against Exchange Server</param>
        /// <returns>True if it is valid</returns>
        public bool IsValidExchangeToken(ServiceRequest request)
        {
            return this.ValidServerAccess(request.RestUrl, request.EmailRestId, request.AttachmentToken);
        }

        /// <summary>
        /// Create and send a request to the Exchange Server to get the Header Information
        /// </summary>
        /// <param name="request">Service Request from Client</param>
        /// <param name="attachmentId">Attachment that we want header for</param>
        /// <returns>Response from Exchange Server</returns>
        public ExchangeAccessResponse DoRequestToExchangeServer(ServiceRequest request, string attachmentId)
        {
            string messageBody = string.Format(AttachmentConstants.GetAttachmentSoapBody, attachmentId);
            return new ExchangeAccessResponse(SendSoapMessageToExchangeServer(request.EwsUrl, request.AttachmentToken, "POST", messageBody));
        }

        /// <summary>
        /// Get the Email message itself (not the attachments)
        /// </summary>
        /// <param name="serverUrl">Rest Url of Exchange Server</param>
        /// <param name="messageToken">Rest Email Message ID</param>
        /// <param name="accessToken">Access Token from client</param>
        /// <returns>Http Web Response from call to server</returns>
        public HttpWebResponse GetEmailMessage(string serverUrl, string messageToken, string accessToken)
        {
            string fullUrl = string.Format(AttachmentConstants.GetEmailMessageUrlTemplate, serverUrl, messageToken);

            return this.MakeRestCall(fullUrl, accessToken, addPrefer: true);
        }

        /// <summary>
        /// Get the header for the attachment.  Works for some types of attachments.  For others (MSG attachments)
        /// you need to use GetAttachmentFromRestServer
        /// </summary>
        /// <param name="request">Original request from cliet with access information</param>
        /// <param name="attachmentId">Attachment we want from the server</param>
        /// <returns>ExchangeAccessResponse created from Http Web Response</returns>
        public ExchangeAccessResponse GetAttachment(ServiceRequest request, string attachmentId)
        {
            string fullUrl = string.Format(AttachmentConstants.GetEmailUrlTemplate, request.RestUrl, request.EmailRestId, attachmentId);

            HttpWebResponse callResponse = this.MakeRestCall(fullUrl, request.AttachmentToken, addPrefer: false);

            return new ExchangeAccessResponse(callResponse);
        }

        /// <summary>
        /// Get the attachment from the REST Server
        /// </summary>
        /// <param name="request">Original request from client with access information</param>
        /// <param name="attachmentId">Attachment we want from the server</param>
        /// <returns>Exchange access response with web access results</returns>
        public ExchangeAccessResponse GetAttachmentFromRestServer(ServiceRequest request, string attachmentId)
        {
            // Make the request to the Exchange server and get the response.
            try
            {
                string fullUrl = string.Format(AttachmentConstants.GetAttachmentFromRestServerTemplate, request.RestUrl, request.EmailRestId, attachmentId);

                HttpWebResponse webResponse = this.MakeRestCall(fullUrl, request.AttachmentToken, addPrefer: true);

                return new ExchangeAccessResponse(webResponse);
            }
            catch (WebException webException)
            {
                HttpStatusCode statusCode = HttpStatusCode.NotFound;

                if (webException.Response is System.Net.HttpWebResponse)
                {
                    statusCode = (webException.Response as HttpWebResponse).StatusCode;
                }

                MessageHandler.RecoverableExceptionMessage(AttachmentConstants.GettingAttachmentFromRestServerText, webException);

                return new ExchangeAccessResponse(webException.Message, statusCode);
            }
            catch (Exception exception)
            {
                MessageHandler.RecoverableExceptionMessage(AttachmentConstants.GettingAttachmentFromRestServerText, exception);
                return new ExchangeAccessResponse(statusCode: HttpStatusCode.NotFound);
            }
        }

        /// <summary>
        /// Send actual SOAP message to the exchange server.
        /// </summary>
        /// <param name="serverUrl">Exchange Server URL</param>
        /// <param name="accessToken">Client supplied access token</param>
        /// <param name="method">HTTP Method type (i.e. OPTIONS, GET, PUT...)</param>
        /// <param name="soapBody">Body of the message to send to Exchange</param>
        /// <returns>Response from the call</returns>
        private static HttpWebResponse SendSoapMessageToExchangeServer(string serverUrl, string accessToken, string method, string soapBody)
        {
            // Prepare a web request object.
            HttpWebRequest webRequest = WebRequest.CreateHttp(serverUrl);

            webRequest.Headers.Add(name: "Authorization", value: string.Format("Bearer {0}", accessToken));
            webRequest.PreAuthenticate = true;
            webRequest.AllowAutoRedirect = false;
            webRequest.Method = method;
            webRequest.ContentType = "text/xml; charset=utf-8";

            if (method != "GET")
            {
                // Construct the SOAP message for the GetAttchment operation.
                byte[] bodyBytes = Encoding.UTF8.GetBytes(string.Format(AttachmentConstants.ExchangeSoapRequestWithoutBody, soapBody));
                webRequest.ContentLength = bodyBytes.Length;

                Stream requestStream = webRequest.GetRequestStream();
                requestStream.Write(bodyBytes, 0, bodyBytes.Length);
                requestStream.Close();
            }

            // Make the request to the Exchange server and get the response.
            HttpWebResponse webResponse = (HttpWebResponse)webRequest.GetResponse();
            return webResponse;
        }

        /// <summary>
        /// Is the information in the request valid to make server calls?
        /// </summary>
        /// <param name="serverUrl">Rest Server Url</param>
        /// <param name="messageToken">Email Rest ID</param>
        /// <param name="accessToken">Access token from client</param>
        /// <returns>True if the information is valid</returns>
        private bool ValidServerAccess(string serverUrl, string messageToken, string accessToken)
        {
            // Make the request to the Exchange server and get the response.
            try
            {
                HttpWebResponse webResponse = this.GetEmailMessage(serverUrl, messageToken, accessToken);
                return webResponse.StatusCode == HttpStatusCode.OK;
            }
            catch (Exception exception)
            {
                MessageHandler.RecoverableExceptionMessage("trying to validate user", exception);

                // Not a valid access token or other security issue
                return false;
            }
        }

        /// <summary>
        /// Make a REST call to the exchange server with no message body
        /// </summary>
        /// <param name="fullUrl">Full URL to include in the GET statement</param>
        /// <param name="accessToken">Bearer access token</param>
        /// <param name="addPrefer">Whether to add the Prefer header 'outlook.body-content-type="text"'</param>
        /// <returns>Http Web Response from call</returns>
        private HttpWebResponse MakeRestCall(string fullUrl, string accessToken, bool addPrefer)
        {
            // Prepare a web request object.
            HttpWebRequest webRequest = WebRequest.CreateHttp(fullUrl);

            webRequest.Headers.Add(name: "Authorization", value: string.Format("Bearer {0}", accessToken));
            webRequest.PreAuthenticate = true;
            webRequest.AllowAutoRedirect = false;
            webRequest.Method = "GET";
            webRequest.ContentType = "text/xml; charset=utf-8";
            if (addPrefer)
            {
                webRequest.Headers.Add(name: "Prefer", value: "outlook.body-content-type=\"text\"");
            }

            MessageHandler.Information($"{webRequest.Method}: {fullUrl}");

            // Make the request to the Exchange server and get the response.
            HttpWebResponse webResponse = (HttpWebResponse)webRequest.GetResponse();
            return webResponse;
        }
    }
}