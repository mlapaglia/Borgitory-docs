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
