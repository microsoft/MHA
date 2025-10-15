// ---------------------------------------------------------------------------
// <copyright file="HeaderSectionMissingRule.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    /// <summary>
    /// Definition of a simple rule to be passed to the JavaScript client
    /// </summary>
    public class HeaderSectionMissingRule : IRule
    {
        /// <summary>
        /// Type of Rule this is
        /// </summary>
        public string RuleType
        {
            get
            {
                return "HeaderMissingRule";
            }
        }

        /// <summary>
        /// Section in the header we are to check to see if this rule is True
        /// </summary>
        public string SectionToCheck
        {
            get;
        }

        /// <summary>
        /// Message to show when pattern fails.  May contain special characters as defined at graphemica.com
        /// </summary>
        public string MessageWhenPatternFails
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
        /// Create the Header Section Missing Validation Rule
        /// </summary>
        /// <param name="sectionToCheck">Where in the header to look for rule violations</param>
        /// <param name="message">Message to be displayed if the rule is true</param>
        /// <param name="displayAt">Where on the UI to display the message</param>
        /// <param name="cssPrefix">Prefix of the CSS style to use to display the message.</param>
        public HeaderSectionMissingRule(string sectionToCheck, string message, string[] displayAt, string cssPrefix)
        {
            this.SectionToCheck = sectionToCheck;
            this.MessageWhenPatternFails = message;
            this.SectionsInHeaderToShowError = displayAt;
            this.CssPrefix = cssPrefix;
        }
    }
}