Exclude Patterns Guide
======================

.. note::

   This guide has been superseded by the comprehensive :doc:`backup-patterns` guide, 
   which covers all pattern types including include and exclude patterns with detailed 
   examples and best practices.

This guide explains how to use exclude patterns effectively to optimize your backups and avoid backing up unnecessary files.

Quick Start
-----------

For complete pattern documentation, see :doc:`backup-patterns`. This page provides a quick reference for common exclude patterns.

Common Exclude Patterns
-----------------------

System and Cache Files
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: text

   - **/.cache/**               # All cache directories
   - **/node_modules/**         # Node.js dependencies
   - **/__pycache__/**          # Python cache
   - **/.git/**                 # Git repositories
   - **/Thumbs.db               # Windows thumbnails
   - **/.DS_Store               # macOS metadata

Temporary Files
~~~~~~~~~~~~~~~

.. code-block:: text

   - **/*.tmp                   # Temporary files
   - **/*.temp                  # Temporary files
   - **/*~                      # Backup files
   - **/*.swp                   # Vim swap files
   - **/*.log                   # Log files

Media and Downloads
~~~~~~~~~~~~~~~~~~~

.. code-block:: text

   - **/Downloads/**            # Download directories
   - **/*.iso                   # ISO images
   - **/*.dmg                   # macOS disk images
   - **/Trash/**                # Trash directories

For complete pattern syntax, advanced techniques, and detailed examples, 
see the :doc:`backup-patterns` guide.
