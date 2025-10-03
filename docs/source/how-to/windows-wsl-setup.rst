.. meta::
   :description lang=en:
      Complete guide for setting up Borgitory on Windows using WSL2 (Windows Subsystem for Linux).
      Step-by-step instructions from WSL installation to running Borgitory with full functionality.

Windows WSL Setup Guide
========================

This guide provides step-by-step instructions for setting up Borgitory on a fresh Windows installation using WSL2 (Windows Subsystem for Linux).

Prerequisites
-------------

- Windows 10 version 2004 and higher (Build 19041 and higher) or Windows 11
- Administrator access to your Windows machine
- Internet connection

Step 1: Enable WSL2
--------------------
Refer to the Microsoft documentation for more details: https://learn.microsoft.com/en-us/windows/wsl/install

.. code-block:: powershell

    # Enable WSL feature
    wsl --install

Step 2: Install Ubuntu Linux Distribution
------------------------------------------

Install Ubuntu
~~~~~~~~~~~~~~

.. code-block:: powershell

   # List available distributions
   wsl --list --online

   # Install Ubuntu (replace with your preferred version)
   wsl --install -d Ubuntu-22.04

Initial Ubuntu Setup
~~~~~~~~~~~~~~~~~~~~~

1. Launch Ubuntu from Start Menu
2. Create a new user account when prompted
3. Set a password for your user account

Step 3: Update Ubuntu and Install Dependencies
-----------------------------------------------

Update Package Lists
~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   sudo apt update && sudo apt upgrade -y

Install Python 3.11+
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Install Python 3.11 and pip
   sudo apt install software-properties-common -y
   sudo add-apt-repository ppa:deadsnakes/ppa -y
   sudo apt update
   sudo apt install python3.11 python3.11-pip python3.11-venv -y

   # Set Python 3.11 as default (optional)
   sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

Install BorgBackup
~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Install BorgBackup
   sudo apt install borgbackup -y

   # Verify installation
   borg --version

Install Rclone (Optional - for cloud sync)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Download and install rclone
   curl https://rclone.org/install.sh | sudo bash

   # Verify installation
   rclone version

Install FUSE Support (Optional - for archive browsing)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Install FUSE3 development libraries
   sudo apt install fuse3 libfuse3-dev -y

   # Install Python FUSE bindings
   python3.11 -m pip install pyfuse3

Step 4: Install Borgitory
--------------------------

Install Borgitory via pip
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Install Borgitory
   python3.11 -m pip install borgitory

   # Verify installation
   borgitory --help

Create Directory Structure
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Create directories for Borgitory data
   mkdir -p ~/borgitory/{data,repos,sources}

   # Set appropriate permissions
   chmod 755 ~/borgitory/{data,repos,sources}

Step 5: Configure Windows-WSL Integration
------------------------------------------

Access Windows Files from WSL
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Windows drives are automatically mounted under ``/mnt/``:

- C: drive → ``/mnt/c/``
- D: drive → ``/mnt/d/``

Create Symbolic Links for Easy Access
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Link to common Windows directories
   ln -s /mnt/c/Users/$USER/Documents ~/Documents-Windows
   ln -s /mnt/c/Users/$USER/Desktop ~/Desktop-Windows

   # Example: Link backup sources
   ln -s /mnt/c/Users/$USER/Documents ~/borgitory/sources/documents

Step 6: Start Borgitory
------------------------

Run Borgitory Server
~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Start Borgitory with default settings
   borgitory serve

   # Or with custom host/port
   borgitory serve --host 0.0.0.0 --port 8000

Access Web Interface
~~~~~~~~~~~~~~~~~~~~~

1. Open your web browser
2. Navigate to ``http://localhost:8000``
3. Create your first admin account on initial setup

Step 7: Optional Configurations
--------------------------------

Create Windows Shortcut
~~~~~~~~~~~~~~~~~~~~~~~~

Create a batch file to easily start Borgitory:

1. Create ``start-borgitory.bat`` on your Windows desktop:

.. code-block:: batch

   @echo off
   wsl -d Ubuntu-22.04 -e bash -c "cd ~ && borgitory serve --host 0.0.0.0 --port 8000"

2. Double-click the batch file to start Borgitory

Auto-start WSL on Windows Boot (Optional)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "When the computer starts"
4. Set action to start program: ``wsl.exe``
5. Add arguments: ``-d Ubuntu-22.04``

Troubleshooting
---------------

Common Issues
~~~~~~~~~~~~~

1. **WSL2 not starting**: Ensure virtualization is enabled in BIOS
2. **Permission denied errors**: Check file permissions and ownership
3. **Network issues**: WSL2 uses NAT networking by default
4. **FUSE mount failures**: Ensure FUSE is properly installed and user has permissions

Useful Commands
~~~~~~~~~~~~~~~

.. code-block:: bash

   # Check WSL version
   wsl --list --verbose

   # Restart WSL
   wsl --shutdown
   wsl

   # Check if services are running
   systemctl status fuse3  # if using systemd

Getting Help
~~~~~~~~~~~~

- `WSL Documentation <https://docs.microsoft.com/en-us/windows/wsl/>`_
- `BorgBackup Documentation <https://borgbackup.readthedocs.io/>`_
- `Rclone Documentation <https://rclone.org/docs/>`_
- :doc:`../troubleshooting` - Borgitory troubleshooting guide

Security Considerations
-----------------------

1. **File Permissions**: Be careful with file permissions between Windows and WSL
2. **Network Access**: Consider firewall rules if accessing from other machines
3. **Backup Encryption**: Always use encrypted BorgBackup repositories
4. **WSL Security**: Keep WSL and Ubuntu updated regularly

.. note::

   This setup allows you to run Borgitory on Windows by leveraging WSL2 for Linux compatibility. 
   All backup operations will run within the WSL2 environment while providing a web interface 
   accessible from Windows.

.. tip::

   For production use, consider the :doc:`docker-deployment-guide` which provides better 
   isolation and easier management, even on Windows systems with WSL2.
