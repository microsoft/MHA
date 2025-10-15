// ---------------------------------------------------------------------------
// <copyright file="RulesServiceController.cs" company="Microsoft">
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
    /// Rules access controller.  This controller validates the user, and if valid, returns 
    /// the set of rules to display/highlight in the Message Header Plugin.  These rules
    /// are then applied against the data in the headers that are displayed by the plugin.
    /// For invalid users, no rules are revealed.
    /// </summary>
    [SuppressMessage("Exchange.Usage", "EX0004:IDisposableMustBeIDisposeTrackable", Scope = "type",
        Target = "Microsoft.Exchange.Hygiene.ReactiveTools.EmailHeaderService.AttachmentServiceController", Justification = "Stylebot Generated FxCop Exclusion.")]
    ////[Authorize]
    public class RulesServiceController : ApiController, IDisposeTrackable
    {
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
        /// <returns>Response to request as a RulesResponse</returns>
        [Route("api/RulesService")]
        [HttpPost]
        public RulesResponse PostRules(ServiceRequest request)
        {
            return this.GetRules(request);
        }

        /// <summary>
        /// Respond to a GET request.
        /// </summary>
        /// <param name="request">Service request information</param>
        /// <returns>Response to request as a RulesResponse</returns>
        [Route("api/RulesService")]
        [HttpGet]
        public RulesResponse GetRules(ServiceRequest request)
        {
            MessageHandler.Information($"{MessageHandler.Time}: GetRules Started...");

            RulesResponse response = new RulesResponse();
            response.Message = "Success";
            string message = "Success";

            bool validUser = ValidUsers.RequestValid(request, request.TimeoutInMs);

            response = this.DoGetRules(validUser, request, response);

            if (!validUser)
            {
                message = $"{AttachmentConstants.SecurityTokenInvalid}{Environment.NewLine}{ValidUsers.ShowClaims(request)}";
            }

            this.RecordUserAttemptedAccess(request, message);

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
        /// Actually get the rules.  This code is separated to allow unit tests to run against it.
        /// </summary>
        /// <param name="validUser">Is the user valid</param>
        /// <param name="request">Request from the user</param>
        /// <param name="response">Response to send back to the user</param>
        /// <returns>Response to be returned</returns>
        internal RulesResponse DoGetRules(bool validUser, ServiceRequest request, RulesResponse response)
        {
            if (validUser)
            {
                response.SimpleRules = this.LoadSimpleValidationRules();
                response.AndRules = this.LoadAndValidationRules();
            }
            else
            {
                response.IsError = true;
                response.Message = AttachmentConstants.SecurityTokenInvalid;
            }

            return response;
        }

        /// <summary>
        /// Return the set of simple validation rules.  These are the rules that have a single criteria to check.
        /// Source of these rules may be changed in the future.  For right now they are hard-coded here.
        /// </summary>
        /// <returns>Array of Simple Validation Rules</returns>
        private IRule[] LoadSimpleValidationRules()
        {
            List<IRule> results = new List<IRule>();

            results.Add(new SimpleValidationRule("Authentication-Results", "spf=fail", "\u274c Sender failed validation", new string[] { "From", "Connecting IP Address" }, "error"));
            results.Add(new SimpleValidationRule("Authentication-Results", "dkim=fail.*", "\u274c Sender failed validation", new string[] { "From" }, "error"));
            results.Add(new SimpleValidationRule("Authentication-Results", "dmarc=fail", "\u274c Sender failed validation", new string[] { "From" }, "error"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:SPM", "\u274c Message was marked as spam", new string[] { "SFV", "X-Forefront-Antispam-Report" }, "error"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "IPV:CAL", "\u2713 IP is in customer allow list", new string[] { "Connecting IP Address" }, "error"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:SKI", "\u2713 Message not filtered because it originates inside the same tenant", new string[] { "From" }, "ok"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:BLK", "\u2713 Sender address is blocked by user rule", new string[] { "From" }, "error"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:SFE", "\u2713 Sender address is in users safe senders list", new string[] { "From" }, "error"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:DMS", "\u274c Spam verdict ignored due to tenant settings", new string[] { "SFV" }, "error"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:SKQ", "\u2713 Message released from users quarentine", new string[] { "X-Forefront-Antispam-Report" }, "ok"));
            results.Add(new SimpleValidationRule("X-MS-Exchange-Organization-ExtractionTags", "CTRY:NG", "\u274C  IP Originating from Nigeria", new string[] { "X-MS-Exchange-Organization-ExtractionTags" }, "error"));
            results.Add(new SimpleValidationRule("X-Forefront-Antispam-Report", "CTRY:NG", "\u274C  IP Originating from Nigeria", new string[] { "X-Forefront-Antispam-Report" }, "error"));
            results.Add(new SimpleValidationRule("X-Microsoft-Antispam", "BCL:[6789]", "\u274C  Bulk Sender Reputation is bad", new string[] { "X-Microsoft-Antispam", "BCL" }, "error"));
            results.Add(new HeaderSectionMissingRule("X-Forefront-Antispam-Report", "\u274c Section 'X-Forefront-Antispam-Report' missing from email header", new string[] { "X-Forefront-Antispam-Report" }, "error"));
            results.Add(new HeaderSectionMissingRule("X-Microsoft-Antispam-Mailbox-Delivery", "\u274c Section 'X-Microsoft-Antispam-Mailbox-Delivery' missing from email header", new string[] { "X-Microsoft-Antispam-Mailbox-Delivery" }, "error"));

            return results.ToArray();
        }

        /// <summary>
        /// Return the set of complex validation rules.  These are the rules that combine one or more simple rules into 
        /// a single rule that triggers if all the simple rules trigger.
        /// </summary>
        /// <returns>Array of complex rules.</returns>
        private AndValidationRule[] LoadAndValidationRules()
        {
            List<AndValidationRule> results = new List<AndValidationRule>();

            // The following rules are from Davids Spreadsheet
            results.Add(new AndValidationRule(
                  "\u274c Email filtered as spam but sent to inbox",
                  new string[] { "SFV" },
                  "error",
                  new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:SPM", "Email Spam", new string[] { "X-Forefront-Antispam-Report" }, "ok"),
                  new SimpleValidationRule("X-Microsoft-Antispam-Mailbox-Delivery", "dest:I", "Email sent to Inbox", new string[] { "X-Microsoft-Antispam-Mailbox-Delivery" }, "ok")));
            results.Add(new AndValidationRule(
                  "\u274c Email was not marked as spam but was sent to junk folder",
                  new string[] { "SFV" },
                  "error",
                  new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:NSPM", "Email Not Spam", new string[] { "X - Forefront - Antispam - Report" }, "ok"),
                  new SimpleValidationRule("X-Microsoft-Antispam-Mailbox-Delivery", "dest:J", "Email sent to Spam Folder", new string[] { "X-Microsoft-Antispam-Mailbox-Delivery" }, "ok")));
            results.Add(new AndValidationRule(
                  "\u274c Email was filtered as spam but sent to custom folder due to user settings",
                  new string[] { "SFV" },
                  "error",
                  new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:SPM", "Email Spam", new string[] { "X-Forefront-Antispam-Report" }, "ok"),
                  new SimpleValidationRule("X-Microsoft-Antispam-Mailbox-Delivery", "dest:C", "Email sent to Custom Folder", new string[] { "X-Microsoft-Antispam-Mailbox-Delivery" }, "ok")));
            results.Add(new AndValidationRule(
                  "\u274c Email was not marked as spam, but was sent to custom folder due to user settings",
                  new string[] { "SFV" },
                  "error",
                  new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:NSPM", "Email Not Spam", new string[] { "X-Forefront-Antispam-Report" }, "ok"),
                  new SimpleValidationRule("X-Microsoft-Antispam-Mailbox-Delivery", "dest:C", "Email sent to Custom Folder", new string[] { "X-Microsoft-Antispam-Mailbox-Delivery" }, "ok")));

            // Note empty 'displayAt' array for sub-rules
            results.Add(new AndValidationRule(
                "\u2714 Email not spam and sent to inbox",
                new string[] { "SFV" },
                "ok",
                new SimpleValidationRule("X-Forefront-Antispam-Report", "SFV:NSPM", "Email Not Spam", Array.Empty<string>(), "ok"),
                new SimpleValidationRule("X-Microsoft-Antispam-Mailbox-Delivery", "dest:I", "Email sent to Inbox", Array.Empty<string>(), "ok")));

            return results.ToArray();
        }

        /// <summary>
        /// Record the user access and response.  Don't record any info about the user (other than ID).
        /// Trace file would show if invalid user got a successful return.  Also show invalid user access
        /// attempts.
        /// </summary>
        /// <param name="request">Client service request</param>
        /// <param name="results">Results of the call into the service</param>
        private void RecordUserAttemptedAccess(ServiceRequest request, string results)
        {
            string text = string.Format(AttachmentConstants.GetRulesCalledMessage, ValidUsers.GetUserFromRequest(request), results);

            MessageHandler.Information(text, this.Request);
        }
    }
}
