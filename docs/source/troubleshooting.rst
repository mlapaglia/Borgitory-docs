Troubleshooting Guide
====================

This guide covers common issues, error messages, and solutions when using Borgitory.

Quick Diagnostics
-----------------

System Health Check
~~~~~~~~~~~~~~~~~~

Before troubleshooting specific issues, verify your system meets the basic requirements:

**Check BorgBackup Installation:**

.. code-block:: bash

   # Verify Borg is installed and accessible
   borg --version
   
   # Check PATH includes Borg location
   which borg
   
   # Test basic Borg functionality
   borg help

**Check Rclone Installation (for cloud sync):**

.. code-block:: bash

   # Verify Rclone is installed
   rclone --version
   
   # List configured remotes
   rclone listremotes
   
   # Test basic functionality
   rclone help

**Check System Resources:**

.. code-block:: bash

   # Check disk space
   df -h
   
   # Check memory usage
   free -h
   
   # Check CPU usage
   top

**Docker-Specific Checks:**

.. code-block:: bash

   # Check container status
   docker ps
   
   # Check container logs
   docker logs borgitory
   
   # Check FUSE availability
   ls -la /dev/fuse

Installation Issues
------------------

PyPI Installation Problems
~~~~~~~~~~~~~~~~~~~~~~~~~

**Python Version Compatibility**

.. code-block:: text

   Error: borgitory requires Python 3.11 or higher

**Solution:**

.. code-block:: bash

   # Check Python version
   python --version
   
   # Install Python 3.11+ using pyenv (recommended)
   curl https://pyenv.run | bash
   pyenv install 3.11.0
   pyenv global 3.11.0
   
   # Or use system package manager
   # Ubuntu/Debian:
   sudo apt update
   sudo apt install python3.11 python3.11-pip
   
   # Create virtual environment with correct Python
   python3.11 -m venv .venv
   source .venv/bin/activate
   pip install borgitory

**Missing System Dependencies**

.. code-block:: text

   Error: Failed building wheel for pyfuse3

**Solution:**

.. code-block:: bash

   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3-dev libfuse3-dev pkg-config
   
   # CentOS/RHEL/Fedora
   sudo dnf install python3-devel fuse3-devel pkgconfig
   
   # macOS
   brew install macfuse pkg-config

**Permission Errors During Installation**

.. code-block:: text

   Error: Permission denied when installing borgitory

**Solution:**

.. code-block:: bash

   # Use virtual environment (recommended)
   python -m venv .venv
   source .venv/bin/activate
   pip install borgitory
   
   # Or install for user only
   pip install --user borgitory

Docker Installation Problems
~~~~~~~~~~~~~~~~~~~~~~~~~~~

**FUSE Mount Failures**

.. code-block:: text

   Error: Archive browsing disabled - FUSE not available

**Solution:**

.. code-block:: bash

   # Ensure container runs with proper capabilities
   docker run -d \
     --cap-add SYS_ADMIN \
     --device /dev/fuse \
     mlapaglia/borgitory:latest
   
   # Check if FUSE is available on host
   ls -la /dev/fuse
   
   # Install FUSE if missing
   # Ubuntu/Debian:
   sudo apt install fuse3
   
   # Load FUSE kernel module if needed
   sudo modprobe fuse

**Volume Mount Issues**

.. code-block:: text

   Error: No such file or directory when accessing backup sources

**Solution:**

.. code-block:: bash

   # Verify source paths exist on host
   ls -la /path/to/backup/sources
   
   # Check volume mounts in Docker Compose
   volumes:
     - /actual/host/path:/mnt/container/path:ro
   
   # Ensure paths are under /mnt/ in container
   - /home/user/documents:/mnt/backup/documents:ro

Repository Issues
----------------

Repository Connection Failures
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Invalid Repository Path**

.. code-block:: text

   Error: Repository not found or inaccessible

**Diagnosis:**

.. code-block:: bash

   # Test repository access directly with Borg
   borg info /path/to/repository
   
   # Check if path exists and is accessible
   ls -la /path/to/repository
   
   # Verify permissions
   stat /path/to/repository

**Solutions:**

* Verify the repository path is correct
* Ensure the path is accessible from within the container (use ``/mnt/`` prefix for Docker)
* Check file permissions allow read/write access
* For remote repositories, verify SSH keys and network connectivity

**Incorrect Passphrase**

.. code-block:: text

   Error: Invalid passphrase or corrupted repository

**Diagnosis:**

.. code-block:: bash

   # Test passphrase directly with Borg
   borg list /path/to/repository
   # Enter passphrase when prompted

**Solutions:**

* Verify the passphrase is exactly correct (case-sensitive)
* Check for hidden characters or encoding issues
* Try accessing the repository with Borg CLI to confirm passphrase
* If passphrase is lost, repository cannot be recovered

**Repository Corruption**

.. code-block:: text

   Error: Repository integrity check failed

**Diagnosis:**

.. code-block:: bash

   # Check repository integrity
   borg check /path/to/repository
   
   # Detailed check with repair option
   borg check --repair /path/to/repository

**Solutions:**

* Run ``borg check --repair`` to attempt automatic repair
* If repair fails, restore from backup repository
* Check underlying storage for hardware issues
* Consider filesystem corruption on storage device

Backup Operation Failures
-------------------------

Backup Job Failures
~~~~~~~~~~~~~~~~~~

**Insufficient Disk Space**

.. code-block:: text

   Error: No space left on device

**Diagnosis:**

.. code-block:: bash

   # Check available space
   df -h
   
   # Check repository location specifically
   df -h /path/to/repository

**Solutions:**

* Free up disk space on repository storage
* Move repository to location with more space
* Implement pruning policies to remove old archives
* Consider using compression to reduce space usage

**Permission Denied Errors**

.. code-block:: text

   Error: Permission denied accessing source files

**Diagnosis:**

.. code-block:: bash

   # Check source path permissions
   ls -la /path/to/source
   
   # Test read access
   cat /path/to/source/testfile

**Solutions:**

* Ensure Borgitory has read access to source directories
* For Docker, check volume mount permissions
* Run container with appropriate user ID
* Use ``sudo`` if necessary for system directories

**Exclude Pattern Issues**

.. code-block:: text

   Warning: Exclude pattern not matching any files

**Diagnosis:**

* Review exclude patterns for syntax errors
* Test patterns with find command
* Check if patterns are relative to source path

**Solutions:**

.. code-block:: bash

   # Test exclude patterns
   find /path/to/source -name "*.tmp"
   
   # Common exclude patterns
   *.tmp
   *.log
   .git/
   __pycache__/
   node_modules/

Cloud Sync Issues
----------------

Connection Failures
~~~~~~~~~~~~~~~~~~

**Invalid Credentials**

.. code-block:: text

   Error: Access denied (403) - Invalid credentials

**Diagnosis:**

.. code-block:: bash

   # Test credentials with rclone directly
   rclone lsd remote:bucket
   
   # Check credential format and validity
   rclone config show remote

**Solutions:**

* Verify access keys are correct and not expired
* Check if credentials have necessary permissions
* For AWS S3, verify IAM policy allows required actions
* Test credentials outside Borgitory first

**Network Connectivity Issues**

.. code-block:: text

   Error: Connection timeout or network unreachable

**Diagnosis:**

.. code-block:: bash

   # Test network connectivity
   ping google.com
   
   # Test HTTPS connectivity
   curl -I https://s3.amazonaws.com
   
   # Check DNS resolution
   nslookup s3.amazonaws.com

**Solutions:**

* Verify internet connectivity
* Check firewall rules allow outbound HTTPS
* Configure proxy settings if behind corporate firewall
* Verify DNS resolution works correctly

**Bucket/Container Access Issues**

.. code-block:: text

   Error: Bucket does not exist or access denied

**Solutions:**

* Verify bucket/container name is correct
* Check if bucket exists in specified region
* Ensure credentials have access to the specific bucket
* Review bucket policies and access controls

Performance Issues
-----------------

Slow Backup Operations
~~~~~~~~~~~~~~~~~~~~

**Disk I/O Bottlenecks**

**Diagnosis:**

.. code-block:: bash

   # Monitor disk I/O
   iostat -x 1
   
   # Check disk usage patterns
   iotop

**Solutions:**

* Use SSD storage for repositories when possible
* Avoid running multiple intensive operations simultaneously
* Consider different compression algorithms (lz4 for speed, lzma for size)
* Spread repositories across multiple disks

**Network Performance Issues**

**Diagnosis:**

.. code-block:: bash

   # Test network speed
   speedtest-cli
   
   # Monitor network usage
   iftop
   
   # Test cloud provider connectivity
   rclone test speed remote:

**Solutions:**

* Choose cloud regions closer to your location
* Use appropriate compression for your network speed
* Consider bandwidth limiting during peak hours
* Implement incremental backup strategies

High Memory Usage
~~~~~~~~~~~~~~~

**Large Repository Memory Consumption**

**Diagnosis:**

.. code-block:: bash

   # Monitor memory usage
   free -h
   
   # Check process memory usage
   ps aux --sort=-%mem | head

**Solutions:**

* Increase available memory
* Use checkpoint intervals to reduce memory usage
* Split large repositories into smaller ones
* For Docker, increase memory limits

Database Issues
--------------

SQLite Database Problems
~~~~~~~~~~~~~~~~~~~~~~

**Database Corruption**

.. code-block:: text

   Error: Database disk image is malformed

**Diagnosis:**

.. code-block:: bash

   # Check database integrity
   sqlite3 data/borgitory.db "PRAGMA integrity_check;"

**Solutions:**

.. code-block:: bash

   # Backup current database
   cp data/borgitory.db data/borgitory.db.backup
   
   # Attempt repair
   sqlite3 data/borgitory.db ".recover" | sqlite3 data/borgitory_recovered.db
   
   # Replace with recovered database
   mv data/borgitory_recovered.db data/borgitory.db
   
   # If repair fails, restore from backup
   cp data/borgitory.db.backup data/borgitory.db

**Database Lock Issues**

.. code-block:: text

   Error: Database is locked

**Solutions:**

* Stop Borgitory application
* Check for zombie processes
* Remove lock files if present
* Restart application

Archive Browser Issues
---------------------

FUSE Mount Problems
~~~~~~~~~~~~~~~~~

**Archive Browser Disabled**

.. code-block:: text

   Warning: Archive browsing disabled - FUSE not available

**Solutions:**

.. code-block:: bash

   # For Docker deployment
   docker run --cap-add SYS_ADMIN --device /dev/fuse ...
   
   # For native installation, install FUSE
   # Ubuntu/Debian:
   sudo apt install fuse3
   
   # Check FUSE kernel module
   lsmod | grep fuse
   sudo modprobe fuse

**Mount Permission Errors**

.. code-block:: text

   Error: Permission denied mounting archive

**Solutions:**

* Ensure user has permission to use FUSE
* Add user to fuse group: ``sudo usermod -a -G fuse $USER``
* Check ``/etc/fuse.conf`` allows user mounts
* Verify ``user_allow_other`` option is enabled

Web Interface Issues
-------------------

Login Problems
~~~~~~~~~~~~

**Forgot Password**

**Solution:**

.. code-block:: bash

   # Reset admin password using CLI
   borgitory reset-password admin
   
   # Or recreate admin user
   borgitory create-user admin --password newpassword --admin

**Session Issues**

.. code-block:: text

   Error: Session expired or invalid

**Solutions:**

* Clear browser cookies and cache
* Check system clock is correct
* Verify secret key hasn't changed
* Restart Borgitory service

Connection Refused
~~~~~~~~~~~~~~~~

.. code-block:: text

   Error: Connection refused to localhost:8000

**Diagnosis:**

.. code-block:: bash

   # Check if service is running
   ps aux | grep borgitory
   
   # Check port binding
   netstat -tlnp | grep 8000
   
   # For Docker
   docker ps
   docker logs borgitory

**Solutions:**

* Start Borgitory service
* Check port configuration
* Verify firewall allows port 8000
* Check if another service is using the port

Getting Help
-----------

Collecting Debug Information
~~~~~~~~~~~~~~~~~~~~~~~~~~

When reporting issues, include:

**System Information:**

.. code-block:: bash

   # Operating system
   uname -a
   
   # Python version
   python --version
   
   # Borgitory version
   borgitory --version
   
   # Docker version (if using Docker)
   docker --version

**Application Logs:**

.. code-block:: bash

   # For PyPI installation
   borgitory serve --log-level debug
   
   # For Docker
   docker logs borgitory
   
   # Check system logs
   journalctl -u borgitory

**Configuration Details:**

* Sanitized configuration (remove sensitive data)
* Repository setup information
* Cloud provider configuration (without credentials)
* Error messages with full stack traces

Support Channels
~~~~~~~~~~~~~~

* **GitHub Issues**: https://github.com/mlapaglia/Borgitory/issues
* **GitHub Discussions**: https://github.com/mlapaglia/Borgitory/discussions
* **Documentation**: https://borgitory.readthedocs.io/

When reporting issues:

1. Search existing issues first
2. Provide detailed system information
3. Include relevant log entries
4. Describe steps to reproduce
5. Mention any recent changes to your setup

Common Error Codes
-----------------

HTTP Error Codes
~~~~~~~~~~~~~~~

* **400 Bad Request**: Invalid input data or configuration
* **401 Unauthorized**: Authentication required or failed
* **403 Forbidden**: Insufficient permissions
* **404 Not Found**: Repository or resource doesn't exist
* **500 Internal Server Error**: Application error (check logs)

Borg Exit Codes
~~~~~~~~~~~~~~

* **0**: Success
* **1**: Warning (operation succeeded with warnings)
* **2**: Error (operation failed)
* **3**: Interrupted (operation was interrupted)
* **4**: Repository does not exist
* **5**: Repository already exists

Rclone Exit Codes
~~~~~~~~~~~~~~~

* **0**: Success
* **1**: Syntax or usage error
* **2**: Error not otherwise categorised
* **3**: Directory not found
* **4**: File not found
* **5**: Temporary error (retry may help)
* **6**: Less serious errors (like file skipped)
* **7**: Fatal error (don't retry)
* **8**: Transfer exceeded - limit set by --max-transfer reached
* **9**: Operation successful, but no files transferred

Preventive Measures
------------------

Regular Maintenance
~~~~~~~~~~~~~~~~~

* **Monitor disk space** regularly
* **Test restore procedures** periodically
* **Update Borgitory** to latest versions
* **Backup configuration** and encryption keys
* **Monitor logs** for warnings and errors
* **Verify repository integrity** monthly

Best Practices
~~~~~~~~~~~~

* Use strong, unique passphrases
* Implement 3-2-1 backup strategy
* Test backups before relying on them
* Monitor backup success rates
* Keep documentation updated
* Plan for disaster recovery scenarios
