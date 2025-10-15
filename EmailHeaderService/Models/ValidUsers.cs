// ---------------------------------------------------------------------------
// <copyright file="ValidUsers.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    using System;
    using System.Collections.Generic;
    using System.IdentityModel.Tokens.Jwt;
    using System.Linq;
    using System.Security.Claims;
    using System.Text;
    using EmailHeaderService.Utilities;
    using Newtonsoft.Json;

    /// <summary>
    /// Check to see if it is a valid user
    /// </summary>
    internal class ValidUsers
    {
        /// <summary>
        /// Class Initializer
        /// </summary>
        static ValidUsers()
        {
            DefaultUser = string.Empty;
            ExchangeAccessor = new ExchangeAccess();
            ValidUserList = new UserList();
        }

        /// <summary>
        /// User to be returned when accessing user from request token fails.
        /// </summary>
        internal static string DefaultUser
        {
            get;
            set;
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
        /// Set of users that can access the system
        /// </summary>
        internal static IUserList ValidUserList
        {
            get;
            set;
        }

        /// <summary>
        /// This function verifies the call is from a valid user that has been authorized.
        /// It:
        ///     1) Verifies the AttachmentToken is good
        ///     2) Test to see if user is on token cache (in memory list of users)
        ///     3) Checks to see if user is on the list of valid users (from file)
        ///     4) Waits to see if token arrives (when user logging in)
        /// </summary>
        /// <param name="request">Request from the user</param>
        /// <param name="tokenWaitTimeInMs">How long to wait for the authorization token from the tenant</param>
        /// <returns>True if request passes the validity tests.</returns>
        internal static bool RequestValid(ServiceRequest request, int tokenWaitTimeInMs)
        {
            try
            {
                string user = ValidUsers.GetUserFromRequest(request);

                // IF userToken in request is the same as the one in the claim
                if (user == request.UserToken)
                {
                    // IF token is valid exchange token
                    if (ExchangeAccessor.IsValidExchangeToken(request))
                    {
                        // IF user is on token cache
                        if (ValidToken.IsValid(user))
                        {
                            return true;
                        }

                        // IF user is already on the good user list
                        if (ValidUsers.RequestFromValidUser(request))
                        {
                            MessageHandler.Information($"{MessageHandler.Time}: User '{user}' found in user list file.");
                            return true;
                        }

                        // Wait for token to come in putting user on the good list
                        MessageHandler.Information($"{MessageHandler.Time}: Wait for token for '{user}'.");

                        if (ValidToken.WaitForTokenToBeValid(guid: user, millisecondsWaitTime: tokenWaitTimeInMs))
                        {
                            MessageHandler.Information($"{MessageHandler.Time}: Token for user '{user}' received.");
                            return true;
                        }

                        MessageHandler.Information($"{MessageHandler.Time}: User '{user}' not Valid.");
                    }
                    else
                    {
                        MessageHandler.Information($"Exchange Token is invalid");
                    }
                }
                else
                {
                    MessageHandler.Information($"Request UserToken is '{request.UserToken}' but claim is for '{user}'");
                }
            }
            catch (Exception ex)
            {
                MessageHandler.Error($"Exception trying to determine if user is valid: {ex.Message}", null, ex);
            }

            return false;
        }

        /// <summary>
        /// Test that the user in the valid exchange token (right now) is a valid user.
        /// </summary>
        /// <param name="request">Request from the user</param>
        /// <returns>True if this is a valid Exchange token and the user is a valid user</returns>
        internal static bool RequestFromValidUser(ServiceRequest request)
        {
            // Prevent any traceback from being visible to the user to reveal security information
            try
            {
                string requestingUser = GetUserFromRequest(request);

                // prevent accidental blank line in file from causing a security hole
                if (string.IsNullOrWhiteSpace(requestingUser))
                {
                    return false;
                }
                else
                {
                    return ValidUserList.ValidUsers.Contains(requestingUser.ToLower());
                }
             }
            catch (Exception ex)
            {
                MessageHandler.Error($"Exception trying to determine if user is valid: {ex.Message}", null, ex);
                return false;
            }
        }

        /// <summary>
        /// Extract out the User Name from the Service Request
        /// </summary>
        /// <param name="request">Service request sent from client</param>
        /// <returns>User email address</returns>
        internal static string GetUserFromRequest(ServiceRequest request)
        {
            return GetUserFromToken(request.AttachmentToken);
        }

        /// <summary>
        /// Get the user from the JWT Token that is in string format
        /// </summary>
        /// <param name="token">JWT token as string</param>
        /// <returns>User Email Address extracted from token</returns>
        internal static string GetUserFromToken(string token)
        {
            try
            {
                JwtSecurityToken jwt = new JwtSecurityToken(token);

                return GetUserFromClaims(jwt.Claims);
            }
            catch (Exception exception)
            {
                MessageHandler.Error($"Exception while getting user from security token, using default ('{DefaultUser}'): {exception.Message}", null, exception);
                return DefaultUser;
            }
        }

        /// <summary>
        /// Extract out the user from the set of claims (user in appctx.SMTP claim)
        /// </summary>
        /// <param name="claims">Set of claims</param>
        /// <returns>smtp claim</returns>
        internal static string GetUserFromClaims(IEnumerable<Claim> claims)
        {
            try
            {
                // Parse the appctx claim to get the auth metadata url
                var appctx = claims.FirstOrDefault(claim => claim.Type == "appctx");

                if (appctx != null)
                {
                    return ClaimValue(appctx, "smtp");
                }
                else
                {
                    var smtp = claims.FirstOrDefault(claim => claim.Type == "smtp");

                    return smtp.Value;
                }
            }
            catch (Exception exception)
            {
                MessageHandler.Error($"Exception while finding claim value, using default ('{DefaultUser}'): {exception.Message}", null, exception);
                return DefaultUser;
            }
        }

        /// <summary>
        /// Convert all the Claim entries in the client request into a string for display.
        /// Does not differenciate between those we look at and those we don't so as not to
        /// reveal how security works.
        /// </summary>
        /// <param name="request">Client Request</param>
        /// <returns>All claim information as a string</returns>
        internal static string ShowClaims(ServiceRequest request)
        {
            return ShowClaims(request.AttachmentToken);
        }

        /// <summary>
        /// Convert all the Claim entries in the Json Web Token into a string for display.
        /// Does not differenciate between those we look at and those we don't so as not to
        /// reveal how security works.
        /// </summary>
        /// <param name="jwt">Json Web Token</param>
        /// <returns>All claim information as a string</returns>
        internal static string ShowClaims(string jwt)
        {
            string results;

            try
            {
                JwtSecurityToken token = new JwtSecurityToken(jwt);

                results = ShowClaims(token.Claims);
            }
            catch
            {
                // Just return with whatever we have thus far
                results = "Exception attempting to show claims";
            }

            return results;
        }

        /// <summary>
        /// Show all the claims on the Claims collection
        /// </summary>
        /// <param name="claims">IENumerable set of claims</param>
        /// <returns>Claims as a 'human readable' string</returns>
        internal static string ShowClaims(IEnumerable<Claim> claims)
        {
            StringBuilder results = new StringBuilder();

            foreach (Claim claim in claims)
            {
                try
                {
                    StringBuilder temp = new StringBuilder();

                    temp.AppendLine($"   Claim {claim.Type}:");

                    var collection = JsonConvert.DeserializeObject<Newtonsoft.Json.Linq.JObject>(claim.Value);

                    foreach (var subClaim in collection)
                    {
                        temp.AppendLine($"      {subClaim.Key}: {subClaim.Value.ToString()}");
                    }

                    // Once we are sure this formed correctly
                    results.Append(temp.ToString());
                }
                catch
                {
                    try
                    {
                        results.AppendLine($"   Claim {claim.Type}: {claim.Value.ToString()}");
                    }
                    catch
                    {
                        results.AppendLine($"   Claim {claim.Type}");
                    }
                }
            }

            return results.ToString();
        }

        /// <summary>
        /// Extract out the particular Claim entry
        /// </summary>
        /// <param name="setOfValues">Set of Claim entries</param>
        /// <param name="key">Particular claim entry we want</param>
        /// <returns>Claim entry or empty string</returns>
        internal static string ClaimValue(Claim setOfValues, string key)
        {
            var collection = JsonConvert.DeserializeObject<Newtonsoft.Json.Linq.JObject>(setOfValues.Value);

            foreach (var child in collection)
            {
                if (child.Key == key)
                {
                    return child.Value.ToString();
                }
            }

            return string.Empty;
        }

        /// <summary>
        /// Remember this user as valid for future accesses
        /// </summary>
        /// <param name="userId">Name of user to remember</param>
        internal static void RememberUser(string userId)
        {
            IUserList userList = ValidUsers.ValidUserList;

            if (userList != null)
            {
                userList.RememberUser(userId);
            }
        }
    }
}