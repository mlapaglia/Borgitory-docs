Features Overview
=================

Borgitory provides a comprehensive set of features for managing BorgBackup repositories through a modern web interface. 
This page details all available functionality and capabilities.

Core Backup Management
----------------------

Repository Management
~~~~~~~~~~~~~~~~~~~~~

**Multi-Repository Support**
   * Add and manage multiple Borg repositories simultaneously
   * Support for local and remote repositories
   * Secure passphrase storage with encryption
   * Repository validation and connection testing
   * Repository statistics and health monitoring

**Repository Configuration**
   * Flexible repository paths (local filesystem or network locations)
   * Encrypted credential storage using Fernet encryption
   * Repository-specific settings and preferences
   * Automatic repository discovery and validation

Manual Backup Operations
~~~~~~~~~~~~~~~~~~~~~~~~

**On-Demand Backups**
   * Create backups instantly with configurable parameters
   * Flexible source path selection with path validation
   * Multiple compression algorithms (lz4, zlib, lzma, zstd)
   * Custom archive naming with timestamp support
   * Exclude patterns and file filtering

**Real-Time Progress Monitoring**
   * Live backup progress with detailed statistics
   * File-by-file progress tracking
   * Transfer rate and ETA calculations
   * Expandable task details with full command output
   * Server-Sent Events for real-time updates

Archive Management
~~~~~~~~~~~~~~~~~

**Archive Browser**
   * Interactive directory-based archive exploration
   * FUSE-mounted filesystem for direct file access
   * Real-time navigation through archive contents
   * File metadata display (size, modification dates, permissions)
   * Breadcrumb navigation for easy directory traversal

**File Downloads**
   * Direct file downloads from mounted archives
   * Streaming downloads without temporary storage
   * Support for large files and slow connections
   * Multiple concurrent downloads
   * Efficient FUSE-based file access

**Archive Operations**
   * Archive listing and metadata viewing
   * Archive deletion and cleanup
   * Archive information and statistics
   * Archive comparison and diff capabilities

Automated Operations
-------------------

Scheduled Backups
~~~~~~~~~~~~~~~~~

**Cron-Based Scheduling**
   * Flexible cron expression support for backup timing
   * Human-readable cron descriptions
   * Multiple schedules per repository
   * Schedule enable/disable functionality
   * Timezone-aware scheduling

**Advanced Scheduling Options**
   * Custom compression settings per schedule
   * Source path configuration per schedule
   * Integration with pruning policies
   * Notification settings per schedule
   * Schedule conflict detection and management

Archive Pruning
~~~~~~~~~~~~~~

**Retention Policies**
   * **Simple Strategy**: Keep archives within X days
   * **Advanced Strategy**: Granular retention rules
     
     - Daily archives retention
     - Weekly archives retention  
     - Monthly archives retention
     - Yearly archives retention

**Pruning Options**
   * Dry-run mode to preview pruning actions
   * Detailed prune lists showing what will be removed
   * Space savings calculations and statistics
   * Force prune execution for immediate cleanup
   * Integration with backup schedules

**Pruning Safety Features**
   * Preview mode before actual deletion
   * Comprehensive logging of pruning operations
   * Space reclamation reporting
   * Rollback capabilities for safety

Cloud Synchronization
---------------------

Multi-Provider Support
~~~~~~~~~~~~~~~~~~~~~

Borgitory supports multiple cloud storage providers through Rclone integration:

**Currently Supported Providers:**
   * Amazon S3 and S3-compatible services
   * Google Cloud Storage
   * Microsoft Azure Blob Storage
   * Backblaze B2
   * DigitalOcean Spaces
   * Wasabi Hot Cloud Storage
   * Generic S3-compatible services

**Provider Features:**
   * Automatic provider discovery through registry system
   * Provider-specific configuration validation
   * Connection testing and validation
   * Secure credential storage
   * Provider-specific optimization settings

Cloud Sync Operations
~~~~~~~~~~~~~~~~~~~~

**Automated Synchronization**
   * Post-backup automatic sync to cloud storage
   * Manual sync triggers for immediate uploads
   * Progress tracking with real-time updates
   * Retry logic for failed transfers
   * Bandwidth limiting and throttling options

**Sync Configuration**
   * Path prefix configuration for organized storage
   * Encryption settings for cloud storage
   * Compression options for cloud transfers
   * Selective sync patterns and filtering
   * Multi-destination sync support

**Sync Monitoring**
   * Real-time sync progress with transfer statistics
   * Sync history and logging
   * Error reporting and retry mechanisms
   * Bandwidth usage monitoring
   * Success/failure notifications

Job Management System
--------------------

Real-Time Job Monitoring
~~~~~~~~~~~~~~~~~~~~~~~~

**Live Job Tracking**
   * Real-time job status updates
   * Progress indicators for each job stage
   * Expandable task details with full output
   * Job queuing and prioritization
   * Concurrent job management

**Job History**
   * Persistent storage of all job results
   * Searchable job history with filtering
   * Detailed job logs and error reporting
   * Job duration and performance metrics
   * Export capabilities for job data

**Task Management**
   * Individual task tracking within jobs
   * Task dependency management
   * Task retry and recovery mechanisms
   * Task output streaming and logging
   * Task cancellation and cleanup

Notifications
------------

Push Notifications
~~~~~~~~~~~~~~~~~

**Pushover Integration**
   * Job completion notifications
   * Failure alerts with error details
   * Success confirmations
   * Configurable notification triggers
   * Custom message formatting

**Notification Settings**
   * Per-schedule notification configuration
   * Global notification preferences
   * Notification filtering and rules
   * Emergency notification escalation
   * Quiet hours and notification scheduling

User Interface
--------------

Modern Web Interface
~~~~~~~~~~~~~~~~~~~

**Technology Stack**
   * **HTMX**: Dynamic HTML updates without JavaScript frameworks
   * **Alpine.js**: Lightweight JavaScript reactivity for interactive components
   * **Tailwind CSS**: Utility-first styling with responsive design
   * **Server-Sent Events**: Real-time progress updates and live monitoring

**Responsive Design**
   * Mobile-friendly interface with touch optimization
   * Tablet and desktop layout optimization
   * Dark/light theme support
   * Accessibility features and keyboard navigation
   * Progressive web app capabilities

**User Experience Features**
   * Intuitive navigation with breadcrumbs
   * Context-sensitive help and tooltips
   * Drag-and-drop file operations
   * Keyboard shortcuts for power users
   * Customizable dashboard layouts

Security Features
----------------

Authentication & Authorization
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**User Management**
   * Secure username/password authentication
   * BCrypt password hashing with salt
   * Session management with secure cookies
   * Account lockout protection
   * Password strength requirements

**Data Security**
   * Encrypted credential storage using Fernet encryption
   * Secure session management
   * CSRF protection on all forms
   * Input validation and sanitization
   * SQL injection prevention

**Access Control**
   * Role-based access control (planned)
   * Repository-level permissions (planned)
   * Audit logging for security events
   * Secure API endpoints with authentication
   * Rate limiting and abuse prevention

API & Integration
----------------

REST API
~~~~~~~

**Comprehensive API**
   * Full REST API for all functionality
   * OpenAPI/Swagger documentation at ``/docs``
   * ReDoc documentation at ``/redoc``
   * JSON-based request/response format
   * Authentication via API keys (planned)

**API Features**
   * Repository management endpoints
   * Backup operation triggers
   * Job monitoring and history
   * Configuration management
   * Real-time status endpoints

**Integration Support**
   * Webhook support for external integrations
   * CLI tool for automation scripts
   * Docker API for container management
   * Prometheus metrics export (planned)
   * Third-party monitoring system integration

Monitoring & Observability
--------------------------

System Monitoring
~~~~~~~~~~~~~~~~

**Health Checks**
   * Application health monitoring
   * Repository connectivity checks
   * Storage space monitoring
   * Service dependency validation
   * Performance metrics collection

**Logging & Debugging**
   * Comprehensive application logging
   * Structured logging with JSON format
   * Log level configuration
   * Debug mode for troubleshooting
   * Log rotation and archival

**Performance Monitoring**
   * Job execution time tracking
   * Resource usage monitoring
   * Transfer rate optimization
   * Bottleneck identification
   * Performance trend analysis

Architecture Features
--------------------

Modern Python Stack
~~~~~~~~~~~~~~~~~~~

**Backend Technologies**
   * **FastAPI**: Modern Python web framework with automatic OpenAPI docs
   * **SQLAlchemy**: Powerful ORM with async support
   * **APScheduler**: Advanced job scheduling with cron support
   * **Pydantic**: Data validation and serialization
   * **Alembic**: Database migrations and versioning

**Database & Storage**
   * SQLite for lightweight deployment
   * PostgreSQL support (planned)
   * File-based configuration storage
   * Encrypted sensitive data storage
   * Automatic database migrations

**Scalability Features**
   * Async/await throughout the application
   * Connection pooling and optimization
   * Background task processing
   * Horizontal scaling support (planned)
   * Container orchestration ready

Development & Deployment
-----------------------

Deployment Options
~~~~~~~~~~~~~~~~~

**Container Support**
   * Official Docker images on Docker Hub
   * Docker Compose configurations
   * Kubernetes deployment manifests (planned)
   * Multi-architecture container support
   * Optimized container layers

**Installation Methods**
   * PyPI package installation
   * Docker containerized deployment
   * Development installation from source
   * Automated deployment scripts
   * Configuration management integration

**Development Features**
   * Hot-reload development server
   * Comprehensive test suite with pytest
   * Code linting and formatting with Ruff
   * Type checking with MyPy
   * GitHub Actions CI/CD pipeline

Extensibility
~~~~~~~~~~~~

**Plugin System (Planned)**
   * Custom provider plugins
   * Notification plugin architecture
   * Custom authentication providers
   * Storage backend extensions
   * UI theme and customization support

**Configuration Management**
   * Environment variable configuration
   * Configuration file support
   * Runtime configuration updates
   * Configuration validation
   * Template-based configuration generation

Coming Soon
----------

**Planned Features**
   * Multi-user support with role-based access control
   * PostgreSQL database backend support
   * Advanced monitoring with Prometheus metrics
   * Plugin system for extensibility
   * Kubernetes operator for orchestration
   * Advanced reporting and analytics
   * Backup verification and integrity checking
   * Multi-tenancy support
   * Advanced search and filtering
   * Backup deduplication analysis

For the latest feature updates and roadmap, visit the `GitHub repository <https://github.com/mlapaglia/Borgitory>`_.
