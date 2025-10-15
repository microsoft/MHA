// ---------------------------------------------------------------------------
// <copyright file="IRule.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    /// <summary>
    /// Define interface for rules
    /// </summary>
    public interface IRule
    {
        /// <summary>
        /// What type of rule is this? - String interpretted by client
        /// </summary>
        string RuleType
        {
            get;
        }
    }
}
