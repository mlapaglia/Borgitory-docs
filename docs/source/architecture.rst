Architecture Overview
=====================

This document provides a technical overview of Borgitory's architecture, design principles, and implementation details.

System Architecture
-------------------

High-Level Overview
~~~~~~~~~~~~~~~~~~~

Borgitory follows a modern web application architecture with clear separation of concerns:

.. code-block:: text

   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │   Web Browser   │    │  Mobile Device  │    │   API Client    │
   │                 │    │                 │    │                 │
   │ HTMX + Alpine   │    │ Responsive UI   │    │ REST API        │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
                        ┌─────────────────┐
                        │   FastAPI       │
                        │   Web Server    │
                        │                 │
                        │ • Authentication│
                        │ • API Routes    │
                        │ • Templates     │
                        └─────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │   SQLite DB     │    │   Job Scheduler │    │  Service Layer  │
   │                 │    │                 │    │                 │
   │ • Configuration │    │ • APScheduler   │    │ • Borg Service  │
   │ • Job History   │    │ • Cron Jobs     │    │ • Cloud Sync    │
   │ • User Data     │    │ • Task Queue    │    │ • Notifications │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
                                    │
                        ┌─────────────────┐
                        │  External Tools │
                        │                 │
                        │ • BorgBackup    │
                        │ • Rclone        │
                        │ • FUSE          │
                        └─────────────────┘

Backend Architecture
--------------------

FastAPI Application
~~~~~~~~~~~~~~~~~~~

**Core Components:**

* **Main Application** (``src/borgitory/main.py``)
  
  - FastAPI application instance
  - Middleware configuration
  - Static file serving
  - Template engine setup

* **API Routes** (``src/borgitory/api/``)
  
  - RESTful API endpoints
  - Request/response handling
  - Input validation
  - Error handling

* **Dependencies** (``src/borgitory/dependencies.py``)
  
  - Dependency injection container
  - Service initialization
  - Database session management
  - Authentication dependencies

Service Layer Architecture
~~~~~~~~~~~~~~~~~~~~~~~~~~

**Service Pattern Implementation:**

.. code-block:: python

   # Service interfaces define contracts
   class BackupService:
       async def create_backup(self, config: BackupConfig) -> Job
       async def get_backup_status(self, job_id: str) -> JobStatus
   
   # Concrete implementations handle business logic
   class BorgBackupService(BackupService):
       def __init__(self, borg_service: BorgService):
           self._borg_service = borg_service
   
   # Dependency injection wires everything together
   @lru_cache()
   def get_backup_service() -> BackupService:
       return BorgBackupService(get_borg_service())

**Key Services:**

* **BorgService** - BorgBackup command execution and management
* **CloudSyncService** - Multi-provider cloud synchronization
* **JobService** - Background job management and monitoring
* **SchedulerService** - Cron-based task scheduling
* **NotificationService** - Push notification handling
* **RecoveryService** - Archive browsing and file recovery

Database Layer
--------------

SQLAlchemy ORM
~~~~~~~~~~~~~~

**Model Architecture:**

.. code-block:: python

   # Base model with common fields
   class BaseModel:
       id: int
       created_at: datetime
       updated_at: datetime
   
   # Domain models
   class Repository(BaseModel):
       name: str
       path: str
       encrypted_passphrase: str
   
   class Schedule(BaseModel):
       name: str
       repository_id: int
       cron_expression: str
       enabled: bool
   
   class Job(BaseModel):
       type: JobType
       status: JobStatus
       repository_id: int
       started_at: datetime
       completed_at: datetime

**Database Features:**

* **SQLite** for lightweight deployment
* **Alembic** for schema migrations
* **Connection pooling** for performance
* **Async support** throughout the stack
* **Encrypted sensitive data** storage

Frontend Architecture
---------------------

Modern Web Stack
~~~~~~~~~~~~~~~~

**Technology Choices:**

* **HTMX** - Dynamic HTML updates without JavaScript frameworks
* **Alpine.js** - Lightweight JavaScript reactivity
* **Tailwind CSS** - Utility-first styling with responsive design
* **Jinja2** - Server-side template rendering

**Why This Stack:**

1. **Simplicity** - Minimal JavaScript complexity
2. **Performance** - Fast page loads and updates
3. **SEO-Friendly** - Server-side rendered content
4. **Progressive Enhancement** - Works without JavaScript
5. **Developer Experience** - Familiar template-based approach

Template Architecture
~~~~~~~~~~~~~~~~~~~~~

**Template Hierarchy:**

.. code-block:: text

   templates/
   ├── base.html                    # Base layout
   ├── components/                  # Reusable components
   │   ├── navigation.html
   │   ├── job_progress.html
   │   └── repository_card.html
   ├── pages/                       # Full page templates
   │   ├── dashboard.html
   │   ├── repositories.html
   │   └── schedules.html
   └── partials/                    # HTMX partial updates
       ├── job_list.html
       ├── backup_form.html
       └── cloud_sync/
           ├── provider_form.html
           └── providers/
               ├── s3_fields.html
               └── azure_fields.html

**Template Features:**

* **Component-based design** for reusability
* **Partial updates** via HTMX for dynamic behavior
* **Responsive design** with mobile-first approach
* **Dark/light theme** support
* **Accessibility** features built-in

Job Management System
---------------------

Background Job Processing
~~~~~~~~~~~~~~~~~~~~~~~~~

**Job Architecture:**

.. code-block:: python

   class Job:
       id: str
       type: JobType  # BACKUP, PRUNE, CLOUD_SYNC
       status: JobStatus  # PENDING, RUNNING, COMPLETED, FAILED
       repository_id: int
       configuration: dict
       progress: JobProgress
       tasks: List[Task]
   
   class Task:
       id: str
       job_id: str
       name: str
       status: TaskStatus
       output: str
       started_at: datetime
       completed_at: datetime

**Job Lifecycle:**

1. **Creation** - Job created with PENDING status
2. **Queuing** - Added to scheduler queue
3. **Execution** - Status changes to RUNNING
4. **Progress Updates** - Real-time progress via SSE
5. **Task Management** - Individual tasks tracked
6. **Completion** - Final status (COMPLETED/FAILED)
7. **Cleanup** - Temporary resources cleaned up

**Scheduling Integration:**

.. code-block:: python

   from apscheduler.schedulers.asyncio import AsyncIOScheduler
   
   class SchedulerService:
       def __init__(self):
           self.scheduler = AsyncIOScheduler()
       
       async def add_schedule(self, schedule: Schedule):
           self.scheduler.add_job(
               func=self.execute_backup,
               trigger='cron',
               **parse_cron_expression(schedule.cron_expression),
               id=f"schedule_{schedule.id}",
               args=[schedule.id]
           )

JobManager Dependency Injection Pattern
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Overview**

The JobManager uses a **dual-function dependency injection pattern** to handle both FastAPI request-scoped dependencies and application-scoped singleton access. This pattern is essential for managing long-running background tasks while maintaining proper dependency injection principles.

**The Pattern**

.. code-block:: python

   @lru_cache()
   def get_job_manager_singleton() -> "JobManagerProtocol":
       """
       Create JobManager singleton for application-scoped use.
       
       ✅ Use for: Singletons, direct instantiation, tests, background tasks
       ❌ Don't use for: FastAPI endpoints (use get_job_manager_dependency instead)
       """
       # Resolve all dependencies directly (not via FastAPI DI)
       # ... dependency resolution ...
       return JobManager(config=config, dependencies=dependencies)

   def get_job_manager_dependency(
       # All FastAPI dependencies listed here for injection
       config: JobManagerConfig = Depends(_create_job_manager_config),
       job_executor: JobExecutor = Depends(get_job_executor),
       # ... other dependencies ...
   ) -> "JobManagerProtocol":
       """
       Provide JobManager with FastAPI dependency injection.
       
       ✅ Use for: FastAPI endpoints with Depends(get_job_manager_dependency)
       ❌ Don't use for: Direct calls, background tasks, tests
       """
       # Both functions return the same singleton instance
       return get_job_manager_singleton()

**Why This Pattern is Necessary**

*The Problem: FastAPI + Long-Running Tasks*

FastAPI's dependency injection system is designed for **request-scoped** operations. However, job management requires:

1. **State Persistence** - Jobs must persist across multiple HTTP requests
2. **Background Processing** - Tasks run independently of HTTP request lifecycle
3. **Singleton Behavior** - All parts of the application must see the same job state

*The Challenge*

.. code-block:: python

   # ❌ BROKEN: This creates a new JobManager for each request
   @router.post("/jobs/backup")
   async def create_backup(job_manager: JobManager = Depends(get_job_manager)):
       job_id = job_manager.start_backup()  # Job stored in instance A
       return {"job_id": job_id}

   @router.get("/jobs/{job_id}")
   async def get_job(job_id: str, job_manager: JobManager = Depends(get_job_manager)):
       return job_manager.get_job(job_id)  # Looking in instance B - job not found!

*The Solution: Dual Functions*

The dual-function pattern ensures:

* **Same Instance** - Both functions return the identical singleton
* **Proper DI** - FastAPI endpoints get dependency injection
* **Direct Access** - Background tasks get direct singleton access

**Usage Examples**

*FastAPI Endpoint Usage*

.. code-block:: python

   from borgitory.dependencies import RequestScopedJobManager

   @router.post("/jobs/backup")
   async def create_backup(
       request: BackupRequest,
       job_manager: RequestScopedJobManager,  # Uses Depends() internally
   ) -> dict:
       """Create a backup job via FastAPI endpoint."""
       job_id = await job_manager.start_backup_job(
           repository_id=request.repository_id,
           source_path=request.source_path
       )
       return {"job_id": job_id, "status": "started"}

   @router.get("/jobs/{job_id}")
   async def get_job_status(
       job_id: str,
       job_manager: RequestScopedJobManager,
   ) -> dict:
       """Get job status via FastAPI endpoint."""
       job = job_manager.get_job(job_id)
       if not job:
           raise HTTPException(status_code=404, detail="Job not found")
       
       return {
           "job_id": job_id,
           "status": job.status,
           "progress": job.progress
       }

*Background Task Usage*

.. code-block:: python

   import asyncio
   from borgitory.dependencies import get_job_manager_singleton

   async def cleanup_completed_jobs():
       """Background task to clean up old completed jobs."""
       # Direct singleton access - no FastAPI DI needed
       job_manager = get_job_manager_singleton()
       
       completed_jobs = job_manager.get_completed_jobs(older_than_days=7)
       for job in completed_jobs:
           await job_manager.cleanup_job(job.id)
           print(f"Cleaned up job {job.id}")

   async def job_monitor_daemon():
       """Long-running daemon to monitor job health."""
       job_manager = get_job_manager_singleton()
       
       while True:
           # Check for stuck jobs
           stuck_jobs = job_manager.get_stuck_jobs()
           for job in stuck_jobs:
               await job_manager.restart_job(job.id)
           
           await asyncio.sleep(60)  # Check every minute

   # Start background tasks
   asyncio.create_task(cleanup_completed_jobs())
   asyncio.create_task(job_monitor_daemon())

*Testing Usage*

.. code-block:: python

   import pytest
   from borgitory.dependencies import get_job_manager_singleton

   def test_job_creation():
       """Test job creation with direct singleton access."""
       job_manager = get_job_manager_singleton()
       
       job_id = job_manager.create_job("backup", {"source": "/data"})
       assert job_id is not None
       
       job = job_manager.get_job(job_id)
       assert job.status == "pending"

   @pytest.fixture
   def job_manager():
       """Fixture providing JobManager for tests."""
       return get_job_manager_singleton()

   def test_job_lifecycle(job_manager):
       """Test complete job lifecycle."""
       job_id = job_manager.start_backup_job("/data", "/backup")
       
       # Job should be running
       job = job_manager.get_job(job_id)
       assert job.status in ["pending", "running"]
       
       # Simulate completion
       job_manager.complete_job(job_id)
       job = job_manager.get_job(job_id)
       assert job.status == "completed"

**Type Aliases for Clarity**

.. code-block:: python

   # Semantic type aliases make usage intent crystal clear
   ApplicationScopedJobManager = "JobManagerProtocol"  # Direct singleton access
   RequestScopedJobManager = Annotated[
       "JobManagerProtocol", 
       Depends(get_job_manager_dependency)
   ]  # FastAPI DI

   # Usage examples:
   def background_task():
       manager: ApplicationScopedJobManager = get_job_manager_singleton()

   async def api_endpoint(manager: RequestScopedJobManager):
       # FastAPI automatically injects the singleton
       pass

**Key Benefits**

1. **State Consistency**

   .. code-block:: python

      # Same job visible across all contexts
      job_id = create_backup_via_api()  # FastAPI endpoint
      status = check_job_in_background(job_id)  # Background task
      assert status is not None  # ✅ Works!

2. **Proper Dependency Injection**

   .. code-block:: python

      # FastAPI endpoints get full DI benefits
      async def endpoint(
          job_manager: RequestScopedJobManager,  # Injected
          db: Session = Depends(get_db),         # Injected
          user: User = Depends(get_current_user) # Injected
      ):
          # All dependencies properly resolved

3. **Performance Optimization**

   .. code-block:: python

      # Singleton pattern avoids expensive re-initialization
      @lru_cache()  # Cached after first call
      def get_job_manager_singleton():
          # Heavy initialization only happens once
          return JobManager(expensive_setup=True)

4. **Testing Flexibility**

   .. code-block:: python

      # Easy to mock in tests
      def test_with_mock():
          with patch('borgitory.dependencies.get_job_manager_singleton') as mock:
              mock.return_value = MockJobManager()
              # Test uses mock instead of real singleton

**Anti-Patterns to Avoid**

*Don't Mix the Functions*

.. code-block:: python

   # WRONG: Using dependency function directly
   def background_task():
       # This will fail - Depends objects can't be called directly
       manager = get_job_manager_dependency()  # ❌ RuntimeError

*Don't Create Multiple Instances*

.. code-block:: python

   # WRONG: Creating JobManager directly
   def some_function():
       manager = JobManager()  # ❌ Creates separate instance
       # This instance won't see jobs from other parts of the app

*Don't Use Global Variables*

.. code-block:: python

   # WRONG: Module-level global
   _job_manager = None

   def get_job_manager():
       global _job_manager
       if not _job_manager:
           _job_manager = JobManager()  # ❌ Anti-pattern
       return _job_manager

**Implementation Details**

*Dependency Resolution*

The singleton function resolves all dependencies directly:

.. code-block:: python

   @lru_cache()
   def get_job_manager_singleton():
       # Direct dependency resolution (not via FastAPI)
       config = _create_job_manager_config()
       job_executor = get_job_executor()
       output_manager = get_job_output_manager()
       # ... resolve all dependencies ...
       
       return JobManager(config=config, dependencies=dependencies)

*Runtime Safety*

The dependency function includes runtime checks:

.. code-block:: python

   def get_job_manager_dependency(...):
       # Prevent misuse
       if hasattr(job_executor, "dependency"):
           raise RuntimeError(
               "get_job_manager_dependency() was called directly with Depends objects. "
               "Use get_job_manager_singleton() for direct calls instead."
           )
       
       return get_job_manager_singleton()

**Pattern Summary**

This dual-function pattern solves the fundamental challenge of using FastAPI's request-scoped dependency injection with application-scoped services that manage long-running tasks. It provides:

* **Consistency** - Same instance across all contexts
* **Proper DI** - Full FastAPI dependency injection support
* **Flexibility** - Works in endpoints, background tasks, and tests
* **Performance** - Singleton pattern with caching
* **Safety** - Runtime checks prevent misuse

The pattern is essential for any FastAPI application that needs to manage stateful, long-running operations while maintaining clean dependency injection architecture.

Real-Time Updates
~~~~~~~~~~~~~~~~~

**Server-Sent Events (SSE):**

.. code-block:: python

   from sse_starlette import EventSourceResponse
   
   async def stream_job_progress(job_id: str):
       async def event_generator():
           while True:
               job = await get_job(job_id)
               if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                   break
               
               yield {
                   "event": "progress",
                   "data": json.dumps({
                       "job_id": job.id,
                       "status": job.status,
                       "progress": job.progress.percentage,
                       "current_task": job.current_task
                   })
               }
               
               await asyncio.sleep(1)
       
       return EventSourceResponse(event_generator())

Cloud Provider System
---------------------

Registry Pattern
~~~~~~~~~~~~~~~~

**Dynamic Provider Registration:**

.. code-block:: python

   # Provider registry for dynamic discovery
   PROVIDER_REGISTRY = {}
   
   def register_provider(name: str, label: str, **metadata):
       def decorator(cls):
           PROVIDER_REGISTRY[name] = {
               'class': cls,
               'label': label,
               'metadata': metadata
           }
           return cls
       return decorator
   
   @register_provider(
       name="s3",
       label="Amazon S3",
       supports_encryption=True,
       supports_versioning=True
   )
   class S3Provider:
       config_class = S3StorageConfig
       storage_class = S3Storage

**Provider Interface:**

.. code-block:: python

   class CloudStorage(ABC):
       @abstractmethod
       async def upload_repository(
           self, 
           repository_path: str, 
           remote_path: str,
           progress_callback: Optional[Callable] = None
       ) -> None:
           pass
       
       @abstractmethod
       async def test_connection(self) -> bool:
           pass
       
       @abstractmethod
       def get_sensitive_fields(self) -> List[str]:
           pass

**Benefits of Registry Pattern:**

* **No hardcoded provider lists** - Automatic discovery
* **Dynamic integration** - Providers auto-appear in UI
* **Extensibility** - Easy to add new providers
* **Type safety** - Compile-time validation
* **Metadata-driven** - UI behavior based on capabilities

Security Architecture
---------------------

Authentication & Authorization
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Current Implementation:**

* **Session-based authentication** with secure cookies
* **BCrypt password hashing** with salt
* **CSRF protection** on all forms
* **Input validation** and sanitization
* **SQL injection prevention** via ORM

**Security Features:**

.. code-block:: python

   # Password hashing
   from passlib.context import CryptContext
   pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
   
   # Credential encryption
   from cryptography.fernet import Fernet
   cipher_suite = Fernet(secret_key)
   encrypted_password = cipher_suite.encrypt(password.encode())
   
   # Session security
   app.add_middleware(SessionMiddleware, secret_key=secret_key)

**Planned Security Enhancements:**

* **Multi-user support** with role-based access control
* **API key authentication** for programmatic access
* **OAuth integration** for external authentication
* **Audit logging** for security events
* **Rate limiting** and abuse prevention

Data Protection
~~~~~~~~~~~~~~~

**Sensitive Data Handling:**

* **Repository passphrases** encrypted with Fernet
* **Cloud provider credentials** encrypted at rest
* **API keys** masked in UI and logs
* **Database encryption** for sensitive fields
* **Secure key management** with rotation support

**Backup Security:**

* **End-to-end encryption** via BorgBackup
* **Client-side encryption** before cloud upload
* **Key derivation** from user passphrases
* **No plaintext secrets** in configuration files

Performance Considerations
--------------------------

Scalability Design
~~~~~~~~~~~~~~~~~~

**Current Optimizations:**

* **Async/await** throughout the application
* **Connection pooling** for database access
* **Background job processing** for long-running tasks
* **Streaming responses** for large file downloads
* **Efficient FUSE mounting** for archive browsing

**Performance Monitoring:**

.. code-block:: python

   # Request timing middleware
   @app.middleware("http")
   async def add_process_time_header(request: Request, call_next):
       start_time = time.time()
       response = await call_next(request)
       process_time = time.time() - start_time
       response.headers["X-Process-Time"] = str(process_time)
       return response

**Scaling Strategies:**

* **Horizontal scaling** with multiple instances
* **Load balancing** for high availability
* **Database sharding** for large deployments
* **CDN integration** for static assets
* **Caching layers** for frequently accessed data

Monitoring & Observability
~~~~~~~~~~~~~~~~~~~~~~~~~~

**Built-in Monitoring:**

* **Health checks** for service availability
* **Job execution metrics** and history
* **Error tracking** and reporting
* **Performance profiling** for optimization
* **Resource usage monitoring**

**Logging Architecture:**

.. code-block:: python

   import structlog
   
   logger = structlog.get_logger()
   
   # Structured logging with context
   logger.info(
       "backup_started",
       repository_id=repo.id,
       archive_name=archive_name,
       source_path=source_path
   )

Deployment Architecture
-----------------------

Container Strategy
~~~~~~~~~~~~~~~~~~

**Docker Benefits:**

* **Isolated environment** with all dependencies
* **Consistent deployment** across environments
* **Easy updates** and rollbacks
* **Resource management** and limits
* **Security isolation** from host system

**Container Architecture:**

.. code-block:: dockerfile

   FROM python:3.11-slim
   
   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       borgbackup \
       rclone \
       fuse3 \
       && rm -rf /var/lib/apt/lists/*
   
   # Copy application
   COPY . /app
   WORKDIR /app
   
   # Install Python dependencies
   RUN pip install -e .
   
   # Configure runtime
   EXPOSE 8000
   CMD ["borgitory", "serve"]

**Volume Strategy:**

* **Application data** - Persistent SQLite database and configuration
* **Repository storage** - Borg repository locations
* **Backup sources** - Read-only access to source directories
* **Temporary storage** - Scratch space for operations

Development Workflow
--------------------

Code Organization
~~~~~~~~~~~~~~~~~

**Project Structure:**

.. code-block:: text

   src/borgitory/
   ├── __init__.py
   ├── main.py                      # FastAPI application
   ├── cli.py                       # Command-line interface
   ├── config.py                    # Configuration management
   ├── dependencies.py              # Dependency injection
   ├── api/                         # API route modules
   │   ├── repositories.py
   │   ├── jobs.py
   │   └── cloud_sync.py
   ├── models/                      # SQLAlchemy models
   │   ├── database.py
   │   ├── repository.py
   │   └── job.py
   ├── services/                    # Business logic services
   │   ├── borg_service.py
   │   ├── cloud_sync_service.py
   │   └── job_service.py
   ├── templates/                   # Jinja2 templates
   │   ├── base.html
   │   ├── pages/
   │   └── components/
   └── utils/                       # Utility modules
       ├── security.py
       └── validation.py

**Testing Strategy:**

* **Unit tests** for individual components
* **Integration tests** for service interactions
* **API tests** for endpoint functionality
* **End-to-end tests** for complete workflows
* **Performance tests** for scalability validation

**Quality Assurance:**

.. code-block:: yaml

   # GitHub Actions workflow
   - name: Lint code
     run: ruff check .
   
   - name: Type checking
     run: mypy src/
   
   - name: Run tests
     run: pytest --cov=borgitory
   
   - name: Security scan
     run: bandit -r src/

Future Architecture Plans
-------------------------

Planned Improvements
~~~~~~~~~~~~~~~~~~~~

**Database Enhancements:**

* **PostgreSQL support** for production deployments
* **Database clustering** for high availability
* **Read replicas** for scaling read operations
* **Connection pooling** optimization

**Microservices Evolution:**

* **Service separation** for independent scaling
* **Message queues** for inter-service communication
* **API gateway** for unified access
* **Service mesh** for advanced networking

**Cloud-Native Features:**

* **Kubernetes operator** for orchestration
* **Helm charts** for deployment
* **Prometheus metrics** for monitoring
* **Distributed tracing** for observability

**Advanced Features:**

* **Plugin system** for extensibility
* **Workflow engine** for complex operations
* **Multi-tenancy** support
* **Advanced analytics** and reporting

This architecture provides a solid foundation for current needs while remaining flexible enough to evolve with future requirements.
