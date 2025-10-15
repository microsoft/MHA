// ---------------------------------------------------------------------------
// <copyright file="AttachmentDecoder.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace EmailHeaderService.Models
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using System.Web;
    using System.Web.Helpers;
    using EmailHeaderService.Utilities;
    using Newtonsoft.Json.Linq;

    /// <summary>
    /// Functionality to decode attachments.  The decoder will decode the XML attachment description from the
    /// Exchange Server into the name and Header information for Email Attachments.
    /// </summary>
    public class AttachmentDecoder
    {
        /// <summary>
        /// Is this a Valid Email Attachment
        /// </summary>
        public bool IsValidEmailAttachment
        {
            get;
        }

        /// <summary>
        /// Name of the attachment
        /// </summary>
        public string Name
        {
            get;
        }

        /// <summary>
        /// Header Information for the attachment
        /// </summary>
        public string Header
        {
            get;
        }

        /// <summary>
        /// Create Decoder for the exchange attachment information.
        /// </summary>
        /// <param name="exchangeAttachmentInfoString">XML returned from the Exchange Server Get Attachment call</param>
        public AttachmentDecoder(string exchangeAttachmentInfoString)
        {
            this.IsValidEmailAttachment = false;

            try
            {
                // Get the header information for MSG attachment if there is any
                this.Header = CreateEmailHeaderFromResponse(exchangeAttachmentInfoString);

                // IF there is header information (then we have an email attachment)
                if (this.Header != string.Empty)
                {
                    this.Name = ExtractName("ItemAttachment", exchangeAttachmentInfoString);
                    this.IsValidEmailAttachment = true;
                }
                else if (IsEmlFile(exchangeAttachmentInfoString))
                {
                    // Get header information for EML attachment if there is any
                    this.Name = ExtractName("FileAttachment", exchangeAttachmentInfoString);
                    this.Header = DecodeEMLFile(exchangeAttachmentInfoString);
                    this.IsValidEmailAttachment = true;
                }
                else if (this.IsRestResponse(exchangeAttachmentInfoString))
                {
                    this.Name = ExtractRestDataField("Name", exchangeAttachmentInfoString);
                    this.Header = this.DecodeRestResponse(exchangeAttachmentInfoString);
                    this.IsValidEmailAttachment = !string.IsNullOrEmpty(this.Header);
                }
            }
            catch (Exception exception)
            {
                MessageHandler.Error($"Exception while decoding attachment (attachment ignored): {exception.Message}", null, exception);

                if (IsFatalException(exception))
                {
                    throw;
                }
            }
        }

        /// <summary>
        /// Is the data from the exchange Server
        /// </summary>
        /// <param name="exchangeData">Data returned from the Exchange Server</param>
        /// <returns>True if this appears to be a REST response</returns>
        public bool IsRestResponse(string exchangeData)
        {
            string dataContext = ExtractRestDataField("@odata.context", exchangeData);
            string contentType = ExtractRestDataField("ContentType", exchangeData);

            return dataContext != string.Empty & !contentType.Contains("image");
        }

        /// <summary>
        /// Decode the resonse from the REST functions
        /// </summary>
        /// <param name="exchangeData">Data returned from the Exchange server</param>
        /// <returns>Header as text string</returns>
        public string DecodeRestResponse(string exchangeData)
        {
            string item = ExtractRestDataField("Item", exchangeData);

            if (string.IsNullOrWhiteSpace(item))
            {
                string contentBytes = ExtractRestDataField("ContentBytes", exchangeData);

                string decodedContent = Decode(encodeType: "B", encodedString: contentBytes);

                string header = DecodeMimeSections(decodedContent);

                return header;
            }
            else
            {
                StringBuilder results = new StringBuilder();

                // Extract email addresses, which have to be recreated from Mailbox entries in the XML
                AddRestMailboxInfo(AttachmentConstants.EmailFromLabel, "From", item, ref results);
                AddRestMailboxInfo(AttachmentConstants.EmailReplyToLabel, "ReplyTo", item, ref results);
                AddRestMailboxInfo(AttachmentConstants.EmailToLabel, "ToRecipients", item, ref results);

                string internetHeaders = ExtractRestDataField("InternetMessageHeaders", item);
                DynamicJsonArray headers = Json.Decode(internetHeaders);

                if (headers != null)
                {
                    for (int index = 0; index < headers.Length; index++)
                    {
                        dynamic entry = headers[index];

                        string thisEntryString = $"{entry["Name"]}: {entry["Value"]}";
                        results.AppendLine(thisEntryString);
                    }
                }

                return results.ToString();
            }
        }

        /// <summary>
        /// Finds nested XML contents.  Input must be XML of format:
        ///   element1
        ///        :
        ///      element2
        ///         element3
        ///            :
        ///         end element3
        ///          :
        ///      end element2
        ///       :
        ///   end element1
        /// </summary>
        /// <param name="xml">Source XML</param>
        /// <param name="elements">Set of elements (i.e. element1, element2, element3) where elements are XML elements</param>
        /// <returns>Innermost XML that has specified nesting or string.Empty</returns>
        internal static string ExtractNestedXML(string xml, params string[] elements)
        {
            string resultingXml = xml;

            foreach (string elementLabel in elements)
            {
                resultingXml = ElementInnerXML(elementLabel, xml);

                if (string.IsNullOrWhiteSpace(resultingXml))
                {
                    break;
                }
            }

            return resultingXml;
        }

        #region Decode REST Response

        /// <summary>
        /// Extract the Rest field data out of the json data
        /// </summary>
        /// <param name="title">Name of the field to extract</param>
        /// <param name="json">Data to extract field from</param>
        /// <returns>String data associated with the field extracted</returns>
        internal static string ExtractRestDataField(string title, string json)
        {
            var jsonToken = ExtractPropertFromJsonText(json, title);

            if (jsonToken == null)
            {
                return string.Empty;
            }

            string result = jsonToken.ToString(Newtonsoft.Json.Formatting.None).Trim('"');

            return result;
        }

        /// <summary>
        /// Extract the particular property out of the JSON text
        /// </summary>
        /// <param name="json">Text to extract property from</param>
        /// <param name="property">Property to Extract</param>
        /// <returns>Property within the json token as JToken or null if property not found</returns>
        internal static JToken ExtractPropertFromJsonText(string json, string property)
        {
            JObject jsonObject = JObject.Parse(json);

            return jsonObject[property];
        }

        /// <summary>
        /// Extract all the Email addresses associated with a particular field in the REST JSON and add it
        /// to the header.
        /// </summary>
        /// <param name="headerLabel">Label in the email header to assign the addresses</param>
        /// <param name="sectionName">Section in the JSON to extract the email information.</param>
        /// <param name="encodedHeader">JSON to extract from</param>
        /// <param name="results">String Builder where email information will be added.</param>
        private static void AddRestMailboxInfo(string headerLabel, string sectionName, string encodedHeader, ref StringBuilder results)
        {
            // Extract the section out of the header (which is in JSON)
            string section = ExtractRestDataField(sectionName, encodedHeader);

            if (string.IsNullOrWhiteSpace(section))
            {
                return;
            }

            // IF not an array, make it an array
            if (!section.StartsWith("["))
            {
                section = $"[{section}]";
            }

            // Extract out the names and email addresses in the JSON section
            DynamicJsonArray addressArray = Json.Decode(section);
            List<string> names = new List<string>();
            List<string> emailAddresses = new List<string>();

            for (int index = 0; index < addressArray.Length; index++)
            {
                dynamic entry = addressArray[index];

                names.Add(entry["EmailAddress"]["Name"]);
                emailAddresses.Add(entry["EmailAddress"]["Address"]);
            }

            // Create list of addresses (name followed by email address)
            List<string> addresses = new List<string>();

            for (int listIndex = 0; listIndex < names.Count; listIndex++)
            {
                string name = names[listIndex];
                string emailAddress = emailAddresses[listIndex];

                // Put double quotes around names that contain parenthesis
                if (name.Contains("("))
                {
                    name = '"' + name + '"';
                }

                addresses.Add($"{name} <{emailAddress}>");
            }

            // Join addresses together and add to the header
            string headerText = $"{headerLabel}: {string.Join(",\r\n   ", addresses)}";

            results.AppendLine(headerText);
        }

        #endregion Decode REST Response

        #region Decode Email Attachment
        /// <summary>
        /// Extract the message header information out of the response from the Email server to get an attachment.
        /// </summary>
        /// <param name="response">Response from the GetAttachment call to the Email Server</param>
        /// <returns>Recreated email header as string</returns>
        private static string CreateEmailHeaderFromResponse(string response)
        {
            // Extract info for attachment
            string emailAttachment;

            try
            {
                // Create header subset with information related to email attachment
                emailAttachment = ElementInnerXML(label: "t:ItemAttachment", xml: response);
            }
            catch (Exception exception)
            {
                // This may happen for a very poorly formed attachment.  Want to just ignore this attachment and move on to
                // the next one.
                MessageHandler.RecoverableExceptionMessage("looking for 't:ItemAttachment'", exception);

                emailAttachment = string.Empty;
            }

            if (!string.IsNullOrEmpty(emailAttachment))
            {
                return DecodeHeader(emailAttachment);
            }

            return string.Empty;
        }

        /// <summary>
        /// Re-create the Header Information from the attached email
        /// </summary>
        /// <param name="emailAttachment">Attachment XML that we are recreating header for</param>
        /// <returns>String with recreated header information</returns>
        private static string DecodeHeader(string emailAttachment)
        {
            StringBuilder results = new StringBuilder();

            // Extract email addresses, which have to be recreated from Mailbox entries in the XML
            AddMailboxInfo(AttachmentConstants.EmailFromLabel, "From", emailAttachment, ref results);
            AddMailboxInfo(AttachmentConstants.EmailReplyToLabel, "ReplyTo", emailAttachment, ref results);
            AddMailboxInfo(AttachmentConstants.EmailToLabel, "ToRecipients", emailAttachment, ref results);

            // Extract each of the fields out of the encoded Header (XML) and put into header results
            CreateInternetMessageHeaders(emailAttachment, ref results);

            string encodedReturnValue = results.ToString();
            string returnValue = HttpUtility.HtmlDecode(encodedReturnValue);

            return returnValue;
        }

        /// <summary>
        /// Scan through the XML file for all the Elements InternetMessageHeader, extract out
        /// the information in there and insert into results as fieldName: fieldValue
        /// </summary>
        /// <param name="sourceXml">XML to scan for elements</param>
        /// <param name="results">String Builder with entries fieldName: fieldValue for each
        /// InternetMessageHeader found in input XML</param>
        private static void CreateInternetMessageHeaders(string sourceXml, ref StringBuilder results)
        {
            string pattern = $"<t:InternetMessageHeader HeaderName=\"(.*?)\">(.*?)<\\/t:InternetMessageHeader>";

            MatchCollection internetMessageHeaderElements = Regex.Matches(sourceXml, pattern);

            foreach (Match headerElement in internetMessageHeaderElements)
            {
                string section = headerElement.Groups[1].Value;
                string sectionValue = headerElement.Groups[2].Value;

                string headerEntry = $"{section}: {sectionValue}";

                results.AppendLine(headerEntry);
            }
        }

        /// <summary>
        /// Extract all the Email addresses associated with a particular field in the XML and add it
        /// to the header.
        /// </summary>
        /// <param name="headerLabel">Label in the email header to assign the addresses</param>
        /// <param name="encodedLabel">Section in the XML to extract the email information.</param>
        /// <param name="encodedHeader">XML to extract from</param>
        /// <param name="results">String Builder where email information will be added.</param>
        private static void AddMailboxInfo(string headerLabel, string encodedLabel, string encodedHeader, ref StringBuilder results)
        {
            List<string> names;
            List<string> emailAddresses;

            if (ExtractNameAndEmailAddress(encodedLabel, encodedHeader, out names, out emailAddresses))
            {
                List<string> addresses = new List<string>();

                for (int listIndex = 0; listIndex < names.Count; listIndex++)
                {
                    string name = names[listIndex];
                    string emailAddress = emailAddresses[listIndex];

                    // Put double quotes around names that contain parenthesis
                    if (name.Contains("("))
                    {
                        name = '"' + name + '"';
                    }

                    addresses.Add($"{name} <{emailAddress}>");
                }

                string headerText = $"{headerLabel}: {string.Join(",\r\n   ", addresses)}";

                results.AppendLine(headerText);
            }
        }

        /// <summary>
        /// Create List of email names/addresses that are referenced in the XML section
        /// </summary>
        /// <param name="label">Section in XML to get addresses from</param>
        /// <param name="encodedHeader">XML to extract addresses out of.</param>
        /// <param name="names">List of names addressed</param>
        /// <param name="emailAddresses">Actual Emails addressed</param>
        /// <returns>True if at least one email name/address extracted</returns>
        private static bool ExtractNameAndEmailAddress(
            string label, 
            string encodedHeader,
            out List<string> names, 
            out List<string> emailAddresses)
        {
            names = new List<string>();
            emailAddresses = new List<string>();

            string section = ElementInnerXML($"t:{label}", encodedHeader);

            string pattern = $"<t:Mailbox><t:Name>(.*?)<\\/t:Name><t:EmailAddress>(.*?)<\\/t:EmailAddress>.*?<\\/t:Mailbox>";

            MatchCollection mailboxReferences = Regex.Matches(section, pattern);

            foreach (Match mailbox in mailboxReferences)
            {
                names.Add(mailbox.Groups[1].Value);
                emailAddresses.Add(mailbox.Groups[2].Value);
            }

            return names.Count > 0;
        }

        #endregion Decode Email Attachment

        #region Decode EML File

        /// <summary>
        /// Decode the EML file, extracting out the Header
        /// </summary>
        /// <param name="xml">Attachment to extract content from</param>
        /// <returns>Decoded EML file header as string</returns>
        private static string DecodeEMLFile(string xml)
        {
            string content = ElementInnerXML(label: "t:Content", xml: xml);

            string decodedContent = Decode(encodeType: "B", encodedString: content);

            return DecodeMimeSections(decodedContent);
        }

        /// <summary>
        /// Is the XML an EML file?  Does this by extracting out the file name and seeing if
        /// the filename ends in EML.
        /// </summary>
        /// <param name="xml">XML to examine</param>
        /// <returns>True if it appears to be an EML file</returns>
        private static bool IsEmlFile(string xml)
        {
            string fileName = ExtractName("FileAttachment", xml);

            return Path.GetExtension(fileName).ToLower() == ".eml";
        }

        /// <summary>
        /// Decode each of the Mime encoded sections surrounded by '=?utf-8?X?' and '?=' where
        /// the 'X' is the encoding type.  It uses regular expressions to break the input up,
        /// then the Decode function to decode the MIME encoded text.
        ///
        /// This function was originaly written using Regex expressions, but was found to be
        /// very slow.  It was then rewritten using the FindMimeSection function instead of
        /// the Regex expression (see comments on that function).
        /// </summary>
        /// <param name="input">String with possibly one or more MIME encoded sub-sets</param>
        /// <returns>String without MIME encoded sections</returns>
        private static string DecodeMimeSections(string input)
        {
            string remainingString = input;

            StringBuilder results = new StringBuilder();
            string matchedString;
            string before;
            string encodeType;
            string encoded;

            // While it finds a MIME section in the 'remainingString'.  Note that the
            // FindMimeSection function updates the remaining string.
            while (FindMimeSection(
                        ref remainingString,
                        out matchedString,
                        out before,
                        out encodeType,
                        out encoded))
            {
                if (string.IsNullOrWhiteSpace(before.Trim()))
                {
                    // Ignore when only CR LF between encoded strings
                }
                else
                {
                    results.Append(before);
                }

                // Do actual decode of Mime string
                string decoded = Decode(encodeType, encoded.Trim());
                results.Append(decoded);
            }

            results.Append(remainingString);

            return results.ToString();
        }

        /// <summary>
        /// This function replaces the parsing of the Regex expression @"(.*?)=\?utf\-8\?(.)\?(.*?)\?="
        /// using Regex.Matches followed by a foreach through the resulting MatchCollection.
        /// When using that expression and parsing 4 sample EML files it took 18+ seconds to parse.
        /// Replacing Regex with the use of this code, the same 4 files were parsed in 0.046 seconds.
        /// </summary>
        /// <param name="input">As Input, the string to be parsed, At end of function, remaining string to be parsed</param>
        /// <param name="wholeMatch">Entire matched string, equvalent to Regex Match.Groups[0]</param>
        /// <param name="beforeMatch">Pattern matching the initial (.*?) in regex expression.  Part before '=?utf-8?.?' Match.Groups[1]</param>
        /// <param name="encodingType">Encode Type.  Equvalent to Match.Groups[2]</param>
        /// <param name="encodedMimeString">Encoded String.  Equvalent to Match.Groups[3]</param>
        /// <returns>True if an encoded Mime string found.  False if no more Mime strings in input.  If false, Input string unchanged.  Other outputs are empty.</returns>
        private static bool FindMimeSection(
                        ref string input, 
                        out string wholeMatch,
                        out string beforeMatch, 
                        out string encodingType, 
                        out string encodedMimeString)
        {
            if (string.IsNullOrEmpty(input))
            {
                wholeMatch = input;
                beforeMatch = string.Empty;
                encodingType = string.Empty;
                encodedMimeString = string.Empty;

                // No more MIME strings in input
                return false;
            }

            const char QuestionMark = '?';
            const string EndMarker = "?=";

            int mimeStartIndex;
            string startSeperator;

            string remainingString = input;
            StringBuilder beforeString = new StringBuilder();

            // While we found a possible MIME section (found the starting seperator)
            while ((mimeStartIndex = FindIndexMimeStart(remainingString, out startSeperator)) != -1)
            {
                string leading = remainingString.Substring(0, mimeStartIndex + startSeperator.Length);
                beforeString.Append(remainingString.Substring(0, mimeStartIndex));

                string afterUtf8String = remainingString.Substring(leading.Length);
                int endIndex = afterUtf8String.IndexOf(EndMarker);

                if ((afterUtf8String[1] == QuestionMark) && (endIndex > 2))
                {
                    // After finding the start seperator (while statement) we found a single character
                    // followed by a question mark, followed (sometime later) by the EndMarker ('?=').
                    beforeMatch = beforeString.ToString();
                    encodingType = afterUtf8String[0].ToString();
                    encodedMimeString = afterUtf8String.Substring(2, endIndex - 2);

                    // Build the entire string that this call matched (Regex.Match.Group[0])
                    wholeMatch = beforeString + startSeperator + encodingType + QuestionMark + encodedMimeString + EndMarker;

                    // Remove what we matched from the beginning of the input string
                    input = input.Substring(wholeMatch.Length);

                    // We found a MIME string
                    return true;
                }

                beforeString.Append(startSeperator);
                remainingString = remainingString.Substring(leading.Length);
            }

            // Note: input string is unchanged, as none of the input was processed.
            wholeMatch = string.Empty;
            beforeMatch = string.Empty;
            encodingType = string.Empty;
            encodedMimeString = string.Empty;

            // No more MIME Strings
            return false;
        }

        /// <summary>
        /// Find the index of the start of the next MIME section.  This function finds the beginning
        /// of a possible MIME section.  It identifies the start of a MIME section as either the 
        /// string of text '=?utf-8?' or '=?us-ascii?'.  It then returns the index of the starting
        /// location of that matching string.
        /// </summary>
        /// <param name="input">Input to search for MIME section.</param>
        /// <param name="seperator">OUT: string that was found to identify the MIME section start.</param>
        /// <returns>Like string.Index(...), Zero based index of the start of the MIME section, or -1 if no MIME section found.</returns>
        private static int FindIndexMimeStart(string input, out string seperator)
        {
            const string Utf8Seperator = "=?utf-8?";
            const string AsciiSeperator = "=?us-ascii?";

            int indexUtf8 = input.IndexOf(Utf8Seperator);
            int indexAscii = input.IndexOf(AsciiSeperator);

            if (indexUtf8 >= 0)
            {
                if ((indexAscii >= 0) && (indexAscii < indexUtf8))
                {
                    // Found both, but Ascii was first
                    seperator = AsciiSeperator;
                    return indexAscii;
                }
                else
                {
                    // Found UTF-8 first
                    seperator = Utf8Seperator;
                    return indexUtf8;
                }
            }
            else if (indexAscii >= 0)
            {
                seperator = AsciiSeperator;
                return indexAscii;
            }

            seperator = string.Empty;
            return -1;
        }

        /// <summary>
        /// Decode string.  This function does the MIME decoding.  It processing using the following decoding rules:
        /// 
        /// If encodeType is 'B' then converts from Base64String.
        /// If encodeType is 'Q' then it converts all the '=XX' strings (where XX is a hex number) into a single character
        ///   designated by the hex number.
        /// Otherwise it just returns the encoded string.
        /// </summary>
        /// <param name="encodeType">Type of encoding, currently only understand 'B' and 'Q'</param>
        /// <param name="encodedString">Encoded String</param>
        /// <returns>Decoded string as described.</returns>
        private static string Decode(string encodeType, string encodedString)
        {
            string results;

            if (encodeType == "B")
            {
                byte[] bytes = Convert.FromBase64String(encodedString);
                results = UnEncodeByteArray(bytes);
            }
            else if (encodeType == "Q")
            {
                Regex findEqualNumberPattern = new Regex(@"=[0-9A-F]{2}", RegexOptions.Multiline);

                MatchCollection equalStringsToReplace = findEqualNumberPattern.Matches(encodedString);

                results = encodedString;

                foreach (Match toReplace in equalStringsToReplace)
                {
                    try
                    {
                        byte[] b = new byte[] { byte.Parse(toReplace.Groups[0].Value.Substring(1), System.Globalization.NumberStyles.AllowHexSpecifier) };
                        char[] replacementCharacter = new ASCIIEncoding().GetChars(b);
                        results = results.Replace(toReplace.Groups[0].Value, replacementCharacter[0].ToString());
                    }
                    catch (Exception exception)
                    {
                        if (IsFatalException(exception))
                        {
                            // Following error will provide exact information to the Message Handler on where error occurred.
                            MessageHandler.Error($"Fatal Error: {exception.Message}", null, exception);

                            throw;
                        }
                        else
                        {
                            MessageHandler.Warning(
                                $"Error decoding string '{encodedString}' of type '{encodeType}'.  Returning encoded sting to allow user to view.  Error: {exception.Message}",
                                null,
                                exception);
                        }

                        results = encodedString;
                    }
                }
            }
            else
            {
                results = encodedString;
            }

            return results;
        }

        /// <summary>
        /// Convert byte array into UTF8 string
        /// </summary>
        /// <param name="array">Byte array to convert</param>
        /// <returns>String of format UTF8</returns>
        private static string UnEncodeByteArray(byte[] array)
        {
            StringBuilder results = new StringBuilder();

            bool decoded = false;

            if (array.Length > 2)
            {
                if ((array[0] == 255) && (array[1] == 254))
                {
                    results.Append(Encoding.Unicode.GetString(array));

                    decoded = true;
                }
            }

            if (!decoded)
            {
                results.Append(Encoding.UTF8.GetString(array));
            }

            return results.ToString();
        }

        #endregion Decode EML File

        /// <summary>
        /// Extract out the Inner XML from an ELement block with attributes.  Element block must be of format:
        /// 
        ///    Element Label ... data extracted...End Element Label
        ///    
        /// </summary>
        /// <param name="label">Element label to extract</param>
        /// <param name="xml">XML to extract from</param>
        /// <returns>Inner XML or string empty if none found.</returns>
        private static string ElementInnerXML(string label, string xml)
        {
            string pattern = $"<{label} .*?>(.*?)<\\/{label}>";

            string results = FindLabelInXml(xml, pattern, label);

            if (string.IsNullOrEmpty(results))
            {
                results = FindLabelInXml(xml, $"<{label}>(.*?)<\\/{label}>", label);
            }

            return results;
        }

        /// <summary>
        /// Find the label in the input XML using specified pattern to help find it
        /// </summary>
        /// <param name="source">Input XML to find label in</param>
        /// <param name="pattern">Pattern to use to find label</param>
        /// <param name="label">Label we are searching for, used for error messaging</param>
        /// <returns>Matching label contents</returns>
        private static string FindLabelInXml(string source, string pattern, string label)
        {
            try
            {
                Regex expressionParser = new Regex(pattern, RegexOptions.Singleline);

                Match match = expressionParser.Match(source);

                if (match.Groups.Count == 2)
                {
                    // Convert to Header Format
                    return match.Groups[1].Value;
                }
            }
            catch (Exception ex)
            {
                if (IsFatalException(ex))
                {
                    // Following error will provide exact information to the Message Handler on where error occurred.
                    MessageHandler.Error($"Fatal Error: {ex.Message}", null, ex);

                    throw;
                }
                else
                {
                    MessageHandler.Warning($"Element '<{label}> ... </{label}>' not found in xml.  Error: {ex.Message}", null, ex);
                }
            }

            return string.Empty;
        }

        /// <summary>
        /// Extract the  name from the XML.  It looks for the t:Name element within the
        /// t:{attachmentType} element
        /// </summary>
        /// <param name="attachmentType">Type of attachment, used for getting the context of the Name field</param>
        /// <param name="xml">XML string to extract file name from</param>
        /// <returns>Extracted filename</returns>
        private static string ExtractName(string attachmentType, string xml)
        {
            string fileAttachmentElementContents = ElementInnerXML(label: $"t:{attachmentType}", xml: xml);

            string fileName = ElementInnerXML(label: "t:Name", xml: fileAttachmentElementContents);

            return fileName;
        }

        /// <summary>
        /// Is the exception Fatal
        /// </summary>
        /// <param name="e">Exception we are checking</param>
        /// <returns>True if Exception is Fatal</returns>
        private static bool IsFatalException(Exception e)
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
    }
}