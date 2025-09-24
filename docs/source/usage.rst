.. meta::
   :description lang=en:
      Step-by-step usage guide for Borgitory covering repository setup, backup scheduling,
      archive management, cloud sync, and monitoring operations.

Usage Guide
===========

This guide walks you through using Borgitory's key features step-by-step, from initial setup to advanced operations.
Examples assume you're using the recommended Docker installation method.

Getting Started
---------------

First-Time Setup
~~~~~~~~~~~~~~~~

After starting Borgitory with Docker, access the web interface at http://localhost:8000:

.. code-block:: bash

   # Start Borgitory (if not already running)
   docker run -d \
     --name borgitory \
     -p 8000:8000 \
     -v borgitory-data:/app/data \
     mlapaglia/borgitory:latest

Now you can access the web interface:

1. **Create Admin Account**
   
   * On first visit, you'll see the initial setup page
   * Create your admin username and password
   * Click "Create Account" to complete setup

2. **Dashboard Overview**
   
   * The main dashboard shows repository status
   * Navigation menu provides access to all features
   * Quick actions are available in the toolbar

Repository Management
---------------------

Adding Your First Repository
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Navigate to Repositories**
   
   * Click "Repositories" in the main navigation
   * Click "Add Repository" button

2. **Configure Repository**
   
   .. code-block:: text
   
      Name: My Backup Repo
      Path: /mnt/repos/my-backup-repo
      Passphrase: [secure-passphrase]
   
   * **Name**: Friendly identifier for the repository
   * **Path**: Full path to repository location (must be under /mnt/ for Docker)
   * **Passphrase**: Encryption password for the repository

3. **Test Connection**
   
   * Click "Test Connection" to verify repository access
   * Green checkmark indicates successful connection
   * Red X indicates configuration issues

4. **Save Repository**
   
   * Click "Save" to add the repository
   * Repository appears in the main dashboard

Managing Multiple Repositories
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Repository List View**
   * View all configured repositories
   * See connection status and last backup time
   * Quick actions: Edit, Delete, Test Connection

**Repository Details**
   * Click repository name to view detailed information
   * Repository statistics and health metrics
   * Recent backup history and archive list

Creating Backups
----------------

Manual Backup
~~~~~~~~~~~~~

1. **Start New Backup**
   
   * From dashboard, click "New Backup" button
   * Or navigate to Backups → Manual Backup

2. **Configure Backup Settings**
   
   .. code-block:: text
   
      Repository: My Backup Repo
      Source Path: /mnt/backup/sources/documents
      Archive Name: documents-{now:%Y%m%d-%H%M%S}
      Compression: lz4
   
   * **Repository**: Select target repository from dropdown
   * **Source Path**: Directory to backup (must be under /mnt/ for Docker)
   * **Archive Name**: Name template with timestamp support
   * **Compression**: Choose compression algorithm (lz4, zlib, lzma, zstd)

3. **Advanced Options** (Optional)
   
   * **Exclude Patterns**: File patterns to exclude from backup
   * **One File System**: Don't cross filesystem boundaries
   * **Numeric Owner**: Store numeric user/group IDs
   * **Checkpoint Interval**: Create checkpoints every N seconds

4. **Start Backup**
   
   * Click "Start Backup" to begin the process
   * Real-time progress appears immediately
   * Monitor transfer rates and file counts

Monitoring Backup Progress
~~~~~~~~~~~~~~~~~~~~~~~~~~

**Real-Time Progress Display**
   * Live progress bar with percentage complete
   * Current file being processed
   * Transfer rate and estimated time remaining
   * Total files processed and data transferred

**Expandable Task Details**
   * Click "Show Details" to view full command output
   * See Borg's detailed progress information
   * Monitor any warnings or errors
   * View compression statistics

**Job Completion**
   * Success notification with backup summary
   * Archive information and statistics
   * Links to browse the new archive
   * Option to start cloud sync if configured

Scheduled Backups
-----------------

Creating Backup Schedules
~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Navigate to Schedules**
   
   * Click "Schedules" in the main navigation
   * Click "Add Schedule" button

2. **Basic Schedule Configuration**
   
   .. code-block:: text
   
      Name: Daily Documents Backup
      Repository: My Backup Repo
      Source Path: /mnt/backup/sources/documents
      Cron Expression: 0 2 * * *
      Enabled: ✓
   
   * **Name**: Descriptive name for the schedule
   * **Repository**: Target repository for backups
   * **Source Path**: Directory to backup regularly
   * **Cron Expression**: When to run (daily at 2 AM in this example)
   * **Enabled**: Toggle to activate/deactivate schedule

3. **Advanced Schedule Options**
   
   * **Compression**: Set compression algorithm
   * **Archive Naming**: Template for archive names
   * **Pruning Policy**: Attach retention policy
   * **Notifications**: Configure success/failure alerts
   * **Cloud Sync**: Enable automatic cloud synchronization
   * **Job Hooks**: Configure pre-job and post-job automation scripts (see :doc:`how-to/package-manager` for installing required tools)

Understanding Cron Expressions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Common cron patterns:

.. code-block:: text

   0 2 * * *     # Daily at 2:00 AM
   0 2 * * 0     # Weekly on Sunday at 2:00 AM  
   0 2 1 * *     # Monthly on 1st at 2:00 AM
   0 */6 * * *   # Every 6 hours
   30 1 * * 1-5  # Weekdays at 1:30 AM

The interface shows human-readable descriptions of cron expressions.

Job Hooks System
~~~~~~~~~~~~~~~~~

Job hooks allow you to execute custom commands before and after backup jobs, enabling powerful automation workflows.

**Hook Types**

* **Pre-Job Hooks**: Execute before the backup process begins
  
  * Ideal for database dumps, stopping services, mounting drives
  * Can be marked as "Critical" to stop the job if they fail
  * Prepare systems for consistent backups

* **Post-Job Hooks**: Execute after the backup process completes
  
  * Perfect for cleanup, service restarts, health checks
  * Can be configured to run even if the job fails
  * Restore system state and send notifications

**Adding Hooks to a Schedule**

1. **Open Hooks Configuration**
   
   * In the schedule creation/editing form, click "Configure Hooks"
   * This opens the hooks configuration modal

2. **Configure Pre-Job Hooks**
   
   .. code-block:: text
   
      Name: Database Dump
      Command: pg_dump myapp > /tmp/myapp_backup.sql
      Critical: ✓ Enabled
      
      Name: Stop Web Service  
      Command: systemctl stop nginx && sleep 5
      Critical: ✓ Enabled

3. **Configure Post-Job Hooks**
   
   .. code-block:: text
   
      Name: Restart Services
      Command: systemctl start nginx && systemctl start mysql
      Run Even If Job Failed: ✓ Enabled
      
      Name: Health Check Ping
      Command: curl -X POST https://healthcheck.io/ping/abc123
      Run Even If Job Failed: ✓ Enabled

**Hook Options**

* **Critical Hooks**: Job fails immediately if a critical hook fails
  
  * Use for essential preparation tasks (database dumps, prerequisites)
  * Prevents inconsistent backups when preparation fails

* **Run on Job Failure** (Post-hooks only): Hook executes even if backup fails
  
  * Use for cleanup, service restarts, monitoring pings
  * Ensures system recovery regardless of backup success

**Hook Execution Flow**

Normal execution (all successful):

.. code-block:: text

   1. Pre-Hook 1 (Database Dump)        → ✅ Success
   2. Pre-Hook 2 (Stop Services)        → ✅ Success
   3. Backup Task                        → ✅ Success
   4. Prune Task                         → ✅ Success
   5. Post-Hook 1 (Restart Services)    → ✅ Success
   6. Post-Hook 2 (Health Check)        → ✅ Success
   
   Result: ✅ Job Completed Successfully

Critical hook failure:

.. code-block:: text

   1. Pre-Hook 1 (Database Dump)        → ❌ Failed (Critical)
   2. Pre-Hook 2 (Stop Services)        → ⏭️  Skipped
   3. Backup Task                        → ⏭️  Skipped  
   4. Prune Task                         → ⏭️  Skipped
   5. Post-Hook 1 (Restart Services)    → ⏭️  Skipped
   6. Post-Hook 2 (Health Check)        → ✅ Success (Run on Failure)
   
   Result: ❌ Job Failed - Critical Hook Error

**Environment Variables**

Hook scripts automatically receive job context:

.. code-block:: bash

   # Available in all hook scripts
   BORGITORY_REPOSITORY_ID="123"     # Repository being backed up
   BORGITORY_TASK_INDEX="2"          # Hook position in job sequence
   BORGITORY_JOB_TYPE="scheduled"    # Job type (scheduled, manual)

**Common Hook Examples**

Database Preparation:

.. code-block:: bash

   # Pre-hook: Create PostgreSQL dump
   # Requires: postgresql-client package (install via Package Manager)
   #!/bin/bash
   pg_dump -h localhost -U backup_user myapp > /tmp/db_backup.sql
   if [ $? -ne 0 ]; then
       echo "Database dump failed"
       exit 1
   fi

Service Management:

.. code-block:: bash

   # Post-hook: Restart services (always run)
   #!/bin/bash
   systemctl start nginx
   systemctl start mysql
   echo "Services restarted"

Health Monitoring:

.. code-block:: bash

   # Post-hook: Send health check ping
   # Requires: curl package (install via Package Manager)
   #!/bin/bash
   curl -X POST "https://healthcheck.io/ping/your-uuid" \
        -d "Backup completed for repo ${BORGITORY_REPOSITORY_ID}"

For comprehensive hook documentation, examples, and troubleshooting, see :doc:`how-to/job-hooks-system`.

Managing Schedules
~~~~~~~~~~~~~~~~~~

**Schedule List**
   * View all configured schedules
   * See next run time and last execution
   * Quick enable/disable toggles
   * Edit and delete options

**Schedule History**
   * Click schedule name to view execution history
   * See successful and failed runs
   * Access logs and error details
   * Performance metrics and trends

Archive Pruning
---------------

Creating Pruning Policies
~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Navigate to Cleanup**
   
   * Click "Cleanup" in the main navigation
   * Click "Add Pruning Policy" button

2. **Simple Retention Strategy**
   
   .. code-block:: text
   
      Name: Keep 30 Days
      Strategy: Simple
      Keep Days: 30
      Show Details: ✓
      Show Stats: ✓
   
   * **Keep Days**: Number of days to retain archives
   * **Show Details**: Display detailed list of archives to prune
   * **Show Stats**: Show space savings calculations

3. **Advanced Retention Strategy**
   
   .. code-block:: text
   
      Name: Granular Retention
      Strategy: Advanced
      Keep Daily: 7
      Keep Weekly: 4
      Keep Monthly: 6
      Keep Yearly: 2
   
   * **Keep Daily**: Recent daily archives to retain
   * **Keep Weekly**: Weekly archives to retain
   * **Keep Monthly**: Monthly archives to retain  
   * **Keep Yearly**: Yearly archives to retain

Executing Pruning Operations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Manual Pruning**
   1. Select repository from dropdown
   2. Choose pruning policy
   3. Click "Preview Prune" to see what will be deleted
   4. Review the prune list and space savings
   5. Click "Execute Prune" to perform cleanup

**Automated Pruning**
   * Attach pruning policies to backup schedules
   * Pruning runs automatically after successful backups
   * Monitor pruning results in job history

Archive Browsing
----------------

Exploring Archive Contents
~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Access Archive Browser**
   
   * From dashboard, click "View Contents" next to any archive
   * Or navigate to Archives → Browse Archives

2. **Navigate Directory Structure**
   
   * Click folder names to navigate into directories
   * Use breadcrumb navigation to go back
   * See file sizes, modification dates, and permissions

3. **File Operations**
   
   * **Download**: Click download button (⬇) next to files
   * **View Details**: See file metadata and properties
   * **Search**: Use search box to find specific files

**FUSE Requirements**
   Archive browsing requires FUSE support:
   
   * Docker: Run with ``--cap-add SYS_ADMIN --device /dev/fuse``
   * Native: Ensure FUSE is installed and accessible
   * Without FUSE: Archive browsing will be disabled

Downloading Files from Archives
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Direct Downloads**
   * Files stream directly from mounted archives
   * No temporary storage required
   * Works efficiently with large files
   * Multiple downloads can run simultaneously

**Download Process**
   1. Navigate to desired file in archive browser
   2. Click download button next to file
   3. Browser starts download immediately
   4. Monitor download progress in browser

Cloud Synchronization
---------------------

Configuring Cloud Providers
~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Navigate to Cloud Sync**
   
   * Click "Cloud Sync" in the main navigation
   * Click "Add Cloud Configuration" button

2. **Select Provider**
   
   * Choose from supported providers (S3, Google Cloud, Azure, etc.)
   * Provider-specific fields appear automatically

3. **Configure S3 Example**
   
   .. code-block:: text
   
      Name: My S3 Backup
      Provider: s3
      Access Key ID: AKIAIOSFODNN7EXAMPLE
      Secret Access Key: [hidden]
      Bucket Name: my-backup-bucket
      Region: us-east-1
      Path Prefix: borgitory-backups/
   
   * **Access Keys**: AWS credentials for bucket access
   * **Bucket Name**: S3 bucket for storing backups
   * **Region**: AWS region for the bucket
   * **Path Prefix**: Organization path within bucket

4. **Test Connection**
   
   * Click "Test Connection" to verify configuration
   * Green checkmark indicates successful connection
   * Fix any configuration issues before saving

Manual Cloud Sync
~~~~~~~~~~~~~~~~~

**Sync Repository to Cloud**
   1. Navigate to Cloud Sync → Manual Sync
   2. Select repository to sync
   3. Choose cloud configuration
   4. Click "Start Sync" to begin upload
   5. Monitor real-time sync progress

**Sync Progress Monitoring**
   * Real-time transfer statistics
   * Files uploaded and transfer rates
   * Estimated time remaining
   * Error reporting and retry logic

Automated Cloud Sync
~~~~~~~~~~~~~~~~~~~~

**Schedule Integration**
   * Enable cloud sync in backup schedules
   * Automatic sync after successful backups
   * Configure sync settings per schedule
   * Monitor sync results in job history

**Cloud Sync History**
   * View all sync operations
   * See successful and failed syncs
   * Access detailed sync logs
   * Monitor bandwidth usage over time

Push Notifications
------------------

Configuring Pushover Notifications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Get Pushover Credentials**
   
   * Sign up at https://pushover.net/
   * Create application to get API token
   * Note your user key from account settings

2. **Configure in Borgitory**
   
   * Navigate to Notifications
   * Click "Add Notification Configuration"
   * Select "Pushover" as provider
   
   .. code-block:: text
   
      Name: My Phone Alerts
      Provider: Pushover
      User Key: [your-user-key]
      API Token: [your-app-token]
      Device: [optional-device-name]

3. **Test Notifications**
   
   * Click "Test Notification" to send test message
   * Verify notification appears on your device
   * Adjust settings if needed

Notification Settings
~~~~~~~~~~~~~~~~~~~~~

**Global Settings**
   * Default notification preferences
   * Quiet hours configuration
   * Emergency escalation rules
   * Message formatting options

**Per-Schedule Settings**
   * Attach notifications to specific schedules
   * Configure success/failure triggers
   * Custom message templates
   * Priority levels and sounds

Job Management
--------------

Monitoring Active Jobs
~~~~~~~~~~~~~~~~~~~~~~

**Jobs Dashboard**
   * View all active and recent jobs
   * Real-time status updates
   * Progress indicators for running jobs
   * Quick actions: Cancel, View Details, Retry

**Job Details View**
   * Expandable task details with full output
   * Real-time log streaming
   * Performance metrics and statistics
   * Error reporting and diagnostics

Job History
~~~~~~~~~~~

**Historical Job Data**
   * Search and filter job history
   * View job duration and performance trends
   * Access detailed logs and error reports
   * Export job data for analysis

**Job Analysis**
   * Success/failure rates over time
   * Performance trending and optimization
   * Resource usage patterns
   * Bottleneck identification

Troubleshooting Common Issues
-----------------------------

Quick Diagnostics
~~~~~~~~~~~~~~~~~

**Repository Issues**
   * Verify repository path is correct and accessible
   * Check passphrase is correct
   * Ensure Borg is installed and in PATH
   * Test repository with Borg CLI directly

**Backup Failures**
   * Check source path exists and is readable
   * Verify sufficient disk space
   * Review exclude patterns for conflicts
   * Check file permissions and access rights

**Cloud Sync Problems**
   * Test cloud provider credentials
   * Verify bucket/container exists
   * Check network connectivity
   * Review Rclone configuration

For detailed troubleshooting information, see the :doc:`troubleshooting` guide.

Best Practices
--------------

Repository Management
~~~~~~~~~~~~~~~~~~~~~

* Use descriptive repository names
* Store repositories on reliable storage
* Regular repository integrity checks
* Keep passphrases secure and backed up
* Monitor repository size growth

Backup Strategy
~~~~~~~~~~~~~~~

* Test backup and restore procedures regularly
* Use appropriate compression for your data
* Implement 3-2-1 backup strategy (3 copies, 2 different media, 1 offsite)
* Monitor backup success rates and performance
* Document your backup procedures

Security Considerations
~~~~~~~~~~~~~~~~~~~~~~~

* Use strong passphrases for repositories
* Secure cloud provider credentials
* Regular security updates and patches
* Monitor access logs for suspicious activity
* Implement proper network security

Next Steps
----------

* Explore :doc:`how-to/index` guides for specific tasks
* Configure :doc:`cloud-providers` for additional storage options
* Review :doc:`troubleshooting` for common issues
* Check the :doc:`api` documentation for automation
* Join the community on GitHub for support and updates

