// ---------------------------------------------------------------------------
// <copyright file="ValidToken.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Utilities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using EmailHeaderService.Models;
    using Microsoft.Exchange.ExchangeSystem;

    /// <summary>
    /// Routines to determine if a token is valid (the GUID) has been sent as approved
    /// by the server.
    /// </summary>
    internal class ValidToken
    {
        /// <summary>
        /// Class Constructor
        /// </summary>
        static ValidToken()
        {
            Tokens = new List<ValidToken>();
            ValidDuration = new TimeSpan(hours: 1, minutes: 0, seconds: 0);
        }

        /// <summary>
        /// How to display this item when debugging.
        /// </summary>
        /// <returns>String to display</returns>
        public override string ToString()
        {
            return $"Token for '{this.TheGuid}' expires {this.ExpirationTime.ToString("yyyy-MM-dd HH:mm:ss.fff")}";
        }

        /// <summary>
        /// Is the Guid a valid token
        /// </summary>
        /// <param name="guid">Guid to test</param>
        /// <returns>True if Guid flagged as Valid and not expired</returns>
        internal static bool IsValid(string guid)
        {
            ExDateTime now = ExDateTime.Now;

            lock (Tokens)
            {
                return Tokens.Any(token => (token.ExpirationTime > now) && (token.TheGuid == guid));
            }
        }

        /// <summary>
        /// Check to see if token is valid waiting for up to wait-time for token to become valid.
        /// If valid token found within the wait time, then token is removed from valid token list
        /// so that it can't be used again.
        /// </summary>
        /// <param name="guid">Guid for token we are looking for</param>
        /// <param name="millisecondsWaitTime">How long to wait</param>
        /// <returns>True if token is valid within the wait time.</returns>
        internal static bool WaitForTokenToBeValid(string guid, int millisecondsWaitTime = 3000)
        {
            // Setup ending time
            ExDateTime endWaitTime = ExDateTime.Now + new TimeSpan(days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: millisecondsWaitTime);

            bool results;
            int delay = millisecondsWaitTime < 100 ? millisecondsWaitTime : 100;

            // While we don't have a valid token for this guid and we haven't exceeded the wait time
            while ((!(results = IsValid(guid))) && (ExDateTime.Now < endWaitTime))
            {
                Thread.Sleep(delay);
            }

            return results;
        }

        /// <summary>
        /// Remove the token(s) with the guid from the set of valid tokens.
        /// Thread Safe
        /// </summary>
        /// <param name="guid">Guid to remove from collection</param>
        internal static void RemoveToken(string guid)
        {
            lock (Tokens)
            {
                Tokens.RemoveAll(token => token.TheGuid == guid);
            }
        }

        /// <summary>
        /// Number of tokens that are currently on tokens list
        /// </summary>
        internal static int NumberTokensManaging
        {
            get
            {
                lock (Tokens)
                {
                    return Tokens.Count;
                }
            }
        }

        /// <summary>
        /// Remove all expired guids from the collection in background.
        /// Thread Safe
        /// </summary>
        internal static void CleanUp()
        {
            // Clear any expired tokens on background thread (after returning data)
            new Thread(() =>
            {
                Thread.CurrentThread.IsBackground = true;

                ExDateTime now = ExDateTime.Now;

                MessageHandler.Information($"{MessageHandler.Time}: Cleaning up tokens, have {NumberTokensManaging} tokens.");

                lock (Tokens)
                {
                    Tokens.RemoveAll(token => token.ExpirationTime < now);
                }

                MessageHandler.Information($"{MessageHandler.Time}: After cleanup, have {NumberTokensManaging} tokens.");
            }).Start();
        }

        /// <summary>
        /// Remove all entries from Tokens List
        /// </summary>
        internal static void ResetTokenList()
        {
            lock (Tokens)
            {
                Tokens.RemoveAll(token => true);
            }
        }

        /// <summary>
        /// List of tokens from the token list, one per line in the string.
        /// </summary>
        internal static string TokensToString
        {
            get
            {
                StringBuilder results = new StringBuilder();

                lock (Tokens)
                {
                    Tokens.ForEach(token => { results.AppendLine(token.ToString()); });
                }

                return results.ToString();
            }
        }

        /// <summary>
        /// Length of time before the token is invalidated (default value set in class constructor)
        /// </summary>
        internal static TimeSpan ValidDuration
        {
            get;
            set;
        }

        /// <summary>
        /// Set of tokens currently being maintained
        /// </summary>
        private static List<ValidToken> Tokens
        {
            get;
            set;
        }

        /// <summary>
        /// Add a token to the set of valid tokens, replacing previous similar token if any.
        /// Thread Safe
        /// </summary>
        /// <param name="newToken">Token to add</param>
        private static void Add(ValidToken newToken)
        {
            lock (Tokens)
            {
                // Remove similar token on list if any
                Tokens.RemoveAll(token => token.TheGuid == newToken.TheGuid);

                // Add new token to list
                Tokens.Add(newToken);
            }

            MessageHandler.Information($"{MessageHandler.Time}: Added/Replaced token {newToken.TheGuid}");
        }

        /// <summary>
        /// GUID that is possibly valid (if not past expiration time)
        /// </summary>
        private string TheGuid
        {
            get;
        }

        /// <summary>
        /// Time, afterwhich the entry needs to be removed
        /// </summary>
        private ExDateTime ExpirationTime
        {
            get;
        }

        /// <summary>
        /// Valid Token contstructor
        /// </summary>
        /// <param name="guid">Guid associated with the login authentication</param>
        /// <param name="writeToFile">Write the new token to the file (default is True, Write to file).</param>
        internal ValidToken(string guid, bool writeToFile = true)
        {
            this.TheGuid = guid;

            // Keep token around for plenty of time for user to be written to file
            this.ExpirationTime = ExDateTime.Now + ValidDuration;
            Add(this);

            if (writeToFile)
            {
                // Save this user off for future reference
                ValidUsers.RememberUser(guid);
            }
        }
    }
}