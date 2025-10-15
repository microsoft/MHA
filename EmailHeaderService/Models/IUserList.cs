// ---------------------------------------------------------------------------
// <copyright file="IUserList.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    using System.Collections.Generic;

    /// <summary>
    /// Abstraction for object that returns the set of valid Users
    /// </summary>
    public interface IUserList
    {
        /// <summary>
        /// Return the set of valid users to allow at this time.
        /// </summary>
        IEnumerable<string> ValidUsers { get; }

        /// <summary>
        /// Remember the user for future reference
        /// </summary>
        /// <param name="userName">Unique user identifier</param>
        void RememberUser(string userName);
    }
}
