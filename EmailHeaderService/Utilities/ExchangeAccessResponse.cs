// ---------------------------------------------------------------------------
// <copyright file="ExchangeAccessResponse.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Utilities
{
    using System;
    using System.IO;
    using System.Net;
    using System.Text;

    /// <summary>
    /// Class to absract out the response from Outlook Exchange Access class
    /// </summary>
    public class ExchangeAccessResponse
    {
        /// <summary>
        /// Status Code from HTTP call
        /// </summary>
        public HttpStatusCode StatusCode
        {
            get;
        }

        /// <summary>
        /// Response Stream returned from call
        /// </summary>
        public string ResponseString
        {
            get;
        }

        /// <summary>
        /// Construct a response manually
        /// </summary>
        /// <param name="response">String response</param>
        /// <param name="statusCode">HTTP Status Code</param>
        public ExchangeAccessResponse(string response = "", HttpStatusCode statusCode = HttpStatusCode.OK)
        {
            this.ResponseString = response;
            this.StatusCode = statusCode;
        }

        /// <summary>
        /// Create a response from the HttpWebResponse Object
        /// </summary>
        /// <param name="webResponse">Actual response from Web Call</param>
        internal ExchangeAccessResponse(HttpWebResponse webResponse)
        {
            try
            {
                this.StatusCode = webResponse.StatusCode;

                using (StreamReader stringReader = new StreamReader(webResponse.GetResponseStream(), Encoding.UTF8))
                {
                    this.ResponseString = stringReader.ReadToEnd();
                    stringReader.Close();
                }
            }
            catch (Exception ex)
            {
                MessageHandler.RecoverableExceptionMessage("trying to read response from Exchange Server", ex);
                this.ResponseString = null;
            }
        }

        /// <summary>
        /// Default return value when converting to string.  Useful for debugging
        /// </summary>
        /// <returns>Status Code and Response as string</returns>
        public override string ToString()
        {
            return $"StatusCode: {this.StatusCode}, Response: {this.ResponseString}";
        }
    }
}