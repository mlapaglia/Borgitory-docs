Installation Guide
==================

Borgitory can be installed in multiple ways depending on your preferences and environment. 
This guide covers all installation methods and their requirements.

Prerequisites
-------------

Before installing Borgitory, ensure you have the following prerequisites:

System Requirements
~~~~~~~~~~~~~~~~~~~

* **Operating System**: Linux, macOS, or Windows
* **Python**: 3.11 or higher (for PyPI installation)
* **Docker**: Docker with Docker Compose (for containerized deployment)

Required Dependencies
~~~~~~~~~~~~~~~~~~~~~

* **BorgBackup**: Must be installed and available in your system PATH
* **Rclone**: Optional, required for cloud synchronization features

Installation Methods
--------------------

Method 1: PyPI Installation (Recommended)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The simplest way to install Borgitory is via PyPI:

.. code-block:: bash

   # Install stable release from PyPI
   pip install borgitory

   # Start the server
   borgitory serve

   # Or run with custom settings
   borgitory serve --host 0.0.0.0 --port 8000

**PyPI Installation Requirements:**

* Python 3.11 or higher
* BorgBackup installed and available in PATH
* Rclone (optional, for cloud sync features)

**Pre-release Testing:**

Pre-release versions are available on TestPyPI for testing:

.. code-block:: bash

   # Install pre-release from TestPyPI
   pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ borgitory

Method 2: Docker Installation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Docker provides an isolated environment with all dependencies pre-configured.

Using Docker Directly
^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: bash

   # Pull and run the Docker image
   docker run -d \
     -p 8000:8000 \
     -v ./data:/app/data \
     -v /path/to/backup/sources:/mnt/backup/sources:ro \
     -v /path/to/borg/repos:/mnt/repos \
     --cap-add SYS_ADMIN \
     --device /dev/fuse \
     --name borgitory \
     mlapaglia/borgitory:latest

Using Docker Compose (Recommended)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Create a ``docker-compose.yml`` file:

.. code-block:: yaml

   version: '3.8'
   services:
     borgitory:
       image: mlapaglia/borgitory:latest
       ports:
         - "8000:8000"
       volumes:
         - ./data:/app/data
         - /path/to/backup/sources:/mnt/backup/sources:ro
         - /path/to/borg/repos:/mnt/repos
       cap_add:
         - SYS_ADMIN
       devices:
         - /dev/fuse
       restart: unless-stopped

Then start the container:

.. code-block:: bash

   docker-compose up -d

Method 3: Development Installation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For development or contributing to Borgitory:

.. code-block:: bash

   # Clone the repository
   git clone https://github.com/mlapaglia/Borgitory.git
   cd Borgitory

   # Create virtual environment
   python -m venv .env_borg
   
   # Activate virtual environment
   # On Windows:
   .env_borg\Scripts\activate
   # On macOS/Linux:
   source .env_borg/bin/activate

   # Install in development mode
   pip install -e .[dev]

   # Run development server
   python run.py

Docker Configuration
--------------------

Volume Mapping Strategy
~~~~~~~~~~~~~~~~~~~~~~~

All volumes must be mounted under ``/mnt/`` to be visible in the application:

.. code-block:: yaml

   volumes:
     - ./data:/app/data                              # Persistent application data (required)
     - /path/to/backup/sources:/mnt/backup/sources:ro # Source directories (read-only)
     - /path/to/borg/repos:/mnt/repos                # Repository storage (read-write)
     - /additional/source:/mnt/additional:ro         # Additional sources as needed
     - /another/repo/location:/mnt/alt-repos         # Additional repositories as needed

**Volume Guidelines:**

* Mount as many volumes as necessary for all backup sources and repository locations
* Source directories can be mounted read-only (``:ro``) for safety
* Repository directories need read-write access for Borg operations
* Each volume can be mapped to any convenient path under ``/mnt/`` inside the container
* Supports distributed setups where repositories and sources are in different locations

Required Docker Parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~

For full functionality, the following Docker parameters are required:

``--cap-add SYS_ADMIN``
   Required for FUSE filesystem mounting to enable the archive browser feature

``--device /dev/fuse``
   Provides access to the FUSE device for archive filesystem mounting

**FUSE Requirements:**

* Enables the interactive archive browser feature
* Allows real-time exploration of backup archives without extraction
* Supports direct file downloads from mounted archive filesystems
* Without FUSE support, archive browsing will be disabled

Installing Dependencies
-----------------------

BorgBackup Installation
~~~~~~~~~~~~~~~~~~~~~~~

**Ubuntu/Debian:**

.. code-block:: bash

   sudo apt update
   sudo apt install borgbackup

**CentOS/RHEL/Fedora:**

.. code-block:: bash

   sudo dnf install borgbackup

**macOS:**

.. code-block:: bash

   brew install borgbackup

**Windows:**

Download from the `BorgBackup releases page <https://github.com/borgbackup/borg/releases>`_

Rclone Installation (Optional)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For cloud synchronization features:

**Linux:**

.. code-block:: bash

   curl https://rclone.org/install.sh | sudo bash

**macOS:**

.. code-block:: bash

   brew install rclone

**Windows:**

Download from the `Rclone downloads page <https://rclone.org/downloads/>`_

First-Time Setup
----------------

After installation, access the web interface:

1. Open http://localhost:8000 in your browser
2. Create your first admin account on the initial setup page
3. Configure your first repository in the dashboard

The application will create a local SQLite database and generate encryption keys automatically.

Configuration Options
---------------------

Environment Variables
~~~~~~~~~~~~~~~~~~~~~

Borgitory can be configured using environment variables:

``BORGITORY_HOST``
   Server host address (default: ``0.0.0.0``)

``BORGITORY_PORT``
   Server port (default: ``8000``)

``BORGITORY_DATA_DIR``
   Data directory path (default: ``./data``)

``BORGITORY_DEBUG``
   Enable debug mode (default: ``false``)

Command Line Options
~~~~~~~~~~~~~~~~~~~~

When using the PyPI installation:

.. code-block:: bash

   borgitory serve --help

   Options:
     --host TEXT      Host to bind to [default: 0.0.0.0]
     --port INTEGER   Port to bind to [default: 8000]
     --reload         Enable auto-reload for development
     --log-level TEXT Log level [default: info]
     --help           Show this message and exit

Verification
------------

To verify your installation is working correctly:

1. **Check the web interface**: Navigate to http://localhost:8000
2. **Verify BorgBackup**: The dashboard will show if BorgBackup is available
3. **Test repository creation**: Try adding a test repository
4. **Check logs**: Monitor the application logs for any errors

**Docker verification:**

.. code-block:: bash

   # Check container status
   docker-compose ps

   # View logs
   docker-compose logs -f borgitory

**PyPI verification:**

.. code-block:: bash

   # Check if borgitory command is available
   borgitory --help

   # Verify BorgBackup is available
   borg --version

Troubleshooting Installation
----------------------------

Common Issues
~~~~~~~~~~~~~

**Python Version Issues**
   Ensure you're using Python 3.11 or higher:

   .. code-block:: bash

      python --version

**BorgBackup Not Found**
   Verify BorgBackup is installed and in PATH:

   .. code-block:: bash

      borg --version
      which borg

**Docker Permission Issues**
   Ensure your user has permission to run Docker commands:

   .. code-block:: bash

      sudo usermod -aG docker $USER
      # Log out and back in

**FUSE Mount Issues**
   On some systems, you may need to install FUSE utilities:

   .. code-block:: bash

      # Ubuntu/Debian
      sudo apt install fuse3

      # CentOS/RHEL/Fedora
      sudo dnf install fuse3

For more troubleshooting information, see the :doc:`troubleshooting` guide.

Next Steps
----------

After successful installation:

1. Read the :doc:`features` overview to understand Borgitory's capabilities
2. Follow the :doc:`usage` guide for step-by-step instructions
3. Explore :doc:`how-to/index` guides for specific tasks
4. Configure :doc:`cloud-providers` for cloud synchronization
