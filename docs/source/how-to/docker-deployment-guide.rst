Docker Deployment Guide
=======================

This guide covers production deployment of Borgitory using Docker and Docker Compose, including best practices for security, performance, and maintenance.

Overview
--------

Borgitory's Docker deployment provides:

* Isolated environment with all dependencies
* FUSE support for archive browsing
* Persistent data storage
* Easy updates and rollbacks
* Scalable configuration

Production Requirements
-----------------------

System Requirements
~~~~~~~~~~~~~~~~~~~

**Minimum Requirements:**
   * 2 CPU cores
   * 4 GB RAM
   * 20 GB disk space (for application)
   * Additional storage for repositories and backups

**Recommended for Production:**
   * 4+ CPU cores
   * 8+ GB RAM
   * SSD storage for application data
   * Separate storage volumes for repositories

**Required Docker Capabilities:**
   * ``SYS_ADMIN`` capability for FUSE mounting
   * ``/dev/fuse`` device access for archive browsing
   * Volume mounting for persistent storage

Network Requirements
~~~~~~~~~~~~~~~~~~~~

* **Port 8000**: Web interface access
* **Outbound HTTPS (443)**: Cloud sync operations
* **Outbound SSH (22)**: Remote repository access (if used)
* **DNS Resolution**: For cloud provider APIs

Production Docker Compose
-------------------------

Complete Production Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Create ``docker-compose.prod.yml``:

.. code-block:: yaml

   version: '3.8'
   
   services:
     borgitory:
       image: mlapaglia/borgitory:latest
       container_name: borgitory-prod
       restart: unless-stopped
       
       # Network configuration
       ports:
         - "8000:8000"
       
       # Security and capabilities
       cap_add:
         - SYS_ADMIN
       devices:
         - /dev/fuse
       security_opt:
         - apparmor:unconfined
       
       # Environment variables
       environment:
         - BORGITORY_HOST=0.0.0.0
         - BORGITORY_PORT=8000
         - BORGITORY_DATA_DIR=/app/data
         - BORGITORY_DEBUG=false
         - TZ=America/New_York
       
       # Volume mounts
       volumes:
         # Application data (persistent)
         - ./data:/app/data
         
         # Backup sources (read-only)
         - /srv/backup-sources:/mnt/backup/sources:ro
         - /home:/mnt/backup/home:ro
         - /etc:/mnt/backup/etc:ro
         
         # Repository storage (read-write)
         - /srv/borg-repos:/mnt/repos
         - /mnt/external-drive/repos:/mnt/external-repos
         
         # Optional: SSH keys for remote repositories
         - ~/.ssh:/root/.ssh:ro
       
       # Resource limits
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '2.0'
           reservations:
             memory: 1G
             cpus: '1.0'
       
       # Health check
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 60s
       
       # Logging configuration
       logging:
         driver: "json-file"
         options:
           max-size: "100m"
           max-file: "5"
   
   # Optional: Reverse proxy with SSL
   networks:
     default:
       name: borgitory-network

Advanced Configuration Options
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**With Traefik Reverse Proxy:**

.. code-block:: yaml

   version: '3.8'
   
   services:
     borgitory:
       image: mlapaglia/borgitory:latest
       container_name: borgitory-prod
       restart: unless-stopped
       
       cap_add:
         - SYS_ADMIN
       devices:
         - /dev/fuse
       
       volumes:
         - ./data:/app/data
         - /srv/backup-sources:/mnt/backup/sources:ro
         - /srv/borg-repos:/mnt/repos
       
       networks:
         - traefik
       
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.borgitory.rule=Host(`backups.yourdomain.com`)"
         - "traefik.http.routers.borgitory.tls=true"
         - "traefik.http.routers.borgitory.tls.certresolver=letsencrypt"
         - "traefik.http.services.borgitory.loadbalancer.server.port=8000"
   
   networks:
     traefik:
       external: true

Storage Configuration
---------------------

Volume Mapping Strategy
~~~~~~~~~~~~~~~~~~~~~~~

**Application Data Volume:**

.. code-block:: yaml

   volumes:
     - ./data:/app/data

Contains:
   * SQLite database
   * Configuration files
   * Encryption keys
   * Job history

**Backup Source Volumes:**

.. code-block:: yaml

   volumes:
     - /srv/backup-sources:/mnt/backup/sources:ro
     - /home:/mnt/backup/home:ro
     - /var/log:/mnt/backup/logs:ro

* Mount as read-only (``:ro``) for safety
* Map all directories you want to backup
* Use descriptive paths under ``/mnt/``

**Repository Storage Volumes:**

.. code-block:: yaml

   volumes:
     - /srv/borg-repos:/mnt/repos
     - /mnt/nas/backups:/mnt/nas-repos
     - /mnt/external-drive:/mnt/external-repos

* Read-write access required
* Can be local or network storage
* Consider redundancy and backup strategies

Directory Structure Example
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: text

   /srv/
   ├── borgitory/
   │   ├── docker-compose.prod.yml
   │   ├── data/                    # Application data volume
   │   │   ├── borgitory.db
   │   │   └── secret_key
   │   └── backups/                 # Backup logs and exports
   ├── backup-sources/              # Source data to backup
   │   ├── documents/
   │   ├── photos/
   │   └── projects/
   └── borg-repos/                  # Borg repository storage
       ├── documents-repo/
       ├── photos-repo/
       └── system-repo/

Security Configuration
----------------------

User and Permissions
~~~~~~~~~~~~~~~~~~~~

**Run as Non-Root User:**

.. code-block:: yaml

   services:
     borgitory:
       user: "1000:1000"  # Replace with your user ID
       # ... other configuration

**File Permissions:**

.. code-block:: bash

   # Set ownership of data directory
   sudo chown -R 1000:1000 ./data
   
   # Set secure permissions
   chmod 700 ./data
   chmod 600 ./data/secret_key

Network Security
~~~~~~~~~~~~~~~~

**Firewall Configuration:**

.. code-block:: bash

   # Allow only necessary ports
   sudo ufw allow 8000/tcp  # Borgitory web interface
   sudo ufw deny 8000/tcp from any to any  # Deny external access
   
   # Or with specific source
   sudo ufw allow from 192.168.1.0/24 to any port 8000

**Reverse Proxy with SSL:**

Use Traefik, Nginx, or Apache for SSL termination:

.. code-block:: nginx

   server {
       listen 443 ssl;
       server_name backups.yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

Backup and Recovery
-------------------

Application Data Backup
~~~~~~~~~~~~~~~~~~~~~~~

**Database Backup:**

.. code-block:: bash

   #!/bin/bash
   # backup-borgitory.sh
   
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/srv/borgitory-backups"
   DATA_DIR="/srv/borgitory/data"
   
   # Create backup directory
   mkdir -p "$BACKUP_DIR"
   
   # Stop container for consistent backup
   docker-compose -f docker-compose.prod.yml stop borgitory
   
   # Create backup archive
   tar -czf "$BACKUP_DIR/borgitory-backup-$DATE.tar.gz" -C "$DATA_DIR" .
   
   # Start container
   docker-compose -f docker-compose.prod.yml start borgitory
   
   # Clean old backups (keep 30 days)
   find "$BACKUP_DIR" -name "borgitory-backup-*.tar.gz" -mtime +30 -delete

**Automated Backup with Cron:**

.. code-block:: bash

   # Add to crontab
   0 2 * * * /srv/borgitory/backup-borgitory.sh

Recovery Procedures
~~~~~~~~~~~~~~~~~~~

**Application Recovery:**

.. code-block:: bash

   # Stop container
   docker-compose -f docker-compose.prod.yml stop borgitory
   
   # Restore from backup
   cd /srv/borgitory
   tar -xzf /srv/borgitory-backups/borgitory-backup-YYYYMMDD_HHMMSS.tar.gz -C data/
   
   # Fix permissions
   chown -R 1000:1000 data/
   
   # Start container
   docker-compose -f docker-compose.prod.yml start borgitory

**Disaster Recovery:**

.. code-block:: bash

   # Complete system restore
   # 1. Install Docker and Docker Compose
   # 2. Restore application data
   # 3. Restore repository data (from offsite backups)
   # 4. Start services
   
   docker-compose -f docker-compose.prod.yml up -d

Monitoring and Maintenance
--------------------------

Health Monitoring
~~~~~~~~~~~~~~~~~

**Docker Health Checks:**

.. code-block:: yaml

   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
     interval: 30s
     timeout: 10s
     retries: 3
     start_period: 60s

**External Monitoring:**

.. code-block:: bash

   #!/bin/bash
   # monitor-borgitory.sh
   
   URL="http://localhost:8000/health"
   
   if ! curl -f -s "$URL" > /dev/null; then
       echo "Borgitory health check failed" | mail -s "Borgitory Alert" admin@example.com
       # Optionally restart service
       docker-compose -f docker-compose.prod.yml restart borgitory
   fi

Log Management
~~~~~~~~~~~~~~

**Log Rotation:**

.. code-block:: yaml

   logging:
     driver: "json-file"
     options:
       max-size: "100m"
       max-file: "5"

**Centralized Logging:**

.. code-block:: yaml

   logging:
     driver: "syslog"
     options:
       syslog-address: "tcp://logserver:514"
       tag: "borgitory"

Updates and Maintenance
~~~~~~~~~~~~~~~~~~~~~~~

**Update Procedure:**

.. code-block:: bash

   #!/bin/bash
   # update-borgitory.sh
   
   cd /srv/borgitory
   
   # Backup current data
   ./backup-borgitory.sh
   
   # Pull latest image
   docker-compose -f docker-compose.prod.yml pull
   
   # Recreate containers
   docker-compose -f docker-compose.prod.yml up -d
   
   # Check health
   sleep 30
   docker-compose -f docker-compose.prod.yml ps
   curl -f http://localhost:8000/health

**Automated Updates:**

.. code-block:: bash

   # Add to crontab for weekly updates
   0 3 * * 0 /srv/borgitory/update-borgitory.sh

Performance Optimization
------------------------

Resource Allocation
~~~~~~~~~~~~~~~~~~~

**CPU Optimization:**

.. code-block:: yaml

   deploy:
     resources:
       limits:
         cpus: '4.0'      # Adjust based on backup workload
       reservations:
         cpus: '2.0'

**Memory Optimization:**

.. code-block:: yaml

   deploy:
     resources:
       limits:
         memory: 4G       # Increase for large repositories
       reservations:
         memory: 2G

Storage Performance
~~~~~~~~~~~~~~~~~~~

**SSD for Application Data:**
   * Use SSD for ``/app/data`` volume
   * Improves database performance
   * Faster job processing

**Network Storage Considerations:**
   * Use local storage for frequently accessed repositories
   * Network storage acceptable for archive storage
   * Consider NFS vs. CIFS performance

Troubleshooting
---------------

Common Issues
~~~~~~~~~~~~~

**FUSE Mount Failures:**

.. code-block:: bash

   # Check FUSE availability
   ls -la /dev/fuse
   
   # Verify container capabilities
   docker inspect borgitory-prod | grep -i cap
   
   # Check kernel modules
   lsmod | grep fuse

**Permission Errors:**

.. code-block:: bash

   # Fix data directory permissions
   sudo chown -R 1000:1000 ./data
   
   # Check volume mount permissions
   ls -la /srv/backup-sources
   ls -la /srv/borg-repos

**Container Won't Start:**

.. code-block:: bash

   # Check logs
   docker-compose -f docker-compose.prod.yml logs borgitory
   
   # Check system resources
   df -h
   free -h
   
   # Verify configuration
   docker-compose -f docker-compose.prod.yml config

Performance Issues
~~~~~~~~~~~~~~~~~~

**Slow Backups:**
   * Check disk I/O: ``iostat -x 1``
   * Monitor network: ``iftop``
   * Review compression settings
   * Consider parallel operations

**High Memory Usage:**
   * Increase memory limits
   * Monitor with ``docker stats``
   * Check for memory leaks in logs

**Database Performance:**
   * Vacuum SQLite database periodically
   * Monitor database size
   * Consider moving to PostgreSQL for large deployments

Next Steps
----------

* Set up :doc:`monitoring-backup-health` for comprehensive monitoring
* Configure :doc:`setup-pushover-notifications` for alerts
* Implement :doc:`automated-backup-workflows` for production schedules
* Review :doc:`performance-optimization` for tuning
* Plan :doc:`multi-cloud-sync` for redundancy
