=====================================
Package Manager for Pre/Post Hooks
=====================================

The Borgitory package manager allows you to install Debian packages directly from the web interface to support your pre and post job hooks. This feature enables you to extend the functionality of your backup workflows by installing the tools your custom scripts need.

.. contents::
   :local:
   :depth: 2

Overview
========

The package manager provides a secure way to install additional software packages into the Borgitory Docker container. These packages persist across container restarts and are automatically reinstalled if needed. The primary use case is to support pre-hook and post-hook scripts that require additional command-line tools.

.. note::
   The package manager only works when Borgitory is running in a Docker container with appropriate permissions. Packages are installed using the standard ``apt`` package manager.

Accessing the Package Manager
=============================

1. Navigate to the main Borgitory interface
2. Click on the **"Package Manager"** tab in the navigation menu
3. The package manager interface will load, showing two main sections:
   - **Install Packages** - Search and install new packages
   - **Installed Packages** - View and manage currently installed packages

Installing Packages
===================

Searching for Packages
----------------------

1. In the **Install Packages** section, use the search box to find packages
2. Type at least 2 characters to start searching
3. An autocomplete dropdown will appear showing matching packages
4. Each result shows:
   - Package name and version
   - Brief description
   - Section category
   - Installation status (if already installed)

Selecting and Installing Packages
---------------------------------

1. Click on a package from the search results to select it
2. Selected packages appear in the **Selected Packages** area
3. You can select multiple packages before installing
4. Remove packages from selection by clicking the **×** button
5. Click **"Install Selected Packages"** to begin installation
6. Installation progress and results will be displayed

Managing Installed Packages
===========================

The **Installed Packages** section shows all packages currently installed in the container. Packages are categorized as:

- **System Packages** - Pre-installed packages (cannot be removed)
- **User-Installed Packages** - Packages you installed (can be removed)

User-installed packages have a **Remove** button that allows you to uninstall them if they're no longer needed.

Package Persistence
===================

Packages installed through the package manager are automatically tracked and will be reinstalled if:

- The container is restarted
- The container image is updated
- The package is accidentally removed

This ensures your pre/post hook scripts continue to work reliably across deployments.

Integration with Pre/Post Hooks
===============================

The package manager is specifically designed to support pre and post job hooks. When you create or edit a schedule, you can configure hooks that run before and after backup operations.

Accessing Hook Configuration
-----------------------------

1. Go to **Schedules** and create or edit a schedule
2. In the schedule form, look for the **"Pre/Post Job Hooks"** section
3. Click **"Configure Hooks"** to open the hooks modal
4. Add pre-hooks (run before backup) and post-hooks (run after backup)

Common Use Cases and Examples
=============================

Database Dumps with SQLite3
---------------------------

**Scenario**: Backup SQLite database files by creating dumps before the backup runs.

**Required Package**: ``sqlite3``

**Installation**:
1. Search for "sqlite3" in the package manager
2. Select and install the ``sqlite3`` package

**Pre-hook Example**:

.. code-block:: bash

   #!/bin/bash
   # Pre-hook: Create SQLite database dump
   
   # Define paths
   DB_PATH="/app/data/myapp.db"
   DUMP_PATH="/app/data/myapp_dump.sql"
   
   # Create dump if database exists
   if [ -f "$DB_PATH" ]; then
       echo "Creating SQLite dump..."
       sqlite3 "$DB_PATH" .dump > "$DUMP_PATH"
       echo "SQLite dump created: $DUMP_PATH"
   else
       echo "Database not found: $DB_PATH"
       exit 1
   fi

**Benefits**:
- Ensures consistent database state during backup
- Creates human-readable SQL dumps
- Can be restored on any system with SQLite

PostgreSQL Database Dumps
-------------------------

**Scenario**: Create PostgreSQL database dumps before backup.

**Required Packages**: ``postgresql-client``

**Installation**:
1. Search for "postgresql-client"
2. Install the ``postgresql-client`` package

**Pre-hook Example**:

.. code-block:: bash

   #!/bin/bash
   # Pre-hook: Create PostgreSQL database dump
   
   # Database connection details
   DB_HOST="localhost"
   DB_NAME="myapp"
   DB_USER="backup_user"
   DUMP_PATH="/app/data/postgres_dump.sql"
   
   # Create dump
   echo "Creating PostgreSQL dump..."
   pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$DUMP_PATH"
   
   if [ $? -eq 0 ]; then
       echo "PostgreSQL dump created successfully"
   else
       echo "PostgreSQL dump failed"
       exit 1
   fi

**Post-hook Example**:

.. code-block:: bash

   #!/bin/bash
   # Post-hook: Clean up dump file after backup
   
   DUMP_PATH="/app/data/postgres_dump.sql"
   
   if [ -f "$DUMP_PATH" ]; then
       rm "$DUMP_PATH"
       echo "Cleaned up PostgreSQL dump file"
   fi

Web Content Downloads with curl
-------------------------------

**Scenario**: Download important web content or API data before backup.

**Required Package**: ``curl``

**Pre-hook Example**:

.. code-block:: bash

   #!/bin/bash
   # Pre-hook: Download important web content
   
   BACKUP_DIR="/app/data/web_backups"
   mkdir -p "$BACKUP_DIR"
   
   # Download website content
   echo "Downloading website content..."
   curl -o "$BACKUP_DIR/website.html" "https://mywebsite.com/important-page"
   
   # Download API data
   echo "Downloading API data..."
   curl -H "Authorization: Bearer $API_TOKEN" \
        -o "$BACKUP_DIR/api_data.json" \
        "https://api.myservice.com/data"
   
   echo "Web content downloads completed"

Log Processing with jq
----------------------

**Scenario**: Process and filter JSON logs before backup.

**Required Package**: ``jq``

**Pre-hook Example**:

.. code-block:: bash

   #!/bin/bash
   # Pre-hook: Process JSON logs
   
   LOG_DIR="/app/logs"
   PROCESSED_DIR="/app/data/processed_logs"
   mkdir -p "$PROCESSED_DIR"
   
   # Process JSON logs to extract important events
   echo "Processing JSON logs..."
   for log_file in "$LOG_DIR"/*.json; do
       if [ -f "$log_file" ]; then
           filename=$(basename "$log_file")
           # Extract error events only
           jq '.[] | select(.level == "error")' "$log_file" > "$PROCESSED_DIR/errors_$filename"
           # Extract user activity
           jq '.[] | select(.type == "user_activity")' "$log_file" > "$PROCESSED_DIR/activity_$filename"
       fi
   done
   
   echo "Log processing completed"

System Health Checks
--------------------

**Scenario**: Perform system health checks before backup and fail if system is unhealthy.

**Required Packages**: ``curl``, ``jq``

**Pre-hook Example** (with Critical flag enabled):

.. code-block:: bash

   #!/bin/bash
   # Pre-hook: System health check (CRITICAL)
   # This hook should be marked as "Critical" to stop backup if health check fails
   
   echo "Performing system health check..."
   
   # Check disk space
   DISK_USAGE=$(df /app | tail -1 | awk '{print $5}' | sed 's/%//')
   if [ "$DISK_USAGE" -gt 90 ]; then
       echo "ERROR: Disk usage is ${DISK_USAGE}% - too high for safe backup"
       exit 1
   fi
   
   # Check application health endpoint
   HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
   if [ "$HTTP_STATUS" != "200" ]; then
       echo "ERROR: Application health check failed (HTTP $HTTP_STATUS)"
       exit 1
   fi
   
   # Check database connectivity
   if ! pg_isready -h localhost -p 5432; then
       echo "ERROR: Database is not ready"
       exit 1
   fi
   
   echo "System health check passed"

Notification Integrations
-------------------------

**Scenario**: Send custom notifications about backup status.

**Required Package**: ``curl``

**Post-hook Example** (with "Run on job failure" enabled):

.. code-block:: bash

   #!/bin/bash
   # Post-hook: Send Slack notification
   # This hook should have "Run on job failure" enabled to notify about failures
   
   SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
   
   # Check if backup was successful by checking environment variables
   # (These are provided by Borgitory to hook scripts)
   if [ "$BORGITORY_JOB_STATUS" = "success" ]; then
       MESSAGE="✅ Backup completed successfully for repository: $BORGITORY_REPOSITORY_ID"
       COLOR="good"
   else
       MESSAGE="❌ Backup failed for repository: $BORGITORY_REPOSITORY_ID"
       COLOR="danger"
   fi
   
   # Send Slack notification
   curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\", \"color\":\"$COLOR\"}" \
        "$SLACK_WEBHOOK_URL"
   
   echo "Notification sent to Slack"

Advanced Hook Features
======================

Critical Hooks
--------------

When configuring hooks, you can mark them as **"Critical"**. If a critical hook fails:

- The entire backup job stops immediately
- Remaining hooks and backup tasks are skipped
- The job is marked as failed
- Notifications still run (if configured to run on failure)

This is useful for:
- Health checks that must pass before backup
- Database dumps that are essential for data consistency
- Security checks that should prevent backup if failed

Run on Job Failure
------------------

Post-hooks can be configured to **"Run on job failure"**. These hooks will execute even if:

- A critical pre-hook failed
- The backup process failed
- Any other part of the job failed

This is useful for:
- Cleanup operations that should always run
- Failure notifications
- Logging and monitoring
- Releasing locks or resources

Environment Variables in Hooks
------------------------------

Borgitory provides several environment variables to your hook scripts:

- ``BORGITORY_REPOSITORY_ID`` - The ID of the repository being backed up
- ``BORGITORY_JOB_TYPE`` - The type of job (e.g., "backup", "prune")
- ``BORGITORY_TASK_INDEX`` - The current task number in the job
- ``BORGITORY_JOB_STATUS`` - Current job status (available in post-hooks)

Example using environment variables:

.. code-block:: bash

   #!/bin/bash
   # Hook script using Borgitory environment variables
   
   echo "Processing backup for repository: $BORGITORY_REPOSITORY_ID"
   echo "Job type: $BORGITORY_JOB_TYPE"
   echo "Current task: $BORGITORY_TASK_INDEX"
   
   # Create repository-specific backup directory
   BACKUP_DIR="/app/data/repo_$BORGITORY_REPOSITORY_ID"
   mkdir -p "$BACKUP_DIR"
   
   # Perform repository-specific operations...

Best Practices
===============

Package Selection
-----------------

- **Install only what you need**: Each package increases container size and potential security surface
- **Use specific packages**: Choose ``postgresql-client`` over ``postgresql`` if you only need client tools
- **Check dependencies**: Some packages install many dependencies automatically
- **Regular cleanup**: Remove packages that are no longer needed

Hook Development
----------------

- **Test thoroughly**: Test hooks in a development environment before production
- **Handle errors gracefully**: Use proper exit codes and error messages
- **Log operations**: Include echo statements to track hook execution
- **Use absolute paths**: Don't rely on relative paths or current directory
- **Check prerequisites**: Verify required files/services exist before processing

Security Considerations
-----------------------

- **Validate inputs**: Don't trust external data sources
- **Use secure connections**: Always use HTTPS/TLS for external communications
- **Protect credentials**: Use environment variables or secure files for API keys
- **Limit permissions**: Run with minimum required privileges
- **Regular updates**: Keep installed packages updated

Performance Tips
----------------

- **Minimize hook runtime**: Long-running hooks delay backup completion
- **Parallel processing**: Use background jobs for independent operations
- **Efficient tools**: Choose lightweight tools when possible
- **Cache data**: Avoid re-downloading the same data repeatedly
- **Clean up**: Remove temporary files to save space

Troubleshooting
===============

Common Issues
-------------

**Package not found**
   - Check spelling and package name
   - Update package lists (this happens automatically)
   - Verify the package exists in Debian repositories

**Installation fails**
   - Check container permissions
   - Verify internet connectivity
   - Look for dependency conflicts in logs

**Hook script fails**
   - Check script permissions (should be executable)
   - Verify required packages are installed
   - Check script syntax and logic
   - Review hook execution logs

**Packages disappear after restart**
   - This shouldn't happen with the persistence system
   - Check container volume mounts
   - Verify database connectivity

Viewing Logs
------------

Hook execution is logged in the job details. To view hook logs:

1. Go to **Jobs** in the navigation
2. Find your backup job in the list
3. Click to expand job details
4. Look for hook tasks in the task list
5. Click on individual hook tasks to see their output

Getting Help
------------

If you encounter issues with the package manager or hooks:

1. Check the application logs for error messages
2. Verify your hook scripts work outside of Borgitory
3. Test package installation manually in the container
4. Review this documentation for examples and best practices
5. Check the Borgitory GitHub repository for known issues

Remember that the package manager and hooks system is designed to be flexible and powerful. Start with simple examples and gradually build more complex workflows as you become comfortable with the system.
