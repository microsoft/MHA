// ---------------------------------------------------------------------------
// <copyright file="MessageHandler.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Utilities
{
    using System;
    using System.Net.Http;
    using System.Runtime.CompilerServices;
    using Microsoft.Exchange.ExchangeSystem;

    /// <summary>
    /// General Message Handler.
    /// Responsible for recording the message to ...
    /// </summary>
    internal static class MessageHandler
    {
        /// <summary>
        /// Format the time for display
        /// </summary>
        public static string Time
        {
            get
            {
                string timeString = ExDateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
                return timeString;
            }
        }

        /// <summary>
        /// The level of event that is being reported.
        /// </summary>
        private enum ErrorLevel
        {
            Information,
            Warning,
            Error
        }

        /// <summary>
        /// Record the Error
        /// </summary>
        /// <param name="errorText">Error Text</param>
        /// <param name="request">Request that is currently being processed</param>
        /// <param name="exception">Exception object (if any)</param>
        /// <param name="memberName">Auto-generated caller name</param>
        /// <param name="sourceFile">Auto-generated caller source file</param>
        /// <param name="sourceLineNumber">Auto-generated caller source file line number</param>
        internal static void Error(
            string errorText,
            HttpRequestMessage request = null,
            Exception exception = null,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFile = "",
            [CallerLineNumber] int sourceLineNumber = 0)
        {
            HandleMessage(ErrorLevel.Error, errorText, request, exception, memberName, sourceFile, sourceLineNumber);
        }

        /// <summary>
        /// Record the Warning
        /// </summary>
        /// <param name="warningText">Warning Text</param>
        /// <param name="request">Request that is currently being processed</param>
        /// <param name="exception">Exception object (if any)</param>
        /// <param name="memberName">Auto-generated caller name</param>
        /// <param name="sourceFile">Auto-generated caller source file</param>
        /// <param name="sourceLineNumber">Auto-generated caller source file line number</param>
        internal static void Warning(
            string warningText,
            HttpRequestMessage request = null,
            Exception exception = null,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFile = "",
            [CallerLineNumber] int sourceLineNumber = 0)
        {
            HandleMessage(ErrorLevel.Warning, warningText, request, exception, memberName, sourceFile, sourceLineNumber);
        }

        /// <summary>
        /// Record the Information Message
        /// </summary>
        /// <param name="informationText">Information Text</param>
        /// <param name="request">Request that is currently being processed</param>
        /// <param name="exception">Exception object (if any)</param>
        /// <param name="memberName">Auto-generated caller name</param>
        /// <param name="sourceFile">Auto-generated caller source file</param>
        /// <param name="sourceLineNumber">Auto-generated caller source file line number</param>
        internal static void Information(
            string informationText,
            HttpRequestMessage request = null,
            Exception exception = null,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFile = "",
            [CallerLineNumber] int sourceLineNumber = 0)
        {
            HandleMessage(ErrorLevel.Information, informationText, request, exception, null, null, sourceLineNumber);
        }

        /// <summary>
        /// Record the simple, not unexpected, exception
        /// </summary>
        /// <param name="context">Context of the exception</param>
        /// <param name="exception">Exception object (if any)</param>
        /// <param name="memberName">Auto-generated caller name</param>
        /// <param name="sourceFile">Auto-generated caller source file</param>
        /// <param name="sourceLineNumber">Auto-generated caller source file line number</param>
        internal static void RecoverableExceptionMessage(
            string context,
            Exception exception,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFile = "",
            [CallerLineNumber] int sourceLineNumber = 0)
        {
            string message = string.Format(AttachmentConstants.RecoverableExceptionMessage, context, exception.Message);
            HandleMessage(ErrorLevel.Information, message, null, exception, null, null, sourceLineNumber);
        }

        /// <summary>
        /// Handle the actual recording of the information.
        /// 
        /// This is the point where we can change how the message is handled
        /// </summary>
        /// <param name="level">Level of message</param>
        /// <param name="text">Text of message</param>
        /// <param name="request">Request that is currently being processed</param>
        /// <param name="exceptionObject">Exception that caused the event (if any)</param>
        /// <param name="caller">Method that generated this message</param>
        /// <param name="sourceFile">Soure file that generated this message</param>
        /// <param name="lineNumber">Source file line number that generated this message</param>
        private static void HandleMessage(
            ErrorLevel level,
            string text,
            HttpRequestMessage request,
            Exception exceptionObject,
            string caller,
            string sourceFile,
            int lineNumber)
        {
            string formattedMessage;

            if (string.IsNullOrEmpty(caller) || string.IsNullOrEmpty(sourceFile))
            {
                formattedMessage = $"{level.ToString()}: {text}";
            }
            else
            {
                formattedMessage = $"{level.ToString()}: {text} in file: '{sourceFile}', Method: '{caller}', Line: {lineNumber}";
            }

            System.Diagnostics.Trace.WriteLine(formattedMessage);
        }
    }
}