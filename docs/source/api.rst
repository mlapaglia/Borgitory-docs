.. meta::
   :description lang=en:
      Complete REST API reference for Borgitory including authentication, repository management,
      backup operations, scheduling, and cloud sync endpoints with examples.

API Reference
=============

Borgitory provides a comprehensive REST API for all functionality, allowing you to integrate backup operations into your own scripts and applications.

Interactive Documentation
-------------------------

The API includes automatically generated interactive documentation:

* **Swagger UI**: Available at ``http://localhost:8000/docs``
* **ReDoc**: Available at ``http://localhost:8000/redoc``

These interfaces allow you to explore endpoints, view request/response schemas, and test API calls directly from your browser.

Authentication
--------------

Currently, the API uses session-based authentication through the web interface. API key authentication is planned for future releases.

**Session Authentication:**

1. Log in through the web interface at ``http://localhost:8000``
2. Use the same browser session to make API calls
3. Include cookies in your requests for authentication

Base URL
--------

All API endpoints are prefixed with the base URL of your Borgitory instance:

.. code-block:: text

   http://localhost:8000/api/

API Endpoints Overview
----------------------

Repository Management
~~~~~~~~~~~~~~~~~~~~~

**List Repositories**

.. code-block:: http

   GET /api/repositories

Returns a list of all configured repositories.

**Create Repository**

.. code-block:: http

   POST /api/repositories
   Content-Type: application/json

   {
     "name": "My Backup Repo",
     "path": "/mnt/repos/my-backup-repo",
     "passphrase": "secure-passphrase"
   }

**Get Repository Details**

.. code-block:: http

   GET /api/repositories/{repository_id}

**Update Repository**

.. code-block:: http

   PUT /api/repositories/{repository_id}
   Content-Type: application/json

   {
     "name": "Updated Repo Name",
     "path": "/mnt/repos/updated-path"
   }

**Delete Repository**

.. code-block:: http

   DELETE /api/repositories/{repository_id}

**Test Repository Connection**

.. code-block:: http

   POST /api/repositories/{repository_id}/test

Backup Operations
~~~~~~~~~~~~~~~~~

**Create Manual Backup**

.. code-block:: http

   POST /api/backups/manual
   Content-Type: application/json

   {
     "repository_id": 1,
     "source_path": "/mnt/backup/sources/documents",
     "archive_name": "documents-{now:%Y%m%d-%H%M%S}",
     "compression": "lz4",
     "exclude_patterns": ["*.tmp", "*.log"]
   }

**List Archives**

.. code-block:: http

   GET /api/repositories/{repository_id}/archives

**Get Archive Details**

.. code-block:: http

   GET /api/repositories/{repository_id}/archives/{archive_name}

**Delete Archive**

.. code-block:: http

   DELETE /api/repositories/{repository_id}/archives/{archive_name}

**Browse Archive Contents**

.. code-block:: http

   GET /api/repositories/{repository_id}/archives/{archive_name}/browse?path=/optional/subpath

**Download File from Archive**

.. code-block:: http

   GET /api/repositories/{repository_id}/archives/{archive_name}/download?path=/path/to/file

Schedule Management
~~~~~~~~~~~~~~~~~~~

**List Schedules**

.. code-block:: http

   GET /api/schedules

**Create Schedule**

.. code-block:: http

   POST /api/schedules
   Content-Type: application/json

   {
     "name": "Daily Documents Backup",
     "repository_id": 1,
     "source_path": "/mnt/backup/sources/documents",
     "cron_expression": "0 2 * * *",
     "enabled": true,
     "compression": "lz4",
     "pruning_policy_id": 1,
     "cloud_sync_config_id": 1
   }

**Update Schedule**

.. code-block:: http

   PUT /api/schedules/{schedule_id}

**Delete Schedule**

.. code-block:: http

   DELETE /api/schedules/{schedule_id}

**Enable/Disable Schedule**

.. code-block:: http

   POST /api/schedules/{schedule_id}/toggle

Job Management
~~~~~~~~~~~~~~

**List Jobs**

.. code-block:: http

   GET /api/jobs?status=running&limit=50&offset=0

**Get Job Details**

.. code-block:: http

   GET /api/jobs/{job_id}

**Cancel Job**

.. code-block:: http

   POST /api/jobs/{job_id}/cancel

**Retry Failed Job**

.. code-block:: http

   POST /api/jobs/{job_id}/retry

**Get Job Logs**

.. code-block:: http

   GET /api/jobs/{job_id}/logs

**Stream Job Progress**

.. code-block:: http

   GET /api/jobs/{job_id}/stream

Returns Server-Sent Events for real-time job progress updates.

Cloud Sync
~~~~~~~~~~

**List Cloud Configurations**

.. code-block:: http

   GET /api/cloud-sync/configs

**Create Cloud Configuration**

.. code-block:: http

   POST /api/cloud-sync/configs
   Content-Type: application/json

   {
     "name": "My S3 Backup",
     "provider": "s3",
     "provider_config": {
       "access_key_id": "AKIAIOSFODNN7EXAMPLE",
       "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
       "bucket_name": "my-backup-bucket",
       "region": "us-east-1"
     },
     "path_prefix": "borgitory-backups/"
   }

**Test Cloud Connection**

.. code-block:: http

   POST /api/cloud-sync/configs/{config_id}/test

**Manual Cloud Sync**

.. code-block:: http

   POST /api/cloud-sync/sync
   Content-Type: application/json

   {
     "repository_id": 1,
     "cloud_sync_config_id": 1
   }

**List Supported Providers**

.. code-block:: http

   GET /api/cloud-sync/providers

Response Formats
----------------

Standard Response Structure
~~~~~~~~~~~~~~~~~~~~~~~~~~~

All API responses follow a consistent structure:

**Success Response:**

.. code-block:: json

   {
     "status": "success",
     "data": {
       // Response data here
     },
     "message": "Operation completed successfully"
   }

**Error Response:**

.. code-block:: json

   {
     "status": "error",
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid input data",
       "details": {
         "field": ["Field is required"]
       }
     }
   }

HTTP Status Codes
~~~~~~~~~~~~~~~~~

* **200 OK**: Successful GET, PUT requests
* **201 Created**: Successful POST requests that create resources
* **204 No Content**: Successful DELETE requests
* **400 Bad Request**: Invalid request data or parameters
* **401 Unauthorized**: Authentication required
* **403 Forbidden**: Insufficient permissions
* **404 Not Found**: Resource not found
* **409 Conflict**: Resource already exists or conflict with current state
* **422 Unprocessable Entity**: Validation errors
* **500 Internal Server Error**: Server-side errors

Example Usage
-------------

Python Example
~~~~~~~~~~~~~~

.. code-block:: python

   import requests
   import json

   # Base configuration
   BASE_URL = "http://localhost:8000/api"
   session = requests.Session()

   # Login first (through web interface)
   # Then use the same session for API calls

   def create_repository():
       """Create a new repository"""
       data = {
           "name": "Documents Backup",
           "path": "/mnt/repos/documents",
           "passphrase": "secure-passphrase-123"
       }
       
       response = session.post(f"{BASE_URL}/repositories", json=data)
       if response.status_code == 201:
           repo = response.json()["data"]
           print(f"Created repository: {repo['name']} (ID: {repo['id']})")
           return repo
       else:
           print(f"Error: {response.json()}")

   def start_backup(repository_id):
       """Start a manual backup"""
       data = {
           "repository_id": repository_id,
           "source_path": "/mnt/backup/sources/documents",
           "archive_name": "docs-{now:%Y%m%d-%H%M%S}",
           "compression": "lz4"
       }
       
       response = session.post(f"{BASE_URL}/backups/manual", json=data)
       if response.status_code == 201:
           job = response.json()["data"]
           print(f"Started backup job: {job['id']}")
           return job
       else:
           print(f"Error: {response.json()}")

   # Usage
   repo = create_repository()
   if repo:
       job = start_backup(repo["id"])

JavaScript Example
~~~~~~~~~~~~~~~~~~

.. code-block:: javascript

   // API client class
   class BorgitoryAPI {
     constructor(baseUrl = 'http://localhost:8000/api') {
       this.baseUrl = baseUrl;
     }

     async request(method, endpoint, data = null) {
       const config = {
         method,
         credentials: 'include', // Include cookies for session auth
         headers: {
           'Content-Type': 'application/json',
         },
       };

       if (data) {
         config.body = JSON.stringify(data);
       }

       const response = await fetch(`${this.baseUrl}${endpoint}`, config);
       const result = await response.json();

       if (!response.ok) {
         throw new Error(result.error?.message || 'API request failed');
       }

       return result.data;
     }

     // Repository methods
     async getRepositories() {
       return this.request('GET', '/repositories');
     }

     async createRepository(name, path, passphrase) {
       return this.request('POST', '/repositories', {
         name, path, passphrase
       });
     }

     // Backup methods
     async startManualBackup(repositoryId, sourcePath, archiveName, compression = 'lz4') {
       return this.request('POST', '/backups/manual', {
         repository_id: repositoryId,
         source_path: sourcePath,
         archive_name: archiveName,
         compression
       });
     }
   }

   // Usage example
   const api = new BorgitoryAPI();

   async function example() {
     try {
       // Create repository
       const repo = await api.createRepository(
         'My Documents',
         '/mnt/repos/documents',
         'secure-passphrase'
       );
       console.log('Created repository:', repo);

       // Start backup
       const job = await api.startManualBackup(
         repo.id,
         '/mnt/backup/sources/documents',
         'docs-{now:%Y%m%d-%H%M%S}'
       );
       console.log('Started backup:', job);

     } catch (error) {
       console.error('API error:', error);
     }
   }

Future API Enhancements
-----------------------

Planned improvements for future releases:

* **API Key Authentication**: Dedicated API keys for programmatic access
* **Webhooks**: HTTP callbacks for job completion and events
* **GraphQL Endpoint**: More flexible query capabilities
* **Bulk Operations**: Batch create/update/delete operations
* **Advanced Filtering**: More sophisticated query parameters
* **API Versioning**: Versioned endpoints for backward compatibility

For the most up-to-date API documentation and testing interface, always refer to the interactive documentation at ``/docs`` and ``/redoc`` endpoints of your running Borgitory instance.