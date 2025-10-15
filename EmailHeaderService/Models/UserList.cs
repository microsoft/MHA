// ---------------------------------------------------------------------------
// <copyright file="UserList.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Threading;
    using EmailHeaderService.Utilities;

    /// <summary>
    /// Default User List to be used in testing/production
    /// </summary>
    public class UserList : IUserList
    {
        /// <summary>
        /// Name of the file with the list of email addresses to accept.
        /// </summary>
        private static readonly string UsersFile = @"UserList.txt";

        /// <summary>
        /// Is this the first time Valid Users has been called?
        /// </summary>
        private static bool firstCallToCreateUserList = true;

        /// <summary>
        /// Lock to prevent multiple accesses to file
        /// </summary>
        private static object userFileLock = new object();

        /// <summary>
        /// Return the collection of valid users
        /// </summary>
        public IEnumerable<string> ValidUsers
        {
            get
            {
                List<string> results = new List<string>();

                try
                {
                    lock (userFileLock)
                    {
                        using (StreamReader reader = new StreamReader(FullUserFileName))
                        {
                            string aUser;

                            while ((aUser = reader.ReadLine()) != null)
                            {
                                if (!string.IsNullOrWhiteSpace(aUser))
                                {
                                    results.Add(aUser.ToLower());
                                }
                            }
                        }
                    }

                    if (firstCallToCreateUserList)
                    {
                        firstCallToCreateUserList = false;

                        MessageHandler.Information($"Using UserList file '{FullUserFileName}'");
                    }

                    this.AddUsersToTokenCache(results);
                }
                catch (Exception unableToOpenException)
                {
                    MessageHandler.Error($"Unable to open file '{UsersFile}': {unableToOpenException.Message}", null, unableToOpenException);
                }

                return results;
            }
        }

        /// <summary>
        /// Write the user information to the Users File.
        /// </summary>
        /// <param name="userName">Name of user to write out.</param>
        public void RememberUser(string userName)
        {
            new Thread(() =>
            {
                try
                {
                    lock (userFileLock)
                    {
                        VerifyUserFileExists();

                        using (StreamWriter writer = new StreamWriter(FullUserFileName, true))
                        {
                            writer.WriteLine(userName);
                            writer.Flush();
                            writer.Close();
                        }
                    }
                }
                catch (Exception exception)
                {
                    MessageHandler.Error(errorText: $"Writing user '{userName}' to file '{UsersFile}'", exception: exception);
                }
            }).Start();
        }

        /// <summary>
        /// Verify the user list file exists, and if not try to create it.
        /// </summary>
        /// <returns>True if file exists at end of function execution</returns>
        private static bool VerifyUserFileExists()
        {
            string fullFilePath = IisUserFilePath;

            if (File.Exists(fullFilePath))
            {
                return true;
            }

            string directory = Path.GetDirectoryName(fullFilePath);

            try
            {
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                using (StreamWriter newFile = new StreamWriter(fullFilePath))
                {
                    newFile.Close();
                }
            }
            catch (Exception exception)
            {
                MessageHandler.Error($"Unable to create file/path for '{fullFilePath}'", exception: exception);
            }

            return File.Exists(fullFilePath);
        }

        /// <summary>
        /// Retrieve the full file name of the UserList.Txt file.
        /// </summary>
        internal static string FullUserFileName
        {
            get
            {
                string fullPathToUsersFile = IisUserFilePath;

                if (!File.Exists(fullPathToUsersFile))
                {
                    fullPathToUsersFile = UsersFile;
                }

                return fullPathToUsersFile;
            }
        }

        /// <summary>
        /// Full path to the IIS UsersFile
        /// </summary>
        internal static string IisUserFilePath
        {
            get
            {
                string iisPath = System.Web.Hosting.HostingEnvironment.ApplicationPhysicalPath;
                string fullPathToUsersFile = $"{iisPath}bin\\{UsersFile}";

                return fullPathToUsersFile;
            }
        }

        /// <summary>
        /// Add the users to the cache without writing them back out to the file
        /// </summary>
        /// <param name="users">List of users to add to cache</param>
        private void AddUsersToTokenCache(IEnumerable<string> users)
        {
            foreach (string user in users)
            {
                // Add to cache but don't write out to file
                new ValidToken(user, false);
            }
        }
    }
}