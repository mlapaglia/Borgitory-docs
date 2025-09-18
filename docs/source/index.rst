Welcome to Borgitory's Documentation!
======================================

.. image:: https://img.shields.io/github/actions/workflow/status/mlapaglia/borgitory/build.yml?logo=github
   :target: https://github.com/mlapaglia/Borgitory/actions/workflows/release.yml
   :alt: Build Status

.. image:: https://img.shields.io/docker/pulls/mlapaglia/borgitory?logo=docker&label=pulls
   :target: https://hub.docker.com/r/mlapaglia/borgitory
   :alt: Docker Pulls

.. image:: https://img.shields.io/pypi/dm/borgitory?style=flat&logo=pypi&logoColor=%23ffd343&label=downloads&labelColor=%23ffd343
   :target: https://pypi.org/project/borgitory/
   :alt: PyPI Downloads

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

.. note::

   Borgitory requires BorgBackup to be installed and available in your system PATH. 
   For cloud synchronization features, Rclone is also required.

Quick Links
-----------

* :doc:`installation` - Get started with Docker or PyPI installation
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
   development

.. toctree::
   :maxdepth: 1
   :caption: About

   changelog
   contributing
   license
