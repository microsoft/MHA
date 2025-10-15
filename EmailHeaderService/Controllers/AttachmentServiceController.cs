// ---------------------------------------------------------------------------
// <copyright file="AttachmentServiceController.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics.CodeAnalysis;
    using System.IO;
    using System.Net;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using System.Web.Http;
    using EmailHeaderService;
    using EmailHeaderService.Models;
    using EmailHeaderService.Utilities;
    using Microsoft.Exchange.Diagnostics;

    /// <summary>
    /// Main Controller for the EmailHeaderService.  It receives requests for one or more
    /// requests for attachment information, gets the corresponding attachment from the
    /// Email Server, then decodes the header out of the attachment if it is an email or
    /// EML file.  It returns the set of decoded headers as a pair of attachment name, 
    /// header info.
    /// </summary>
    [SuppressMessage("Exchange.Usage", "EX0004:IDisposableMustBeIDisposeTrackable", Scope = "type",
        Target = "Microsoft.Exchange.Hygiene.ReactiveTools.EmailHeaderService.AttachmentServiceController", Justification = "Stylebot Generated FxCop Exclusion.")]
    ////[Authorize]
    public class AttachmentServiceController : ApiController, IDisposeTrackable
    {
        /// <summary>
        /// Class Initializer.  Set up the default (normal) way to run.
        /// </summary>
        static AttachmentServiceController()
        {
            ExchangeAccessor = new ExchangeAccess();
        }

        /// <summary>
        /// Handle the Options Message
        /// </summary>
        /// <returns>Response with status code 200</returns>
        public HttpResponseMessage Options()
        {
            return new HttpResponseMessage { StatusCode = HttpStatusCode.OK };
        }

        /// <summary>
        /// Respond to a POST request.
        /// </summary>
        /// <param name="request">Service request information</param>
        /// <returns>Response to request as a ServiceResponse</returns>
        [Route("api/AttachmentService")]
        [HttpPost]
        public ServiceResponse PostAttachments(ServiceRequest request)
        {
            return this.GetAttachments(request);
        }

        /// <summary>
        /// Respond to a GET request.
        /// </summary>
        /// <param name="request">Service request information</param>
        /// <returns>Response to request as a ServiceResponse</returns>
        [Route("api/AttachmentService")]
        [HttpGet]
        public ServiceResponse GetAttachments(ServiceRequest request)
        {
            MessageHandler.Information(string.Format(AttachmentConstants.GetAttachmentsCalledMessage, ValidUsers.GetUserFromRequest(request)), this.Request);

            ServiceResponse response = new ServiceResponse();
            response.Message = string.Empty;

            // When request comes from IOS device, RestUrl has a slash on the end.  Not so with
            // other devices.  Fix to make all devices look the same
            if (request.RestUrl != null && request.RestUrl.EndsWith("/"))
            {
                request.RestUrl = request.RestUrl.Substring(0, request.RestUrl.Length - 1);
            }

            try
            {
                if (ValidUsers.RequestValid(request, request.TimeoutInMs))
                {
                    response = this.GetAttachmentsFromExchangeServer(request);
                    response.Message = string.Empty;
                }
                else
                {
                    response.IsError = true;
                    response.Message = AttachmentConstants.SecurityTokenInvalid;
                }
            }
            catch (Exception ex)
            {
                MessageHandler.Error($"Error Handling Post Request: {ex.Message}", this.Request, ex);

                if (IsFatalException(ex))
                {
                    throw;
                }

                response.IsError = true;
                response.Message = AttachmentConstants.ResponseToClientWhenError;
            }

            string responseMessage = response.IsError ? $"Error: {response.Message}" : "No Errors";

            MessageHandler.Information($"{MessageHandler.Time}: Response {responseMessage} Number of Attachment data returned {response.AttachmentsProcessed.ToString()} ", this.Request);

            // Trigger start of token cleanup
            ValidToken.CleanUp();

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
        /// Item used to 'inject' different accessor's.  Note this object is created dynamically by the .Net Web Api
        /// so had to do the injection this way.
        /// </summary>
        internal static IExchangeAccess ExchangeAccessor
        {
            get;
            set;
        }

        /// <summary>
        /// Is the exception Fatal
        /// </summary>
        /// <param name="e">Exception we are checking</param>
        /// <returns>True if the exception is fatal</returns>
        internal static bool IsFatalException(Exception e)
        {
            return e is AccessViolationException
                || e is AppDomainUnloadedException
                || e is BadImageFormatException
                || e is DataMisalignedException
                || e is InsufficientExecutionStackException
                || e is MemberAccessException
                || e is OutOfMemoryException
                || e is StackOverflowException
                || e is ThreadAbortException
                || e is InternalBufferOverflowException
                || e is System.Security.SecurityException
                || e is System.Runtime.InteropServices.SEHException
                || e is TaskCanceledException;
        }

        /// <summary>
        /// Create the XML for the Header from the response received from the Exchange Server
        /// </summary>
        /// <param name="webResponse">Response from Exchange Server</param>
        /// <returns>Header text as XML string</returns>
        private static string CreateXmlFromResponse(ExchangeAccessResponse webResponse)
        {
            return webResponse.ResponseString;
        }

        /// <summary>
        /// Create the response to the Client
        /// </summary>
        /// <param name="processedCount">Number of attachments processed</param>
        /// <param name="attachmentNames">List of attachment names</param>
        /// <param name="attachmentHeaders">List of attachment headers</param>
        /// <returns>Service response to return to Client</returns>
        private static ServiceResponse CreateResponseToClient(int processedCount, List<string> attachmentNames, List<string> attachmentHeaders)
        {
            ServiceResponse response = new ServiceResponse();
            response.AttachmentNames = attachmentNames.ToArray();
            response.AttachmentHeaders = attachmentHeaders.ToArray();
            response.AttachmentsProcessed = processedCount;
            return response;
        }

        /// <summary>
        /// This method does the work of making an Exchange Web Services (EWS) request
        /// or an Exhange REST request to get the attachments from the Exchange Server
        /// then decodes the returned data. This implementation makes an individual
        /// request for each attachment.  It then decodes the response from the Exchange Server
        /// and if it contains a valid email header, returns that info via the ServiceResponse
        /// </summary>
        /// <param name="request">ServiceRequest from the caller</param>
        /// <returns>ServiceResponse to return to the caller populated with attachment name/header info</returns>
        private ServiceResponse GetAttachmentsFromExchangeServer(ServiceRequest request)
        {
            int processedCount = 0;
            List<string> attachmentNames = new List<string>();
            List<string> attachmentHeaders = new List<string>();

            foreach (AttachmentDetails attachment in request.Attachments)
            {
                MessageHandler.Information(string.Format(AttachmentConstants.ProcessingAttachmentMessage, attachment.Name, ValidUsers.GetUserFromRequest(request)), this.Request);

                try
                {
                    ExchangeAccessResponse webResponse;

                    string attachmentIdToUse = attachment.Id;

                    if (request.IsRest)
                    {
                        // IOS sends slashes instead of dashes, at times
                        attachmentIdToUse = attachment.Id.Replace('/', '-');

                        webResponse = ExchangeAccessor.GetAttachment(request, attachmentIdToUse);
                    }
                    else
                    {
                        webResponse = ExchangeAccessor.DoRequestToExchangeServer(request, attachmentIdToUse);
                    }

                    // If the response is okay, create an XML document from the
                    // response and process the request.
                    if (webResponse.StatusCode == HttpStatusCode.OK)
                    {
                        string encodedHeader = CreateXmlFromResponse(webResponse);

                        AttachmentDecoder decodedAttachment = new AttachmentDecoder(encodedHeader);

                        // IF we failed to decode the header, check to see if we can decode a REST version of the header
                        if (request.IsRest && !decodedAttachment.IsValidEmailAttachment && decodedAttachment.IsRestResponse(encodedHeader))
                        {
                            encodedHeader = ExchangeAccessor.GetAttachmentFromRestServer(request, attachmentIdToUse).ResponseString;

                            decodedAttachment = new AttachmentDecoder(encodedHeader);
                        }

                        if (decodedAttachment.IsValidEmailAttachment)
                        {
                            processedCount++;
                            attachmentNames.Add(decodedAttachment.Name);
                            attachmentHeaders.Add(decodedAttachment.Header);
                        }
                        else
                        {
                            string errorText = this.ExtractErrorInResponse(webResponse);

                            if (errorText == null)
                            {
                                MessageHandler.Information(string.Format(AttachmentConstants.IgnoringUnkownAttachmentMessage, attachment.Name), this.Request);
                            }
                            else
                            {
                                MessageHandler.Error($"Attempting to get Attachment '{attachment.Name}': {errorText}");
                            }
                        }
                    }
                }
                catch (WebException webException)
                {
                    MessageHandler.Error($"Attempting to get Attachment '{attachment.Name}': {webException.Message}", exception: webException);

                    if (webException.Response is HttpWebResponse)
                    {
                        HttpWebResponse errorResponse = webException.Response as HttpWebResponse;

                        if (errorResponse.StatusCode == HttpStatusCode.Unauthorized)
                        {
                            // IF we are unauthorized to get attachment, don't continue trying to get attachments
                            break;
                        }
                    }
                }
                catch (Exception ex)
                {
                    MessageHandler.Error($"Attempting to get Attachment '{attachment.Name}': {ex.Message}", exception: ex);
                }
            }

            ServiceResponse response = CreateResponseToClient(processedCount, attachmentNames, attachmentHeaders);

            return response;
        }

        /// <summary>
        /// Extract out the error message (if one) in the string returned from the Exchange request
        /// </summary>
        /// <param name="webResponse">Results from calling the Exchange Server</param>
        /// <returns>Error Text found inside results from Exchange Request</returns>
        private string ExtractErrorInResponse(ExchangeAccessResponse webResponse)
        {
            // Extract out the nested response messages
            string responseMessages = AttachmentDecoder.ExtractNestedXML(
                webResponse.ResponseString,
                "s:Envelope",
                "s:Body",
                "m:GetAttachmentResponse",
                "m:ResponseMessages");

            // IF message is an error
            if (responseMessages.StartsWith("<m:GetAttachmentResponseMessage ResponseClass=\"Error\">"))
            {
                string errorText = AttachmentDecoder.ExtractNestedXML(responseMessages, "m:MessageText");

                return $"Get Attachment Response: '{errorText}'";
            }

            return null;
        }
    }
}
