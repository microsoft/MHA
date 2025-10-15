// <copyright file="Settings.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>

namespace EmailHeaderService.Properties
{
    /// <summary>
    /// This class allows you to handle specific events on the settings class:
    ///  The SettingChanging event is raised before a setting's value is changed.
    ///  The PropertyChanged event is raised after a setting's value is changed.
    ///  The SettingsLoaded event is raised after the setting values are loaded.
    ///  The SettingsSaving event is raised before the setting values are saved.
    /// </summary>
    internal sealed partial class Settings
    {
        /// <summary>
        /// Settings Constuctor
        /// </summary>
        public Settings()
        {
            // // To add event handlers for saving and changing settings, uncomment the lines below:
            //
            // this.SettingChanging += this.SettingChangingEventHandler;
            //
            // this.SettingsSaving += this.SettingsSavingEventHandler;
        }

        /// <summary>
        /// Settings Changing Event Handler
        /// </summary>
        /// <param name="sender">The event Sender</param>
        /// <param name="e">The Event</param>
        private void SettingChangingEventHandler(object sender, System.Configuration.SettingChangingEventArgs e)
        {
            // Add code to handle the SettingChangingEvent event here.
        }

        /// <summary>
        /// Settings Saving Event Handler
        /// </summary>
        /// <param name="sender">The event Sender</param>
        /// <param name="e">The Event</param>
        private void SettingsSavingEventHandler(object sender, System.ComponentModel.CancelEventArgs e)
        {
            // Add code to handle the SettingsSaving event here.
        }
    }
}
