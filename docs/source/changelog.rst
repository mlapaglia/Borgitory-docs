Changelog
=========

All notable changes to Borgitory are documented here.

The format is based on `Keep a Changelog <https://keepachangelog.com/en/1.0.0/>`_,
and this project adheres to `Semantic Versioning <https://semver.org/spec/v2.0.0.html>`_.

[Unreleased]
------------

Added
~~~~~
* Comprehensive documentation on Read the Docs
* Enhanced cloud provider system with registry pattern
* Multi-provider cloud sync support
* Advanced archive browsing with FUSE mounting
* Real-time job monitoring with Server-Sent Events

Changed
~~~~~~~
* Improved user interface with HTMX and Alpine.js
* Enhanced security with encrypted credential storage
* Better error handling and validation throughout
* Optimized Docker container with proper FUSE support

[1.0.0] - 2024-XX-XX
--------------------

Added
~~~~~
* Initial stable release
* Web-based management interface for BorgBackup
* Repository management with multiple repository support
* Manual and scheduled backup operations
* Real-time progress monitoring
* Archive browser with file download capability
* Cloud synchronization with S3-compatible providers
* Push notifications via Pushover
* User authentication and session management
* RESTful API with OpenAPI documentation
* Docker deployment support
* PyPI package distribution

Features
~~~~~~~~
* **Repository Management**
  
  - Add, configure, and manage multiple Borg repositories
  - Secure passphrase storage with encryption
  - Repository validation and connection testing

* **Backup Operations**
  
  - Manual backups with configurable compression
  - Real-time progress tracking
  - Archive naming with timestamp templates
  - Exclude patterns and file filtering

* **Scheduling System**
  
  - Cron-based backup scheduling
  - Human-readable cron descriptions
  - Schedule enable/disable functionality
  - Integration with pruning and notifications

* **Archive Management**
  
  - Interactive archive browser with FUSE mounting
  - Direct file downloads from archives
  - Archive pruning with retention policies
  - Simple and advanced pruning strategies

* **Cloud Integration**
  
  - Multi-provider cloud sync support
  - Amazon S3 and S3-compatible services
  - Automatic sync after backups
  - Real-time sync progress monitoring

* **Notifications**
  
  - Pushover integration for mobile alerts
  - Success and failure notifications
  - Per-schedule notification configuration

* **User Interface**
  
  - Modern responsive web interface
  - HTMX for dynamic updates
  - Alpine.js for interactivity
  - Tailwind CSS for styling
  - Mobile-friendly design

* **API & Integration**
  
  - Comprehensive REST API
  - OpenAPI/Swagger documentation
  - Real-time updates via Server-Sent Events
  - Session-based authentication

* **Deployment**
  
  - Docker containerization
  - PyPI package distribution
  - Docker Compose configurations
  - Volume mounting strategies

Technical Details
~~~~~~~~~~~~~~~~
* **Backend**: FastAPI, SQLAlchemy, APScheduler
* **Frontend**: HTMX, Alpine.js, Tailwind CSS, Jinja2
* **Database**: SQLite with Alembic migrations
* **Security**: BCrypt password hashing, Fernet encryption
* **Dependencies**: BorgBackup, Rclone, FUSE3

Security
~~~~~~~~
* Encrypted storage of repository passphrases
* Secure session management with cookies
* CSRF protection on all forms
* Input validation and sanitization
* SQL injection prevention via ORM

Performance
~~~~~~~~~~~
* Async/await throughout the application
* Background job processing
* Streaming file downloads
* Efficient FUSE-based archive mounting
* Connection pooling for database access

Known Issues
~~~~~~~~~~~~
* Archive browsing requires FUSE support (disabled without it)
* Single-user authentication (multi-user planned)
* Session-only API authentication (API keys planned)

Migration Notes
~~~~~~~~~~~~~~
This is the initial stable release. Future versions will include migration guides for any breaking changes.

Development
~~~~~~~~~~~
* Python 3.11+ requirement
* Modern packaging with pyproject.toml
* Comprehensive test suite with pytest
* Code quality tools (Ruff, MyPy)
* GitHub Actions CI/CD pipeline
* Docker multi-stage builds

Documentation
~~~~~~~~~~~~
* Complete user documentation
* API reference with examples
* Installation and deployment guides
* Troubleshooting and how-to guides
* Architecture and contributing documentation

For detailed information about features and usage, see the `full documentation <https://borgitory.readthedocs.io/>`_.

For the latest changes and development updates, visit the `GitHub repository <https://github.com/mlapaglia/Borgitory>`_.
