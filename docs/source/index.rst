.. meta::
   :description lang=en:
      Borgitory is a comprehensive web-based management interface for BorgBackup repositories 
      with real-time monitoring, automated scheduling, and cloud synchronization capabilities.

Welcome to Borgitory's Documentation!
======================================

.. raw:: html

   <a href="https://github.com/mlapaglia/Borgitory/actions/workflows/release.yml">
      <img src="https://img.shields.io/github/actions/workflow/status/mlapaglia/borgitory/build.yml?logo=github" alt="Build Status">
   </a>

.. raw:: html

   <a href="https://hub.docker.com/r/mlapaglia/borgitory">
      <img src="https://img.shields.io/docker/pulls/mlapaglia/borgitory?logo=docker&label=pulls" alt="Docker Pulls">
   </a>

.. raw:: html

   <a href="https://pypi.org/project/borgitory/">
      <img src="https://img.shields.io/pypi/dm/borgitory?style=flat&logo=pypi&logoColor=%23ffd343&label=downloads&labelColor=%23ffd343" alt="PyPI Downloads">
   </a>

.. raw:: html

   <a href="https://borgbackup.readthedocs.io/">
      <img src="https://img.shields.io/badge/dynamic/regex?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmlapaglia%2FBorgitory%2Frefs%2Fheads%2Fmain%2FDockerfile&search=ARG%20BORGBACKUP_VERSION%3D(.%2B)&replace=%241&logo=borgbackup&label=BorgBackup" alt="BorgBackup Version">
   </a>

.. raw:: html

   <a href="https://rclone.org/">
      <img src="https://img.shields.io/badge/dynamic/regex?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmlapaglia%2FBorgitory%2Frefs%2Fheads%2Fmain%2FDockerfile&search=ARG%20RCLONE_VERSION%3D(.%2B)&replace=%241&logo=rclone&label=Rclone" alt="Rclone Version">
   </a>

.. raw:: html

   <a href="https://github.com/libfuse/libfuse">
      <img src="https://img.shields.io/badge/dynamic/regex?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmlapaglia%2FBorgitory%2Frefs%2Fheads%2Fmain%2FDockerfile&search=ARG%20FUSE3_VERSION%3D(.%2B)&replace=%241&logo=python&label=pfuse3" alt="FUSE3 Version">
   </a>

**Borgitory** is a comprehensive web-based management interface for `BorgBackup <https://borgbackup.readthedocs.io/>`_ repositories 
with real-time monitoring, automated scheduling, and cloud synchronization capabilities.

Built with modern web technologies, Borgitory provides an intuitive interface for managing your backup infrastructure,
whether you're running a single repository or managing multiple backup destinations across different storage providers.

Key Features
------------

* **Repository Management**: Add, configure, and manage multiple Borg repositories
* **Real-time Monitoring**: Live backup progress with detailed task tracking
* **Automated Scheduling**: Cron-based backup scheduling with integrated cleanup
* **Archive Browser**: Interactive exploration of backup archives with FUSE mounting
* **Cloud Synchronization**: Multi-provider cloud sync using Rclone
* **Push Notifications**: Pushover integration for job completion alerts
* **Modern UI**: Responsive interface built with HTMX, Alpine.js, and Tailwind CSS

Quick Start with Docker
-----------------------

The easiest way to get started with Borgitory is using Docker:

.. code-block:: bash

   # Pull the latest image
   docker pull mlapaglia/borgitory:latest

   # Run Borgitory
   docker run -d \
     --name borgitory \
     -p 8000:8000 \
     -v /path/to/your/repos:/repos \
     -v borgitory-data:/app/data \
     mlapaglia/borgitory:latest

   # Access at http://localhost:8000

For production deployments and advanced configuration, see the :doc:`installation` guide.

.. note::

   Borgitory requires BorgBackup to be available. The Docker image includes BorgBackup and Rclone pre-installed.

Quick Links
-----------

* :doc:`installation` - Docker deployment and alternative installation methods
* :doc:`features` - Comprehensive feature overview  
* :doc:`usage` - Step-by-step usage guide
* :doc:`how-to/index` - Task-specific guides and recipes
* :doc:`api` - REST API documentation

Getting Help
------------

* `GitHub Issues <https://github.com/mlapaglia/Borgitory/issues>`_ - Report bugs or request features
* `GitHub Discussions <https://github.com/mlapaglia/Borgitory/discussions>`_ - Community support and questions
* :doc:`troubleshooting` - Common issues and solutions

Contents
--------

.. toctree::
   :maxdepth: 2
   :caption: User Guide

   installation
   features
   usage
   how-to/index
   troubleshooting

.. toctree::
   :maxdepth: 2
   :caption: Advanced Topics

   cloud-providers
   api
   architecture

.. toctree::
   :maxdepth: 1
   :caption: About

   changelog
   contributing
   license
