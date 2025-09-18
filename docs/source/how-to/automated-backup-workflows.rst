How to Set Up Automated Backup Workflows
=========================================

This guide demonstrates how to create comprehensive automated backup workflows that combine scheduling, pruning, cloud sync, and notifications for a complete backup solution.

Overview
--------

An automated backup workflow in Borgitory typically includes:

* **Scheduled Backups** - Regular backup execution via cron
* **Pruning Policies** - Automatic cleanup of old archives  
* **Cloud Synchronization** - Offsite backup storage
* **Notifications** - Alerts for success/failure
* **Monitoring** - Health checks and reporting

This guide will walk through setting up several common workflow patterns.

Workflow 1: Daily Document Backup
---------------------------------

This workflow backs up important documents daily with cloud sync and notifications.

Step 1: Create Repository
~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Add Document Repository**
   
   * Go to Repositories → Add Repository
   * Configure repository settings:
     
     .. code-block:: text
     
        Name: Documents Backup
        Path: /mnt/repos/documents
        Passphrase: [secure-passphrase]
   
   * Test connection and save

Step 2: Create Pruning Policy
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Add Retention Policy**
   
   * Go to Cleanup → Add Pruning Policy
   * Configure retention settings:
     
     .. code-block:: text
     
        Name: Documents Retention
        Strategy: Advanced
        Keep Daily: 7 days
        Keep Weekly: 4 weeks
        Keep Monthly: 6 months
        Keep Yearly: 2 years
        Show Details: ✓
        Show Stats: ✓

Step 3: Configure Cloud Sync
~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Add S3 Configuration**
   
   * Go to Cloud Sync → Add Configuration
   * Configure S3 settings:
     
     .. code-block:: text
     
        Name: Documents S3 Backup
        Provider: s3
        Access Key ID: [your-access-key]
        Secret Access Key: [your-secret-key]
        Bucket Name: my-documents-backup
        Region: us-east-1
        Path Prefix: documents/
   
   * Test connection and save

Step 4: Set Up Notifications
~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Configure Pushover** (see :doc:`setup-pushover-notifications`)
   
   * Add Pushover notification configuration
   * Test notification delivery

Step 5: Create Automated Schedule
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Add Backup Schedule**
   
   * Go to Schedules → Add Schedule
   * Configure complete workflow:
     
     .. code-block:: text
     
        Name: Daily Documents Backup
        Repository: Documents Backup
        Source Path: /mnt/backup/sources/documents
        Cron Expression: 0 2 * * *  (daily at 2 AM)
        Enabled: ✓
        
        Archive Settings:
        Archive Name: documents-{now:%Y%m%d-%H%M%S}
        Compression: lz4
        
        Pruning:
        Pruning Policy: Documents Retention
        Run After Backup: ✓
        
        Cloud Sync:
        Cloud Configuration: Documents S3 Backup
        Sync After Backup: ✓
        
        Notifications:
        Notification Config: Mobile Alerts
        Notify on Success: ✓
        Notify on Failure: ✓
        Notify on Warning: ✓

2. **Save and Test**
   
   * Save the schedule
   * Run manually to test the complete workflow
   * Verify each step completes successfully

Workflow 2: Multi-Source System Backup
--------------------------------------

This workflow backs up multiple system directories with different schedules and retention policies.

Repository Setup
~~~~~~~~~~~~~~

Create separate repositories for different data types:

.. code-block:: text

   System Config Repository:
   - Name: System Configuration
   - Path: /mnt/repos/system-config
   - Purpose: /etc, system configs
   
   User Data Repository:
   - Name: User Home Directories
   - Path: /mnt/repos/user-data
   - Purpose: /home directories
   
   Application Data Repository:
   - Name: Application Data
   - Path: /mnt/repos/app-data
   - Purpose: /var/lib, databases

Pruning Policies
~~~~~~~~~~~~~~~

Create different retention policies:

.. code-block:: text

   System Config Retention:
   - Keep Daily: 30 days
   - Keep Weekly: 12 weeks
   - Keep Monthly: 24 months
   - Keep Yearly: 5 years
   
   User Data Retention:
   - Keep Daily: 7 days
   - Keep Weekly: 8 weeks
   - Keep Monthly: 12 months
   - Keep Yearly: 3 years
   
   Application Data Retention:
   - Keep Daily: 14 days
   - Keep Weekly: 6 weeks
   - Keep Monthly: 6 months
   - Keep Yearly: 2 years

Schedule Configuration
~~~~~~~~~~~~~~~~~~~~

Create multiple schedules with different frequencies:

**System Configuration Schedule:**

.. code-block:: text

   Name: System Config Backup
   Repository: System Configuration
   Source Path: /mnt/backup/sources/etc
   Cron: 0 3 * * * (daily at 3 AM)
   Archive Name: system-config-{now:%Y%m%d}
   Compression: lzma (high compression for config files)
   Exclude Patterns:
   - /etc/shadow-
   - /etc/passwd-
   - *.tmp

**User Data Schedule:**

.. code-block:: text

   Name: User Data Backup
   Repository: User Home Directories
   Source Path: /mnt/backup/sources/home
   Cron: 0 1 * * * (daily at 1 AM)
   Archive Name: userdata-{now:%Y%m%d}
   Compression: lz4 (fast compression for large files)
   Exclude Patterns:
   - .cache/
   - .tmp/
   - Downloads/
   - .local/share/Trash/

**Application Data Schedule:**

.. code-block:: text

   Name: Application Data Backup
   Repository: Application Data
   Source Path: /mnt/backup/sources/var-lib
   Cron: 0 4 * * * (daily at 4 AM)
   Archive Name: appdata-{now:%Y%m%d}
   Compression: zlib (balanced compression)

Workflow 3: Database Backup with Pre/Post Scripts
-------------------------------------------------

This workflow demonstrates backing up databases with proper dump procedures.

Database Preparation Scripts
~~~~~~~~~~~~~~~~~~~~~~~~~~

Create scripts to prepare databases for backup:

**PostgreSQL Dump Script** (``/scripts/pg_backup.sh``):

.. code-block:: bash

   #!/bin/bash
   # PostgreSQL backup preparation
   
   BACKUP_DIR="/mnt/backup/sources/databases/postgresql"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   # Create backup directory
   mkdir -p "$BACKUP_DIR"
   
   # Dump all databases
   sudo -u postgres pg_dumpall > "$BACKUP_DIR/pg_dumpall_$DATE.sql"
   
   # Dump individual databases
   sudo -u postgres psql -c "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname != 'postgres';" -t | while read dbname; do
       if [ -n "$dbname" ]; then
           sudo -u postgres pg_dump "$dbname" > "$BACKUP_DIR/${dbname}_$DATE.sql"
       fi
   done
   
   # Clean old dumps (keep 3 days)
   find "$BACKUP_DIR" -name "*.sql" -mtime +3 -delete
   
   echo "PostgreSQL backup preparation completed"

**MySQL Dump Script** (``/scripts/mysql_backup.sh``):

.. code-block:: bash

   #!/bin/bash
   # MySQL backup preparation
   
   BACKUP_DIR="/mnt/backup/sources/databases/mysql"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   # Create backup directory
   mkdir -p "$BACKUP_DIR"
   
   # Dump all databases
   mysqldump --all-databases --single-transaction --routines --triggers > "$BACKUP_DIR/mysql_all_$DATE.sql"
   
   # Dump individual databases
   mysql -e "SHOW DATABASES;" | grep -v -E '^(Database|information_schema|performance_schema|mysql|sys)$' | while read dbname; do
       mysqldump --single-transaction --routines --triggers "$dbname" > "$BACKUP_DIR/${dbname}_$DATE.sql"
   done
   
   # Clean old dumps
   find "$BACKUP_DIR" -name "*.sql" -mtime +3 -delete
   
   echo "MySQL backup preparation completed"

Pre-Backup Hook Integration
~~~~~~~~~~~~~~~~~~~~~~~~~

**Using systemd timer with pre-backup script:**

Create systemd service (``/etc/systemd/system/database-backup-prep.service``):

.. code-block:: ini

   [Unit]
   Description=Database Backup Preparation
   Before=borgitory-database-backup.service
   
   [Service]
   Type=oneshot
   ExecStart=/scripts/pg_backup.sh
   ExecStart=/scripts/mysql_backup.sh
   User=root
   
   [Install]
   WantedBy=multi-user.target

Create systemd timer (``/etc/systemd/system/database-backup-prep.timer``):

.. code-block:: ini

   [Unit]
   Description=Run database backup preparation
   Requires=database-backup-prep.service
   
   [Timer]
   OnCalendar=*-*-* 05:30:00
   Persistent=true
   
   [Install]
   WantedBy=timers.target

Database Backup Schedule
~~~~~~~~~~~~~~~~~~~~~~

Configure Borgitory schedule to run after database preparation:

.. code-block:: text

   Name: Database Backup
   Repository: Database Backup
   Source Path: /mnt/backup/sources/databases
   Cron: 30 5 * * * (daily at 5:30 AM, after prep scripts)
   Archive Name: databases-{now:%Y%m%d}
   Compression: lzma (high compression for SQL dumps)
   Pruning Policy: Database Retention
   Cloud Sync: Database S3 Backup
   Notifications: Critical Alerts

Workflow 4: Incremental Backup Strategy
---------------------------------------

This workflow demonstrates an incremental backup strategy with frequent small backups and less frequent full backups.

Incremental Schedule Setup
~~~~~~~~~~~~~~~~~~~~~~~~

**Hourly Incremental Backups:**

.. code-block:: text

   Name: Hourly Incremental Backup
   Repository: Active Data Repository
   Source Path: /mnt/backup/sources/active-data
   Cron: 0 * * * * (every hour)
   Archive Name: incremental-{now:%Y%m%d-%H}
   Compression: lz4 (fast for frequent backups)
   Exclude Patterns:
   - *.tmp
   - .cache/
   - *.lock
   Pruning: None (handled by daily cleanup)
   Cloud Sync: None (handled by daily sync)
   Notifications: Failure only

**Daily Full Backup with Cleanup:**

.. code-block:: text

   Name: Daily Full Backup with Cleanup
   Repository: Active Data Repository
   Source Path: /mnt/backup/sources/active-data
   Cron: 0 23 * * * (daily at 11 PM)
   Archive Name: daily-{now:%Y%m%d}
   Compression: zlib (balanced compression)
   Pruning Policy: Incremental Retention
   Run Pruning: ✓
   Cloud Sync: Active Data S3
   Sync After Backup: ✓
   Notifications: Success and Failure

Incremental Retention Policy
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: text

   Name: Incremental Retention
   Strategy: Advanced
   Keep Hourly: 48 hours (2 days of hourly backups)
   Keep Daily: 14 days
   Keep Weekly: 8 weeks
   Keep Monthly: 6 months
   Keep Yearly: 2 years

Workflow 5: Multi-Cloud Redundancy
----------------------------------

This workflow demonstrates backing up to multiple cloud providers for redundancy.

Multi-Cloud Configuration
~~~~~~~~~~~~~~~~~~~~~~~

**Primary Cloud Storage (AWS S3):**

.. code-block:: text

   Name: Primary S3 Storage
   Provider: s3
   Bucket: primary-backup-bucket
   Region: us-east-1
   Path Prefix: borgitory/

**Secondary Cloud Storage (Google Cloud):**

.. code-block:: text

   Name: Secondary GCS Storage
   Provider: google-cloud-storage
   Bucket: secondary-backup-bucket
   Region: us-central1
   Path Prefix: borgitory/

**Tertiary Cloud Storage (Azure):**

.. code-block:: text

   Name: Tertiary Azure Storage
   Provider: azure-blob-storage
   Container: tertiary-backup-container
   Region: eastus
   Path Prefix: borgitory/

Redundant Backup Schedule
~~~~~~~~~~~~~~~~~~~~~~~~

**Primary Backup with Immediate Sync:**

.. code-block:: text

   Name: Primary Backup with Multi-Cloud
   Repository: Critical Data Repository
   Source Path: /mnt/backup/sources/critical-data
   Cron: 0 2 * * * (daily at 2 AM)
   Archive Name: critical-{now:%Y%m%d}
   Compression: lzma
   Pruning Policy: Critical Data Retention
   
   Cloud Sync: Primary S3 Storage
   Sync After Backup: ✓
   
   Notifications: All events

**Secondary Cloud Sync (Offset Schedule):**

.. code-block:: text

   Name: Secondary Cloud Sync
   Repository: Critical Data Repository
   Cron: 0 4 * * * (daily at 4 AM, 2 hours after primary)
   Type: Cloud Sync Only
   
   Cloud Sync: Secondary GCS Storage
   Sync Full Repository: ✓
   
   Notifications: Failure only

**Weekly Tertiary Sync:**

.. code-block:: text

   Name: Weekly Tertiary Sync
   Repository: Critical Data Repository
   Cron: 0 6 * * 0 (weekly on Sunday at 6 AM)
   Type: Cloud Sync Only
   
   Cloud Sync: Tertiary Azure Storage
   Sync Full Repository: ✓
   
   Notifications: Success and Failure

Monitoring and Health Checks
----------------------------

Workflow Health Monitoring
~~~~~~~~~~~~~~~~~~~~~~~~~

**Create Monitoring Dashboard:**

1. **Job Success Rates**
   
   * Monitor success/failure ratios for each workflow
   * Set up alerts for consecutive failures
   * Track backup duration trends

2. **Storage Usage Monitoring**
   
   * Monitor repository growth rates
   * Track cloud storage usage and costs
   * Set up alerts for rapid growth

3. **Schedule Adherence**
   
   * Verify schedules run on time
   * Monitor for schedule conflicts
   * Track missed backup windows

**Health Check Script:**

Create a health check script (``/scripts/backup_health_check.sh``):

.. code-block:: bash

   #!/bin/bash
   # Backup health check script
   
   BORGITORY_API="http://localhost:8000/api"
   
   # Check recent job status
   recent_jobs=$(curl -s "$BORGITORY_API/jobs?limit=10&status=failed")
   
   # Check repository accessibility
   repositories=$(curl -s "$BORGITORY_API/repositories")
   
   # Check cloud sync status
   cloud_configs=$(curl -s "$BORGITORY_API/cloud-sync/configs")
   
   # Generate health report
   echo "Backup Health Report - $(date)"
   echo "================================"
   
   # Add health check logic here
   # Send alerts if issues detected

Performance Optimization
-----------------------

Workflow Performance Tips
~~~~~~~~~~~~~~~~~~~~~~~~

1. **Schedule Distribution**
   
   * Spread backup schedules across time
   * Avoid overlapping resource-intensive operations
   * Consider system load patterns

2. **Compression Strategy**
   
   * Use lz4 for frequently changing data
   * Use lzma for archival data
   * Use zlib for balanced performance

3. **Exclude Patterns**
   
   * Exclude temporary files and caches
   * Exclude large media files if not critical
   * Use specific patterns to reduce scan time

4. **Resource Management**
   
   * Limit concurrent backup operations
   * Monitor disk I/O during backups
   * Consider network bandwidth for cloud sync

Troubleshooting Workflows
------------------------

Common Issues and Solutions
~~~~~~~~~~~~~~~~~~~~~~~~~

**Schedule Conflicts:**

.. code-block:: text

   Problem: Multiple schedules running simultaneously
   Solution: Stagger schedule times, monitor resource usage

**Cloud Sync Failures:**

.. code-block:: text

   Problem: Network timeouts during large uploads
   Solution: Implement retry logic, use bandwidth limiting

**Storage Space Issues:**

.. code-block:: text

   Problem: Repository storage filling up
   Solution: Adjust pruning policies, monitor growth trends

**Notification Spam:**

.. code-block:: text

   Problem: Too many success notifications
   Solution: Configure notifications for failures only on frequent schedules

Best Practices
--------------

Workflow Design Principles
~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Start Simple** - Begin with basic workflows and add complexity gradually
2. **Test Thoroughly** - Test each component before combining into workflows
3. **Monitor Actively** - Set up monitoring and alerting for all workflows
4. **Document Everything** - Document workflow purposes and configurations
5. **Regular Review** - Periodically review and optimize workflows

Security Considerations
~~~~~~~~~~~~~~~~~~~~~

1. **Credential Management** - Use secure storage for cloud credentials
2. **Access Control** - Limit access to backup repositories
3. **Encryption** - Use strong passphrases for repositories
4. **Network Security** - Secure network connections for cloud sync

Next Steps
----------

* Review :doc:`monitoring-backup-health` for comprehensive monitoring
* Set up :doc:`performance-optimization` for better workflow performance
* Configure :doc:`multi-cloud-sync` for additional redundancy
* Explore :doc:`../troubleshooting` for workflow-specific issues

With automated workflows configured, your backup infrastructure will run reliably with minimal manual intervention, providing comprehensive protection for your data with proper monitoring and alerting.
