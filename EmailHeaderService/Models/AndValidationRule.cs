// ---------------------------------------------------------------------------
// <copyright file="AndValidationRule.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    /// <summary>
    /// Definition of rule that is true if the collection of sub-rules are all true.
    /// </summary>
    public class AndValidationRule
    {
        /// <summary>
        /// Message to show when pattern fails.  May contain special characters as defined at graphemica.com
        /// </summary>
        public string Message
        {
            get;
        }

        /// <summary>
        /// Set of sections where the error should be displayed
        /// </summary>
        public string[] SectionsInHeaderToShowError
        {
            get;
        }

        /// <summary>
        /// Prefix to aid in finding entry in Cascade Style Sheet to use when displaying information
        /// about this error failing.
        /// </summary>
        public string CssPrefix
        {
            get;
        }

        /// <summary>
        /// Array of rules that must all be true prior to this And rule being true
        /// </summary>
        public SimpleValidationRule[] RulesToAnd
        {
            get;
        }

        /// <summary>
        /// Define an And Validation Rule to pass back to the Client JavaScript
        /// </summary>
        /// <param name="message">Message to display if all the simple rules are true</param>
        /// <param name="displayAt">Location in the Header where the message is to be displayed.</param>
        /// <param name="cssPrefix">CSS Format to use when displaying the rule</param>
        /// <param name="simpleRules">Set of rules that must be true to make the and rule true.</param>
        public AndValidationRule(string message, string[] displayAt, string cssPrefix, params SimpleValidationRule[] simpleRules)
        {
            this.Message = message;
            this.SectionsInHeaderToShowError = displayAt;
            this.CssPrefix = cssPrefix;
            this.RulesToAnd = simpleRules;
        }
    }
}