How to Set Up AWS S3 Cloud Sync
================================

This guide walks you through configuring Amazon S3 for cloud synchronization with Borgitory.

Prerequisites
-------------

Before starting, ensure you have:

* An AWS account with S3 access
* An S3 bucket created for storing backups
* AWS credentials (Access Key ID and Secret Access Key)
* Borgitory installed with Rclone support

Step 1: Create AWS Credentials
------------------------------

Create IAM User
~~~~~~~~~~~~~~~

1. **Log into AWS Console**
   
   * Navigate to the IAM service
   * Click "Users" in the left sidebar

2. **Create New User**
   
   * Click "Create user"
   * Enter username: ``borgitory-backup-user``
   * Select "Programmatic access"

3. **Attach Permissions**
   
   * Choose "Attach existing policies directly"
   * Search for and select ``AmazonS3FullAccess``
   * Or create a custom policy for specific bucket access

4. **Save Credentials**
   
   * Download the credentials CSV file
   * Note the Access Key ID and Secret Access Key
   * Store these securely - they won't be shown again

Custom S3 Policy (Recommended)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For better security, create a custom policy that only allows access to your backup bucket:

.. code-block:: json

   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:ListBucket",
                   "s3:GetBucketLocation"
               ],
               "Resource": "arn:aws:s3:::your-backup-bucket"
           },
           {
               "Effect": "Allow",
               "Action": [
                   "s3:GetObject",
                   "s3:PutObject",
                   "s3:DeleteObject"
               ],
               "Resource": "arn:aws:s3:::your-backup-bucket/*"
           }
       ]
   }

Replace ``your-backup-bucket`` with your actual bucket name.

Step 2: Create S3 Bucket
------------------------

Bucket Configuration
~~~~~~~~~~~~~~~~~~~~

1. **Create Bucket**
   
   * Navigate to S3 service in AWS Console
   * Click "Create bucket"
   * Enter bucket name: ``my-borgitory-backups``
   * Choose appropriate region (closer to your location for better performance)

2. **Configure Security**
   
   * **Block Public Access**: Keep all settings enabled (recommended)
   * **Bucket Versioning**: Enable if you want version history
   * **Server-side Encryption**: Enable with S3 managed keys (SSE-S3)

3. **Lifecycle Policies** (Optional)
   
   * Configure automatic transitions to cheaper storage classes
   * Set up automatic deletion of old versions

Example Lifecycle Policy
~~~~~~~~~~~~~~~~~~~~~~~~

To automatically move backups to cheaper storage after 30 days:

.. code-block:: json

   {
       "Rules": [
           {
               "ID": "BorgitoryBackupLifecycle",
               "Status": "Enabled",
               "Transitions": [
                   {
                       "Days": 30,
                       "StorageClass": "STANDARD_IA"
                   },
                   {
                       "Days": 90,
                       "StorageClass": "GLACIER"
                   },
                   {
                       "Days": 365,
                       "StorageClass": "DEEP_ARCHIVE"
                   }
               ]
           }
       ]
   }

Step 3: Configure Borgitory
---------------------------

Add S3 Configuration
~~~~~~~~~~~~~~~~~~~~

1. **Navigate to Cloud Sync**
   
   * Open Borgitory web interface
   * Go to Cloud Sync → Configurations
   * Click "Add Configuration"

2. **Select S3 Provider**
   
   * Choose "Amazon S3" from the provider dropdown
   * The S3-specific fields will appear

3. **Enter Configuration Details**
   
   .. code-block:: text
   
      Name: Production S3 Backup
      Provider: s3
      Access Key ID: AKIAIOSFODNN7EXAMPLE
      Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
      Bucket Name: my-borgitory-backups
      Region: us-east-1
      Path Prefix: server-backups/
   
   * **Name**: Friendly name for this configuration
   * **Access Key ID**: From your AWS credentials
   * **Secret Access Key**: From your AWS credentials
   * **Bucket Name**: Your S3 bucket name
   * **Region**: AWS region where your bucket is located
   * **Path Prefix**: Optional path within bucket for organization

4. **Test Connection**
   
   * Click "Test Connection" button
   * Wait for green checkmark indicating success
   * If test fails, verify credentials and bucket permissions

5. **Save Configuration**
   
   * Click "Save" to store the configuration
   * Configuration appears in the Cloud Sync list

Step 4: Test Cloud Sync
-----------------------

Manual Sync Test
~~~~~~~~~~~~~~~~

1. **Prepare Test Repository**
   
   * Ensure you have a repository with at least one archive
   * Note the repository size for comparison

2. **Start Manual Sync**
   
   * Go to Cloud Sync → Manual Sync
   * Select your repository
   * Choose your S3 configuration
   * Click "Start Sync"

3. **Monitor Progress**
   
   * Watch real-time sync progress
   * Note transfer speeds and estimated completion time
   * Check for any errors or warnings

4. **Verify in AWS Console**
   
   * Open S3 console
   * Navigate to your bucket
   * Verify files are uploaded under the correct path prefix
   * Check file sizes match expectations

Automated Sync Setup
~~~~~~~~~~~~~~~~~~~~

1. **Configure Schedule**
   
   * Go to Schedules
   * Edit existing schedule or create new one
   * Enable "Cloud Sync" option
   * Select your S3 configuration

2. **Test Automated Flow**
   
   * Run the schedule manually or wait for next execution
   * Verify backup completes successfully
   * Confirm automatic sync to S3 occurs
   * Check job history for any issues

Step 5: Optimization and Monitoring
-----------------------------------

Performance Optimization
~~~~~~~~~~~~~~~~~~~~~~~~

**Transfer Speed**
   * Choose S3 region closest to your server
   * Consider using S3 Transfer Acceleration for global deployments
   * Monitor bandwidth usage and adjust if needed

**Storage Costs**
   * Use lifecycle policies to transition old backups to cheaper storage
   * Monitor S3 costs in AWS billing console
   * Consider using S3 Intelligent Tiering for automatic optimization

**Compression Settings**
   * Use appropriate compression in Borgitory (lz4 for speed, lzma for size)
   * Balance compression ratio vs. upload time
   * Test different settings with your data

Monitoring and Alerts
~~~~~~~~~~~~~~~~~~~~~

**CloudWatch Metrics**
   * Set up CloudWatch alarms for unusual S3 activity
   * Monitor bucket size growth
   * Track request patterns and errors

**Borgitory Monitoring**
   * Enable push notifications for sync failures
   * Monitor sync history for patterns
   * Set up regular sync health checks

**Cost Monitoring**
   * Use AWS Cost Explorer to track S3 expenses
   * Set up billing alerts for unexpected costs
   * Review storage class distribution regularly

Troubleshooting Common Issues
-----------------------------

Connection Failures
~~~~~~~~~~~~~~~~~~~

**Invalid Credentials**
   
   .. code-block:: text
   
      Error: Access Denied (403)
   
   * Verify Access Key ID and Secret Access Key are correct
   * Check if IAM user has necessary S3 permissions
   * Ensure credentials haven't expired

**Bucket Access Issues**
   
   .. code-block:: text
   
      Error: NoSuchBucket
   
   * Verify bucket name is spelled correctly
   * Check if bucket exists in the specified region
   * Ensure bucket is in the same region as specified in configuration

**Network Issues**
   
   .. code-block:: text
   
      Error: Connection timeout
   
   * Check internet connectivity
   * Verify firewall allows HTTPS traffic to AWS
   * Consider using S3 VPC endpoints if running in AWS

Sync Failures
~~~~~~~~~~~~~

**Insufficient Permissions**
   
   * Review IAM policy attached to user
   * Ensure user has ``s3:PutObject`` permission
   * Check bucket policies don't deny access

**Storage Quota Exceeded**
   
   * Monitor S3 bucket size and costs
   * Implement lifecycle policies to manage old backups
   * Consider using different storage classes

**Large File Issues**
   
   * Rclone automatically handles multipart uploads
   * For very large repositories, consider chunking strategy
   * Monitor transfer progress and retry failed uploads

Security Best Practices
-----------------------

Credential Management
~~~~~~~~~~~~~~~~~~~~~

* Use IAM roles instead of access keys when running on EC2
* Rotate access keys regularly
* Never commit credentials to version control
* Use AWS Secrets Manager for credential storage in production

Bucket Security
~~~~~~~~~~~~~~~

* Enable bucket versioning for additional protection
* Use bucket notifications to monitor access
* Enable AWS CloudTrail for audit logging
* Consider using S3 Object Lock for compliance requirements

Network Security
~~~~~~~~~~~~~~~~

* Use VPC endpoints for private S3 access from EC2
* Enable S3 access logging for security monitoring
* Consider using AWS PrivateLink for enhanced security
* Implement least-privilege access policies

Next Steps
----------

* Set up :doc:`setup-pushover-notifications` for sync alerts
* Configure :doc:`automated-backup-workflows` with S3 integration
* Explore :doc:`multi-cloud-sync` for redundancy
* Review :doc:`performance-optimization` for better sync speeds
