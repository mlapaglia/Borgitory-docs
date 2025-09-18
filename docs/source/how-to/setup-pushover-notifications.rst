How to Set Up Pushover Notifications
====================================

This guide walks you through setting up Pushover notifications to receive mobile alerts for backup job completions and failures.

Overview
--------

Pushover is a simple push notification service that delivers real-time notifications to your phone, tablet, and desktop. Borgitory integrates with Pushover to send alerts about:

* Successful backup completions
* Backup failures and errors
* Cloud sync operations
* Schedule execution status

Prerequisites
-------------

Before starting, you'll need:

* A Pushover account (free tier available)
* Borgitory installed and running
* A mobile device with the Pushover app installed

Step 1: Create Pushover Account
-------------------------------

Sign Up for Pushover
~~~~~~~~~~~~~~~~~~~~

1. **Visit Pushover Website**
   
   * Go to https://pushover.net/
   * Click "Sign up" to create a free account
   * Verify your email address

2. **Install Mobile App**
   
   * Download Pushover from your app store:
     
     - `iOS App Store <https://apps.apple.com/us/app/pushover-notifications/id506088175>`_
     - `Google Play Store <https://play.google.com/store/apps/details?id=net.superblock.pushover>`_
   
   * Log in with your Pushover credentials
   * Test the app by sending yourself a test message

3. **Note Your User Key**
   
   * Log into the Pushover web dashboard
   * Your User Key is displayed on the main page
   * Copy this key - you'll need it for Borgitory configuration

Step 2: Create Pushover Application
-----------------------------------

Register Application
~~~~~~~~~~~~~~~~~~~~

1. **Create New Application**
   
   * In the Pushover dashboard, click "Create an Application/API Token"
   * Fill out the application details:
     
     .. code-block:: text
     
        Name: Borgitory Backup Alerts
        Type: Application
        Description: Backup notifications from Borgitory
        URL: http://localhost:8000 (or your Borgitory URL)
        Icon: (optional - upload a custom icon)

2. **Get API Token**
   
   * After creating the application, note the API Token/Key
   * This token identifies your application to Pushover
   * Keep this token secure and don't share it publicly

3. **Test the Application**
   
   * Use the test feature in Pushover dashboard
   * Send a test message to verify everything works
   * Check that you receive the notification on your device

Step 3: Configure Borgitory
---------------------------

Add Pushover Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Navigate to Notifications**
   
   * Open Borgitory web interface
   * Go to Settings → Notifications
   * Click "Add Notification Configuration"

2. **Select Pushover Provider**
   
   * Choose "Pushover" from the provider dropdown
   * The Pushover-specific fields will appear

3. **Enter Configuration Details**
   
   .. code-block:: text
   
      Name: Mobile Alerts
      Provider: Pushover
      User Key: [your-user-key-from-step-1]
      API Token: [your-api-token-from-step-2]
      Device: (optional - leave blank for all devices)
      Priority: Normal
      Sound: pushover (default)
   
   **Field Descriptions:**
   
   * **Name**: Friendly name for this notification config
   * **User Key**: Your Pushover user key
   * **API Token**: Your application's API token
   * **Device**: Specific device name (optional - sends to all if blank)
   * **Priority**: Notification priority (-2 to 2)
   * **Sound**: Notification sound (see Pushover documentation)

4. **Test Configuration**
   
   * Click "Test Notification" button
   * You should receive a test message on your device
   * If the test fails, verify your User Key and API Token

5. **Save Configuration**
   
   * Click "Save" to store the notification configuration
   * The configuration appears in your notifications list

Step 4: Configure Notification Triggers
---------------------------------------

Global Notification Settings
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Set Default Preferences**
   
   * Go to Settings → Notifications → Global Settings
   * Configure default notification behavior:
     
     .. code-block:: text
     
        Success Notifications: Enabled
        Failure Notifications: Enabled
        Warning Notifications: Enabled
        Quiet Hours: 22:00 - 07:00 (optional)
        Emergency Escalation: Disabled

Per-Schedule Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Edit Backup Schedules**
   
   * Go to Schedules
   * Click "Edit" on an existing schedule or create a new one

2. **Configure Notification Settings**
   
   * In the schedule form, find the "Notifications" section
   * Enable notifications for this schedule
   * Select your Pushover configuration
   * Choose notification triggers:
     
     .. code-block:: text
     
        ✓ Notify on Success
        ✓ Notify on Failure  
        ✓ Notify on Warning
        ☐ Notify on Start (optional)

3. **Custom Message Templates** (Optional)
   
   * Customize notification messages for this schedule
   * Use variables like ``{schedule_name}``, ``{status}``, ``{duration}``
   * Example templates:
     
     .. code-block:: text
     
        Success: "✅ {schedule_name} completed in {duration}"
        Failure: "❌ {schedule_name} failed: {error_message}"
        Warning: "⚠️ {schedule_name} completed with warnings"

Step 5: Advanced Configuration
------------------------------

Priority Levels
~~~~~~~~~~~~~~~

Pushover supports different priority levels:

* **-2 (Lowest)**: No notification sound or vibration
* **-1 (Low)**: Quiet notification
* **0 (Normal)**: Default priority with sound
* **1 (High)**: High-priority sound and vibration
* **2 (Emergency)**: Repeated alerts until acknowledged

**Configuration Example:**

.. code-block:: text

   Success Notifications: Priority 0 (Normal)
   Warning Notifications: Priority 1 (High)  
   Failure Notifications: Priority 2 (Emergency)

Device-Specific Notifications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To send notifications to specific devices:

1. **Find Device Names**
   
   * In Pushover app, go to Settings
   * Note the device name shown
   * Common names: "iPhone", "Android", "Desktop"

2. **Configure Device Targeting**
   
   * In Borgitory notification config, enter device name
   * Leave blank to send to all devices
   * Use comma-separated list for multiple devices: ``iPhone,Desktop``

Custom Sounds
~~~~~~~~~~~~~

Pushover supports custom notification sounds:

**Built-in Sounds:**
* ``pushover`` (default)
* ``bike``, ``bugle``, ``cashregister``
* ``classical``, ``cosmic``, ``falling``
* ``gamelan``, ``incoming``, ``intermission``
* ``magic``, ``mechanical``, ``pianobar``
* ``siren``, ``spacealarm``, ``tugboat``
* ``alien``, ``climb``, ``persistent``
* ``echo``, ``updown``, ``none`` (silent)

**Configuration:**

.. code-block:: text

   Success Sound: pushover
   Warning Sound: intermission
   Failure Sound: siren

Quiet Hours
~~~~~~~~~~~

Configure quiet hours to avoid notifications during sleep:

.. code-block:: text

   Quiet Hours Start: 22:00
   Quiet Hours End: 07:00
   Emergency Override: Enabled (failures still notify)

Step 6: Testing and Validation
------------------------------

Test Notification Flow
~~~~~~~~~~~~~~~~~~~~~~

1. **Manual Test**
   
   * Use the "Test Notification" button in configuration
   * Verify you receive the test message
   * Check that sound and priority work as expected

2. **Backup Test**
   
   * Run a manual backup job
   * Verify you receive success notification
   * Check notification content and timing

3. **Failure Test**
   
   * Create a backup with invalid source path
   * Verify you receive failure notification
   * Confirm emergency priority works (if configured)

4. **Schedule Test**
   
   * Create a test schedule that runs frequently
   * Wait for scheduled execution
   * Verify notifications arrive as expected

Troubleshooting Common Issues
-----------------------------

No Notifications Received
~~~~~~~~~~~~~~~~~~~~~~~~~

**Check Pushover Configuration:**

.. code-block:: bash

   # Test Pushover API directly
   curl -s \
     --form-string "token=YOUR_API_TOKEN" \
     --form-string "user=YOUR_USER_KEY" \
     --form-string "message=Test from command line" \
     https://api.pushover.net/1/messages.json

**Common Issues:**

* **Invalid User Key**: Verify key from Pushover dashboard
* **Invalid API Token**: Verify token from application settings
* **Network Issues**: Check internet connectivity
* **Rate Limiting**: Pushover has API limits (7,500 messages/month free)

Notifications Not Working for Schedules
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* **Schedule Not Enabled**: Verify schedule is active
* **Notification Config Not Selected**: Check schedule notification settings
* **Global Settings Override**: Review global notification preferences
* **Job Failures**: Check job logs for execution issues

Wrong Priority or Sound
~~~~~~~~~~~~~~~~~~~~~~~

* **Configuration Mismatch**: Verify priority/sound settings in Borgitory
* **Pushover App Settings**: Check notification settings in mobile app
* **Device-Specific Settings**: Some devices override notification settings

Delayed Notifications
~~~~~~~~~~~~~~~~~~~~~

* **Network Latency**: Pushover typically delivers within seconds
* **Device Sleep**: Some devices delay notifications when sleeping
* **App Background**: Ensure Pushover app isn't restricted in background

Step 7: Monitoring and Maintenance
----------------------------------

Monitor Notification Health
~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Check Delivery Status**
   
   * Pushover dashboard shows delivery statistics
   * Monitor successful vs. failed deliveries
   * Review API usage against limits

2. **Review Notification Logs**
   
   * Borgitory logs notification attempts
   * Check for API errors or timeouts
   * Monitor notification frequency

3. **Update Configuration**
   
   * Periodically review notification settings
   * Adjust priorities based on experience
   * Update device names if changed

Quota Management
~~~~~~~~~~~~~~~~

**Free Tier Limits:**
* 7,500 messages per month
* 10,000 API calls per month

**Usage Optimization:**
* Use appropriate priorities to reduce noise
* Configure quiet hours to batch notifications
* Consider grouping related notifications
* Monitor usage in Pushover dashboard

**Upgrade Options:**
* Pushover Pro: $5 one-time fee for additional features
* Higher quotas available for heavy users

Best Practices
--------------

Notification Strategy
~~~~~~~~~~~~~~~~~~~~~

* **Success Notifications**: Enable for critical schedules only
* **Failure Notifications**: Always enable for immediate attention
* **Warning Notifications**: Enable for troubleshooting
* **Quiet Hours**: Configure to avoid sleep disruption
* **Emergency Priority**: Reserve for critical failures only

Message Content
~~~~~~~~~~~~~~~

* **Be Specific**: Include schedule name, duration, error details
* **Use Emojis**: Visual indicators help quickly identify status
* **Keep Concise**: Mobile notifications have limited space
* **Include Context**: Timestamp, repository name, archive count

Security Considerations
~~~~~~~~~~~~~~~~~~~~~~~

* **Secure API Tokens**: Don't commit tokens to version control
* **Rotate Keys**: Periodically rotate API tokens
* **Limit Scope**: Use device targeting to limit notification scope
* **Monitor Usage**: Watch for unexpected API usage patterns

Next Steps
----------

* Set up :doc:`automated-backup-workflows` with notifications
* Configure :doc:`monitoring-backup-health` for comprehensive monitoring
* Explore :doc:`setup-aws-s3` for cloud backup with notifications
* Review :doc:`../troubleshooting` for notification-related issues

With Pushover notifications configured, you'll receive immediate alerts about your backup operations, ensuring you stay informed about the health of your backup infrastructure even when away from your computer.
