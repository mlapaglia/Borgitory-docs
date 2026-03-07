Adding New Cloud Providers
==========================

This document outlines the steps required to add support for a new cloud provider to the Borgitory cloud sync system.

Overview
--------

The cloud sync system is designed with a modular architecture that makes adding new providers straightforward. Each provider consists of:

- **Storage Configuration Schema**: Defines and validates provider-specific settings
- **Storage Implementation**: Handles the actual upload/download operations via rclone
- **Frontend Templates**: Provides the user interface for configuration
- **Provider Registration**: Connects the provider to the main system via a decorator

Borgitory uses `rclone <https://rclone.org/>`_ for syncing. Borgitory can theoretically support any destination that rclone does.

Architecture
------------

Each storage provider implements its own rclone integration directly. There is no centralized ``RcloneService`` -- each storage class contains its own ``sync_repository_to_{provider}()`` and ``test_{provider}_connection()`` methods that build and execute rclone commands via the injected ``CommandExecutorProtocol``.

The ``CloudStorage`` base class in ``src/borgitory/services/cloud_providers/storage/base.py`` provides:

- Abstract methods that every provider must implement (``upload_repository``, ``test_connection``, ``get_connection_info``, ``get_sensitive_fields``, ``get_display_details``)
- ``_merge_async_generators()``: Concurrently merges stdout/stderr async generators using ``asyncio.Queue`` (avoids deadlocks from sequential reads)
- ``parse_rclone_progress()``: Parses rclone progress output lines into structured data

These shared methods are inherited by all providers -- do not duplicate them.

Registry Pattern
----------------

Borgitory uses a **registry pattern** for cloud providers, which means:

- **No hardcoded provider lists**: Providers are automatically discovered
- **Dynamic registration**: Use the ``@register_provider`` decorator to register your provider
- **Automatic integration**: Once registered, your provider appears in APIs, validation, and frontend dropdowns
- **Metadata support**: Include provider capabilities like versioning support, encryption, etc.

This eliminates the need to manually update multiple files when adding a provider.

Step-by-Step Implementation Guide
---------------------------------

Step 1: Create the Storage Module
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Create a new file: ``src/borgitory/services/cloud_providers/storage/{provider_name}_storage.py``

This file contains three things: the config class, the storage class, and the provider registration.

**Configuration class** -- extends ``CloudStorageConfig`` with provider-specific fields and validators:

.. code-block:: python
   :force:

   import asyncio
   from typing import AsyncGenerator, Callable, Dict, List, Optional, cast
   from pydantic import Field, field_validator

   from borgitory.protocols.command_executor_protocol import CommandExecutorProtocol
   from borgitory.protocols.file_protocols import FileServiceProtocol
   from borgitory.services.rclone_types import ConnectionTestResult, ProgressData

   from .base import CloudStorage, CloudStorageConfig
   from ..types import SyncEvent, SyncEventType, ConnectionInfo
   from ..registry import register_provider, RcloneMethodMapping


   class {ProviderName}StorageConfig(CloudStorageConfig):
       """Configuration for {Provider Name} storage"""

       # Define your provider-specific fields here
       endpoint_url: str = Field(..., min_length=1, description="Provider endpoint URL")
       api_key: str = Field(..., min_length=1, description="API key for authentication")
       bucket_name: str = Field(..., min_length=1, max_length=255, description="Bucket/container name")
       region: Optional[str] = Field(default=None, description="Region (if applicable)")

       @field_validator("endpoint_url")
       @classmethod
       def validate_endpoint_url(cls, v: str) -> str:
           if not v.startswith(("http://", "https://")):
               raise ValueError("Endpoint URL must start with http:// or https://")
           return v

       @field_validator("api_key")
       @classmethod
       def validate_api_key(cls, v: str) -> str:
           if len(v) < 10:
               raise ValueError("API key must be at least 10 characters long")
           return v

**Storage class** -- implements all abstract methods from ``CloudStorage`` and contains the rclone integration:

.. code-block:: python
   :force:

   class {ProviderName}Storage(CloudStorage):
       """
       {Provider Name} cloud storage implementation.
       """

       def __init__(
           self,
           config: {ProviderName}StorageConfig,
           command_executor: CommandExecutorProtocol,
           file_service: FileServiceProtocol,
       ) -> None:
           self._config = config
           self._command_executor = command_executor
           self._file_service = file_service

       def _build_{provider_name}_flags(self) -> List[str]:
           """Build provider-specific rclone flags."""
           return [
               "--{provider_name}-endpoint", self._config.endpoint_url,
               "--{provider_name}-api-key", self._config.api_key,
           ]

       async def upload_repository(
           self,
           repository_path: str,
           remote_path: str,
           progress_callback: Optional[Callable[[SyncEvent], None]] = None,
       ) -> None:
           if progress_callback:
               progress_callback(
                   SyncEvent(
                       type=SyncEventType.STARTED,
                       message=f"Starting {Provider Name} upload to {self._config.bucket_name}",
                   )
               )

           try:
               async for progress in self.sync_repository_to_{provider_name}(
                   repository_path=repository_path,
                   path_prefix=remote_path,
               ):
                   if not progress_callback:
                       continue

                   progress_type = progress.get("type")
                   if progress_type == "progress":
                       progress_callback(
                           SyncEvent(
                               type=SyncEventType.PROGRESS,
                               message=str(progress.get("message", "Uploading...")),
                               progress=float(progress.get("percentage", 0.0) or 0.0),
                           )
                       )
                   elif progress_type == "log":
                       progress_callback(
                           SyncEvent(
                               type=SyncEventType.LOG,
                               message=str(progress.get("message", "")),
                           )
                       )
                   elif progress_type == "error":
                       error_msg = str(progress.get("message", "Unknown error"))
                       progress_callback(
                           SyncEvent(
                               type=SyncEventType.ERROR,
                               message=error_msg,
                               error=error_msg,
                           )
                       )
                       raise Exception(error_msg)
                   elif progress_type == "completed":
                       if progress.get("status") != "success":
                           error_msg = f"{Provider Name} sync failed with return code {progress.get('return_code')}"
                           progress_callback(
                               SyncEvent(
                                   type=SyncEventType.ERROR,
                                   message=error_msg,
                                   error=error_msg,
                               )
                           )
                           raise Exception(error_msg)

               if progress_callback:
                   progress_callback(
                       SyncEvent(
                           type=SyncEventType.COMPLETED,
                           message="{Provider Name} upload completed successfully",
                       )
                   )

           except Exception as e:
               error_msg = f"{Provider Name} upload failed: {str(e)}"
               if progress_callback:
                   progress_callback(
                       SyncEvent(type=SyncEventType.ERROR, message=error_msg, error=str(e))
                   )
               raise Exception(error_msg) from e

       async def test_connection(self) -> bool:
           try:
               result = await self.test_{provider_name}_connection()
               return result.get("status") == "success"
           except Exception:
               return False

       def get_connection_info(self) -> ConnectionInfo:
           return ConnectionInfo(
               provider="{provider_name}",
               details={
                   "endpoint": self._config.endpoint_url,
                   "bucket": self._config.bucket_name,
                   "region": self._config.region or "default",
                   "api_key": "***",
               },
           )

       def get_sensitive_fields(self) -> list[str]:
           return ["api_key"]

       def get_display_details(self, config_dict: Dict[str, object]) -> Dict[str, object]:
           endpoint = config_dict.get("endpoint_url", "Unknown")
           bucket = config_dict.get("bucket_name", "Unknown")
           region = config_dict.get("region", "default")

           provider_details = f"""
               <div><strong>Endpoint:</strong> {endpoint}</div>
               <div><strong>Bucket:</strong> {bucket}</div>
               <div><strong>Region:</strong> {region}</div>
           """.strip()

           return {
               "provider_name": "{Provider Display Name}",
               "provider_details": provider_details,
           }

       @classmethod
       def get_rclone_mapping(cls) -> RcloneMethodMapping:
           return RcloneMethodMapping(
               sync_method="sync_repository_to_{provider_name}",
               test_method="test_{provider_name}_connection",
               parameter_mapping={
                   "api_key": "api_key",
                   "bucket_name": "bucket_name",
                   "region": "region",
                   "endpoint_url": "endpoint_url",
               },
               required_params=["repository", "api_key", "bucket_name"],
               optional_params={"region": None, "path_prefix": ""},
           )

       async def sync_repository_to_{provider_name}(
           self,
           repository_path: str,
           path_prefix: str = "",
       ) -> AsyncGenerator[ProgressData, None]:
           remote_path = f":{provider_name}:{self._config.bucket_name}"
           if path_prefix:
               remote_path = f"{remote_path}/{path_prefix}"

           command = [
               "rclone", "sync",
               repository_path, remote_path,
               "--progress", "--stats", "1s", "--verbose",
           ]
           command.extend(self._build_{provider_name}_flags())

           try:
               process = await self._command_executor.create_subprocess(
                   command=command,
                   stdout=asyncio.subprocess.PIPE,
                   stderr=asyncio.subprocess.PIPE,
               )

               # Mask sensitive flags before yielding started event
               safe_parts = []
               skip_next = False
               sensitive_prefixes = ("--{provider_name}-api-key",)
               for part in command:
                   if skip_next:
                       safe_parts.append("***")
                       skip_next = False
                   elif part in sensitive_prefixes:
                       safe_parts.append(part)
                       skip_next = True
                   else:
                       safe_parts.append(part)

               yield cast(
                   ProgressData,
                   {"type": "started", "command": " ".join(safe_parts), "pid": process.pid},
               )

               async def read_stream(
                   stream: Optional[asyncio.StreamReader], stream_type: str
               ) -> AsyncGenerator[ProgressData, None]:
                   if stream is None:
                       return
                   while True:
                       line = await stream.readline()
                       if not line:
                           break
                       decoded_line = line.decode("utf-8").strip()
                       progress_data = self.parse_rclone_progress(decoded_line)
                       if progress_data:
                           yield cast(ProgressData, {"type": "progress", **progress_data})
                       else:
                           yield cast(
                               ProgressData,
                               {"type": "log", "stream": stream_type, "message": decoded_line},
                           )

               # _merge_async_generators is inherited from CloudStorage base class
               async for item in self._merge_async_generators(
                   read_stream(process.stdout, "stdout"),
                   read_stream(process.stderr, "stderr"),
               ):
                   yield item

               return_code = await process.wait()
               yield cast(
                   ProgressData,
                   {
                       "type": "completed",
                       "return_code": return_code,
                       "status": "success" if return_code == 0 else "failed",
                   },
               )

           except Exception as e:
               yield cast(ProgressData, {"type": "error", "message": str(e)})

       async def test_{provider_name}_connection(self) -> ConnectionTestResult:
           command = [
               "rclone", "lsd",
               f":{provider_name}:{self._config.bucket_name}",
               "--max-depth", "1", "--verbose",
           ]
           command.extend(self._build_{provider_name}_flags())

           try:
               result = await self._command_executor.execute_command(
                   command=command, timeout=30.0,
               )
               if result.success:
                   return {"status": "success", "message": "Connection successful", "output": result.stdout}
               return {"status": "failed", "message": result.stderr or "Connection failed"}
           except Exception as e:
               return {"status": "error", "message": str(e)}

**Provider registration** -- at the bottom of the same file, add the ``@register_provider`` decorator:

.. code-block:: python
   :force:

   @register_provider(
       name="{provider_name}",
       label="{Provider Display Name}",
       description="{Provider description}",
       supports_encryption=True,
       supports_versioning=False,
       requires_credentials=True,
   )
   class {ProviderName}Provider:
       """{Provider Name} provider registration"""
       config_class = {ProviderName}StorageConfig
       storage_class = {ProviderName}Storage

Step 2: Update the Storage Module Exports
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Edit ``src/borgitory/services/cloud_providers/storage/__init__.py``:

.. code-block:: python

   from .{provider_name}_storage import (
       {ProviderName}Storage,
       {ProviderName}StorageConfig,
       {ProviderName}Provider,
   )  # Import provider to trigger registration

   __all__ = [
       # ... existing exports ...
       "{ProviderName}Storage",
       "{ProviderName}StorageConfig",
       "{ProviderName}Provider",
   ]

Step 3: Register Sensitive Fields
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Add your provider's sensitive fields to the static mapping in ``src/borgitory/services/cloud_providers/cloud_sync_service.py``:

.. code-block:: python

   # In StorageFactory.get_sensitive_fields(), add to the mapping dict:
   mapping = {
       "s3": ["access_key", "secret_key"],
       "sftp": ["password", "private_key"],
       "smb": ["pass"],
       "pcloud": ["token"],
       "{provider_name}": ["api_key"],  # <-- add your provider
   }

This mapping is used when decrypting configs from the database. It must match what your storage class returns from ``get_sensitive_fields()``.

Step 4: Create Frontend Template
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Create ``src/borgitory/templates/partials/cloud_sync/providers/{provider_name}/{provider_name}_fields.html``:

Templates must support both **create** and **edit** mode. Use ``{% if config %}`` to populate fields from existing config during edits. For sensitive fields, show a "leave empty to keep current" hint in edit mode.

.. code-block:: html
   :force:

   <!-- {Provider Name} Fields -->
   <div id="{provider_name}-fields" class="space-y-4">
       <div>
           <label class="block text-sm font-medium text-gray-900 dark:text-gray-100">
               Endpoint URL
           </label>
           <input type="text"
                  name="provider_config[endpoint_url]"
                  {% if config %}value="{{ config.endpoint_url or '' }}"{% endif %}
                  placeholder="https://api.provider.com"
                  class="input-modern mt-1">
       </div>
       <div>
           <label class="block text-sm font-medium text-gray-900 dark:text-gray-100">
               API Key
           </label>
           <input type="password"
                  name="provider_config[api_key]"
                  {% if config %}placeholder="Current value will be used if left empty"{% endif %}
                  class="input-modern mt-1">
       </div>
       <div>
           <label class="block text-sm font-medium text-gray-900 dark:text-gray-100">
               Bucket Name
           </label>
           <input type="text"
                  name="provider_config[bucket_name]"
                  {% if config %}value="{{ config.bucket_name or '' }}"{% endif %}
                  placeholder="my-backup-bucket"
                  class="input-modern mt-1">
       </div>
       <div>
           <label class="block text-sm font-medium text-gray-900 dark:text-gray-100">
               Region (optional)
           </label>
           <input type="text"
                  name="provider_config[region]"
                  {% if config %}value="{{ config.region or '' }}"{% endif %}
                  placeholder="us-east-1"
                  class="input-modern mt-1">
       </div>
       <div>
           <label class="block text-sm font-medium text-gray-900 dark:text-gray-100">
               Path Prefix (optional)
           </label>
           <input type="text"
                  name="path_prefix"
                  {% if config %}value="{{ config.path_prefix or '' }}"{% endif %}
                  placeholder="backups/borgitory"
                  class="input-modern mt-1">
       </div>
   </div>

Step 5: Template Integration (Automatic)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

With the current implementation, templates are automatically discovered by checking if the template file exists on the filesystem. You don't need to manually update any API context variables.

The system will automatically:

- Check if the template file exists
- Include it in the provider fields if found
- Generate submit button text from registry metadata
- Handle provider validation through the registry

Simply create your template file and it will be automatically integrated.

Step 6: Create Tests
~~~~~~~~~~~~~~~~~~~~

Create ``tests/cloud_providers/test_{provider_name}_storage.py``:

Note: The project uses ``asyncio_mode = "auto"`` so you do not need ``@pytest.mark.asyncio`` on test methods.

.. code-block:: python

   import importlib

   import pytest
   from unittest.mock import AsyncMock

   from borgitory.protocols.file_protocols import FileServiceProtocol
   from borgitory.services.cloud_providers.storage.{provider_name}_storage import (
       {ProviderName}StorageConfig,
       {ProviderName}Storage,
   )
   from borgitory.services.cloud_providers.types import SyncEvent
   from borgitory.services.cloud_providers.registry import (
       clear_registry,
       get_supported_providers,
       get_provider_info,
   )


   class Test{ProviderName}StorageConfig:
       """Test {Provider Name} storage configuration validation"""

       def test_valid_config(self) -> None:
           config = {ProviderName}StorageConfig(
               endpoint_url="https://api.provider.com",
               api_key="valid-api-key-12345",
               bucket_name="test-bucket",
               region="us-east-1",
           )
           assert config.endpoint_url == "https://api.provider.com"
           assert config.bucket_name == "test-bucket"

       def test_invalid_endpoint_url(self) -> None:
           with pytest.raises(ValueError, match="Endpoint URL must start with"):
               {ProviderName}StorageConfig(
                   endpoint_url="invalid-url",
                   api_key="valid-api-key-12345",
                   bucket_name="test-bucket",
               )

       def test_invalid_api_key(self) -> None:
           with pytest.raises(ValueError, match="API key must be at least"):
               {ProviderName}StorageConfig(
                   endpoint_url="https://api.provider.com",
                   api_key="short",
                   bucket_name="test-bucket",
               )


   class Test{ProviderName}Storage:
       """Test {Provider Name} storage implementation"""

       @pytest.fixture
       def mock_command_executor(self) -> AsyncMock:
           return AsyncMock()

       @pytest.fixture
       def mock_file_service(self) -> AsyncMock:
           return AsyncMock(spec=FileServiceProtocol)

       @pytest.fixture
       def storage_config(self) -> {ProviderName}StorageConfig:
           return {ProviderName}StorageConfig(
               endpoint_url="https://api.provider.com",
               api_key="valid-api-key-12345",
               bucket_name="test-bucket",
               region="us-east-1",
           )

       @pytest.fixture
       def storage(
           self,
           storage_config: {ProviderName}StorageConfig,
           mock_command_executor: AsyncMock,
           mock_file_service: AsyncMock,
       ) -> {ProviderName}Storage:
           return {ProviderName}Storage(
               storage_config, mock_command_executor, mock_file_service
           )

       async def test_test_connection_success(
           self, storage: {ProviderName}Storage, mock_command_executor: AsyncMock
       ) -> None:
           mock_result = AsyncMock()
           mock_result.success = True
           mock_result.stdout = "test output"
           mock_result.stderr = ""
           mock_command_executor.execute_command.return_value = mock_result

           result = await storage.test_connection()
           assert result is True

       async def test_test_connection_failure(
           self, storage: {ProviderName}Storage, mock_command_executor: AsyncMock
       ) -> None:
           mock_command_executor.execute_command.side_effect = Exception(
               "Connection failed"
           )
           result = await storage.test_connection()
           assert result is False

       def test_get_sensitive_fields(self, storage: {ProviderName}Storage) -> None:
           sensitive_fields = storage.get_sensitive_fields()
           assert "api_key" in sensitive_fields

       def test_get_connection_info(self, storage: {ProviderName}Storage) -> None:
           info = storage.get_connection_info()
           assert info.provider == "{provider_name}"
           assert info.details["api_key"] == "***"


   class Test{ProviderName}Registry:
       """Test {Provider Name} provider registration"""

       @pytest.fixture(autouse=True)
       def fresh_registry(self) -> None:
           clear_registry()
           import borgitory.services.cloud_providers.storage.{provider_name}_storage

           importlib.reload(
               borgitory.services.cloud_providers.storage.{provider_name}_storage
           )

       def test_provider_in_supported_providers(self) -> None:
           providers = get_supported_providers()
           assert "{provider_name}" in providers

       def test_provider_info(self) -> None:
           info = get_provider_info("{provider_name}")
           assert info is not None
           assert info.name == "{provider_name}"

Important Implementation Notes
------------------------------

Credential Masking
~~~~~~~~~~~~~~~~~~

Never leak sensitive credentials in ``get_connection_info()``. Fully mask secrets with ``"***"`` rather than showing partial values like first/last N characters. For structured tokens (like OAuth JSON blobs), parse the structure and only expose non-sensitive metadata:

.. code-block:: python

   # Bad -- leaks partial credentials
   "api_key": f"{self._config.api_key[:4]}***{self._config.api_key[-4:]}"

   # Good -- fully masked
   "api_key": "***"

   # Good -- for structured tokens, show only non-sensitive fields
   token_data = json.loads(self._config.token)
   masked = {
       "token_type": token_data.get("token_type", "unknown"),
       "access_token": "***",
   }

Similarly, when yielding the ``started`` event in your sync method, mask credential values in the command string before yielding.

Error Event Handling
~~~~~~~~~~~~~~~~~~~~

The ``upload_repository()`` method must handle **all** progress event types from the sync generator:

- ``progress``: Forward percentage/message to the callback
- ``log``: Forward log messages to the callback
- ``error``: Emit an ERROR SyncEvent **and raise** an exception
- ``completed``: Check the ``status`` field -- if not ``"success"``, emit ERROR and raise

If you only check ``completed`` and ``log``, an ``error`` event from the sync generator will be silently ignored and the upload will be treated as successful.

Shared Base Class Methods
~~~~~~~~~~~~~~~~~~~~~~~~~

The ``CloudStorage`` base class provides ``_merge_async_generators()`` and ``parse_rclone_progress()`` as concrete methods. Do **not** re-implement these in your provider. They are inherited automatically.

``_merge_async_generators()`` uses ``asyncio.Queue`` with concurrent tasks to truly interleave stdout and stderr output. A sequential implementation (draining one stream then the other) risks deadlocks when a subprocess pipe buffer fills while the other stream is being read.

Registry Test Isolation
~~~~~~~~~~~~~~~~~~~~~~~

Other test modules may call ``clear_registry()`` which removes all registered providers. If your registry tests just import the provider module, Python's import cache means the ``@register_provider`` decorator won't re-execute. Always use a fixture that calls ``clear_registry()`` followed by ``importlib.reload()`` on your storage module:

.. code-block:: python

   @pytest.fixture(autouse=True)
   def fresh_registry(self) -> None:
       clear_registry()
       import borgitory.services.cloud_providers.storage.{provider_name}_storage
       importlib.reload(borgitory.services.cloud_providers.storage.{provider_name}_storage)

Also add your provider to the ``clean_registry`` fixture in ``tests/cloud_providers/test_provider_validation.py`` so it's reloaded after registry clears in that file.

What's Simplified by the Registry Pattern
-----------------------------------------

Thanks to the registry pattern, many things are automated:

- **Provider Discovery**: Automatic detection via ``@register_provider`` decorator
- **API Integration**: Providers appear in ``/api/cloud-sync/providers`` automatically
- **Template Discovery**: Automatic filesystem-based template detection
- **Submit Button Text**: Generated from registry metadata
- **Configuration Validation**: Uses registered config classes
- **Sensitive Field Detection**: Uses storage class methods

**Note**: Some manual steps are still required when adding new providers:

- Create template files manually
- Add the sensitive fields mapping in ``cloud_sync_service.py``
- Update this documentation with provider-specific details

Enhanced Rclone Integration Pattern
-----------------------------------

RcloneMethodMapping
~~~~~~~~~~~~~~~~~~~

Each provider can define how its configuration maps to rclone method parameters:

.. code-block:: python

   from borgitory.services.cloud_providers.registry import RcloneMethodMapping

   mapping = RcloneMethodMapping(
       sync_method="sync_repository_to_s3",
       test_method="test_s3_connection",
       parameter_mapping={
           "access_key": "access_key_id",
           "secret_key": "secret_access_key",
           "bucket_name": "bucket_name",
           "region": "region",
       },
       required_params=["repository", "access_key_id", "secret_access_key", "bucket_name"],
       optional_params={"region": "us-east-1", "path_prefix": ""},
   )

Two Ways to Define Rclone Mapping
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Option 1: In Registration Decorator**

.. code-block:: python

   @register_provider(
       name="myprovider",
       label="My Provider",
       rclone_mapping=mapping,
   )
   class MyProvider:
       config_class = MyProviderConfig
       storage_class = MyProviderStorage

**Option 2: Auto-Discovery from Storage Class** (preferred)

.. code-block:: python

   class MyProviderStorage(CloudStorage):
       @classmethod
       def get_rclone_mapping(cls) -> RcloneMethodMapping:
           return RcloneMethodMapping(
               sync_method="sync_repository_to_myprovider",
               test_method="test_myprovider_connection",
               parameter_mapping={"field": "param"},
               required_params=["repository", "param"],
           )

   @register_provider(name="myprovider", label="My Provider")
   class MyProvider:
       config_class = MyProviderConfig
       storage_class = MyProviderStorage

Checklist
---------

When adding a new provider, verify:

1. ``src/borgitory/services/cloud_providers/storage/{provider_name}_storage.py`` created with config, storage, and registration classes
2. ``src/borgitory/services/cloud_providers/storage/__init__.py`` updated with imports and ``__all__`` entries
3. Sensitive fields mapping added to ``src/borgitory/services/cloud_providers/cloud_sync_service.py``
4. Template created at ``src/borgitory/templates/partials/cloud_sync/providers/{provider_name}/{provider_name}_fields.html``
5. Template supports both create and edit mode (``{% if config %}`` bindings)
6. Tests created at ``tests/cloud_providers/test_{provider_name}_storage.py``
7. Registry tests use ``clear_registry()`` + ``importlib.reload()`` fixture
8. Provider added to ``clean_registry`` fixture in ``tests/cloud_providers/test_provider_validation.py``
9. ``get_connection_info()`` fully masks all credentials
10. Sync method masks sensitive flags in the started event command string
11. ``upload_repository()`` handles all event types: ``progress``, ``log``, ``error``, ``completed``

Provider-Specific Considerations
--------------------------------

For Object Storage Providers (S3-like)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Follow S3 patterns for bucket naming, regions, storage classes
- Consider implementing storage class options if supported
- Add endpoint URL validation for custom S3-compatible services

For File Transfer Providers (SFTP-like)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Focus on connection authentication (keys, passwords, certificates)
- Validate host/port combinations
- Consider connection timeout and retry logic

For API-based Providers
~~~~~~~~~~~~~~~~~~~~~~~

- Implement proper API key/token validation and formatting
- Add rate limiting considerations
- Handle API versioning if applicable

Current Providers
-----------------

======== ============================ =============================================
Provider Registration Name             Key Config Fields
======== ============================ =============================================
S3       ``s3``                       ``access_key``, ``secret_key``, ``bucket_name``, ``region``, ``endpoint_url``, ``storage_class``, ``provider_type``
SFTP     ``sftp``                     ``host``, ``username``, ``port``, ``password``, ``private_key``, ``remote_path``
SMB      ``smb``                      ``host``, ``user``, ``pass``, ``port``, ``domain``, ``share_name``
pCloud   ``pcloud``                   ``token`` (OAuth JSON), ``hostname``, ``root_folder_id``
======== ============================ =============================================
