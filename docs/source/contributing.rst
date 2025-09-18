Contributing to Borgitory
=========================

Thank you for your interest in contributing to Borgitory! This guide will help you get started with contributing to the project.

Getting Started
---------------

Code of Conduct
~~~~~~~~~~~~~~~

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

Ways to Contribute
~~~~~~~~~~~~~~~~~~

* **Bug Reports** - Help us identify and fix issues
* **Feature Requests** - Suggest new functionality
* **Documentation** - Improve guides, API docs, and examples
* **Code Contributions** - Fix bugs, implement features, improve performance
* **Testing** - Write tests, test new features, report compatibility issues
* **Community Support** - Help other users in discussions and issues

Development Setup
-----------------

Prerequisites
~~~~~~~~~~~~~

* Python 3.11 or higher
* Git
* BorgBackup installed and in PATH
* Rclone (optional, for cloud sync features)
* Docker (optional, for containerized development)

Setting Up the Development Environment
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. **Fork and Clone the Repository**

   .. code-block:: bash

      # Fork the repository on GitHub, then clone your fork
      git clone https://github.com/YOUR_USERNAME/Borgitory.git
      cd Borgitory

2. **Create a Virtual Environment**

   .. code-block:: bash

      # Create virtual environment
      python -m venv .env_borg
      
      # Activate virtual environment
      # On Windows:
      .env_borg\Scripts\activate
      # On macOS/Linux:
      source .env_borg/bin/activate

3. **Install Dependencies**

   .. code-block:: bash

      # Install in development mode with all dependencies
      pip install -e .[dev]

4. **Set Up Pre-commit Hooks** (Optional but Recommended)

   .. code-block:: bash

      # Install pre-commit
      pip install pre-commit
      
      # Install hooks
      pre-commit install

5. **Run the Development Server**

   .. code-block:: bash

      # Start development server with auto-reload
      python run.py
      
      # Or using the CLI
      borgitory serve --reload --log-level debug

6. **Verify Installation**

   * Open http://localhost:8000 in your browser
   * Create a test account and repository
   * Run the test suite: ``pytest``

Development Workflow
--------------------

Branch Strategy
~~~~~~~~~~~~~~~

* **main** - Stable release branch
* **develop** - Integration branch for new features
* **feature/*** - Feature development branches
* **bugfix/*** - Bug fix branches
* **hotfix/*** - Critical fixes for production

**Workflow:**

1. Create a feature branch from ``develop``
2. Make your changes
3. Write or update tests
4. Ensure all tests pass
5. Submit a pull request to ``develop``

Making Changes
~~~~~~~~~~~~~~

**Before You Start:**

1. Check existing issues and pull requests
2. Create an issue for discussion (for significant changes)
3. Ensure you understand the project architecture

**Development Guidelines:**

1. **Follow Code Style**

   .. code-block:: bash

      # Run linting
      ruff check .
      
      # Auto-fix issues
      ruff check . --fix
      
      # Type checking
      mypy src/

2. **Write Tests**

   .. code-block:: bash

      # Run all tests
      pytest
      
      # Run with coverage
      pytest --cov=borgitory
      
      # Run specific test file
      pytest tests/test_repositories.py

3. **Update Documentation**

   * Update docstrings for new functions/classes
   * Update README if needed
   * Add entries to CHANGELOG.md
   * Update API documentation if applicable

Code Style Guidelines
---------------------

Python Code Style
~~~~~~~~~~~~~~~~~

We follow PEP 8 with some modifications:

* **Line length**: 88 characters (Black default)
* **Imports**: Use isort for import sorting
* **Type hints**: Required for all public functions
* **Docstrings**: Google-style docstrings

**Example:**

.. code-block:: python

   from typing import Optional, List
   from pydantic import BaseModel


   class Repository(BaseModel):
       """Repository configuration model.
       
       Args:
           name: Human-readable repository name
           path: Filesystem path to repository
           passphrase: Encryption passphrase
           
       Attributes:
           id: Unique repository identifier
           created_at: Creation timestamp
       """
       
       name: str
       path: str
       passphrase: str
       id: Optional[int] = None
       
       def validate_path(self) -> bool:
           """Validate repository path exists and is accessible.
           
           Returns:
               True if path is valid and accessible
               
           Raises:
               ValueError: If path is invalid
           """
           # Implementation here
           pass

Frontend Guidelines
~~~~~~~~~~~~~~~~~~~

**HTML Templates:**

* Use semantic HTML elements
* Include ARIA attributes for accessibility
* Follow BEM naming convention for CSS classes
* Use Tailwind utility classes consistently

**JavaScript/Alpine.js:**

* Keep JavaScript minimal and focused
* Use Alpine.js directives for reactivity
* Prefer HTMX for server interactions
* Comment complex logic

**CSS/Tailwind:**

* Use Tailwind utility classes
* Create custom components for repeated patterns
* Ensure responsive design
* Test in multiple browsers

Testing Guidelines
------------------

Test Structure
~~~~~~~~~~~~~~

.. code-block:: text

   tests/
   ├── conftest.py                  # Pytest configuration and fixtures
   ├── unit/                        # Unit tests
   │   ├── test_models.py
   │   ├── test_services.py
   │   └── test_utils.py
   ├── integration/                 # Integration tests
   │   ├── test_api_endpoints.py
   │   ├── test_backup_workflow.py
   │   └── test_cloud_sync.py
   └── fixtures/                    # Test data and fixtures
       ├── repositories.json
       └── sample_configs.py

Writing Tests
~~~~~~~~~~~~~

**Unit Tests:**

.. code-block:: python

   import pytest
   from unittest.mock import Mock, patch
   from borgitory.services.borg_service import BorgService


   class TestBorgService:
       """Test BorgService functionality."""
       
       @pytest.fixture
       def borg_service(self):
           """Create BorgService instance for testing."""
           return BorgService()
       
       def test_create_repository_success(self, borg_service):
           """Test successful repository creation."""
           with patch('subprocess.run') as mock_run:
               mock_run.return_value.returncode = 0
               
               result = borg_service.create_repository(
                   path="/tmp/test-repo",
                   passphrase="test-passphrase"
               )
               
               assert result.success is True
               mock_run.assert_called_once()

**Integration Tests:**

.. code-block:: python

   import pytest
   from httpx import AsyncClient
   from borgitory.main import app


   @pytest.mark.asyncio
   class TestRepositoryAPI:
       """Test repository API endpoints."""
       
       async def test_create_repository(self):
           """Test repository creation via API."""
           async with AsyncClient(app=app, base_url="http://test") as client:
               response = await client.post(
                   "/api/repositories",
                   json={
                       "name": "Test Repo",
                       "path": "/tmp/test-repo",
                       "passphrase": "secure-passphrase"
                   }
               )
               
               assert response.status_code == 201
               data = response.json()
               assert data["name"] == "Test Repo"

**Test Best Practices:**

* Write tests for both success and failure cases
* Use descriptive test names
* Keep tests isolated and independent
* Mock external dependencies
* Use fixtures for common test data
* Aim for good test coverage (80%+)

Documentation Guidelines
------------------------

Documentation Types
~~~~~~~~~~~~~~~~~~~

* **Code Documentation** - Docstrings and inline comments
* **API Documentation** - OpenAPI/Swagger specs
* **User Documentation** - Installation, usage, and how-to guides
* **Developer Documentation** - Architecture and contributing guides

Writing Documentation
~~~~~~~~~~~~~~~~~~~~~

**Docstrings:**

.. code-block:: python

   def create_backup(
       self, 
       repository: Repository, 
       source_path: str,
       archive_name: str,
       compression: str = "lz4"
   ) -> Job:
       """Create a new backup job.
       
       Creates a backup job that will archive the specified source path
       to the given repository using BorgBackup.
       
       Args:
           repository: Target repository for the backup
           source_path: Path to directory or file to backup
           archive_name: Name for the created archive
           compression: Compression algorithm (lz4, zlib, lzma, zstd)
           
       Returns:
           Job instance representing the backup operation
           
       Raises:
           ValueError: If source_path doesn't exist
           RepositoryError: If repository is inaccessible
           
       Example:
           >>> service = BackupService()
           >>> repo = Repository(name="docs", path="/repos/docs")
           >>> job = service.create_backup(repo, "/home/user/docs", "docs-20231201")
           >>> print(f"Backup job created: {job.id}")
       """

**README Updates:**

* Keep installation instructions current
* Update feature lists when adding functionality
* Include relevant badges and links
* Provide clear usage examples

**Changelog:**

Follow Keep a Changelog format:

.. code-block:: text

   ## [Unreleased]
   ### Added
   - New cloud provider support for DigitalOcean Spaces
   - Archive browser file search functionality
   
   ### Changed
   - Improved backup progress reporting
   - Updated Docker base image to Python 3.11
   
   ### Fixed
   - Fixed repository connection timeout issues
   - Resolved FUSE mounting permissions on some systems

Submitting Changes
------------------

Pull Request Process
~~~~~~~~~~~~~~~~~~~~

1. **Prepare Your Changes**

   .. code-block:: bash

      # Ensure your branch is up to date
      git checkout develop
      git pull upstream develop
      git checkout your-feature-branch
      git rebase develop

2. **Run Quality Checks**

   .. code-block:: bash

      # Run all quality checks
      python lint.py all
      
      # Run tests
      pytest
      
      # Check type hints
      mypy src/

3. **Commit Your Changes**

   .. code-block:: bash

      # Stage changes
      git add .
      
      # Commit with descriptive message
      git commit -m "feat: add support for DigitalOcean Spaces cloud provider
      
      - Implement DigitalOcean Spaces storage class
      - Add configuration validation and tests
      - Update provider registry and templates
      - Add documentation and examples
      
      Closes #123"

4. **Push and Create Pull Request**

   .. code-block:: bash

      # Push to your fork
      git push origin your-feature-branch
      
      # Create pull request on GitHub

**Pull Request Guidelines:**

* Use a descriptive title
* Include a detailed description of changes
* Reference related issues
* Include screenshots for UI changes
* Ensure all checks pass
* Be responsive to review feedback

Commit Message Format
~~~~~~~~~~~~~~~~~~~~~

We follow Conventional Commits:

.. code-block:: text

   <type>[optional scope]: <description>
   
   [optional body]
   
   [optional footer(s)]

**Types:**

* ``feat`` - New feature
* ``fix`` - Bug fix
* ``docs`` - Documentation changes
* ``style`` - Code style changes (formatting, etc.)
* ``refactor`` - Code refactoring
* ``test`` - Adding or updating tests
* ``chore`` - Maintenance tasks

**Examples:**

.. code-block:: text

   feat(cloud-sync): add Azure Blob Storage support
   
   fix: resolve FUSE mounting permission issues on Ubuntu
   
   docs: update installation guide with Docker Compose examples
   
   test: add integration tests for backup scheduling

Review Process
~~~~~~~~~~~~~~

**What We Look For:**

* Code quality and style compliance
* Test coverage for new functionality
* Documentation updates
* Backward compatibility
* Security considerations
* Performance impact

**Review Stages:**

1. **Automated Checks** - CI/CD pipeline runs
2. **Code Review** - Maintainers review code
3. **Testing** - Manual testing if needed
4. **Approval** - At least one maintainer approval required
5. **Merge** - Squash and merge to develop branch

Community Guidelines
--------------------

Getting Help
~~~~~~~~~~~~

* **GitHub Discussions** - General questions and community support
* **GitHub Issues** - Bug reports and feature requests
* **Documentation** - Check existing docs first
* **Code Review** - Ask questions during review process

Communication
~~~~~~~~~~~~~

* Be respectful and constructive
* Provide context and examples
* Be patient with responses
* Help others when you can
* Follow up on your issues and PRs

Recognition
~~~~~~~~~~~

Contributors are recognized in:

* **CONTRIBUTORS.md** file
* **Release notes** for significant contributions
* **GitHub contributors** page
* **Special mentions** in project communications

Project Maintenance
-------------------

Release Process
~~~~~~~~~~~~~~~

1. **Version Planning** - Decide on next version features
2. **Feature Freeze** - Stop adding new features
3. **Testing** - Comprehensive testing of release candidate
4. **Documentation** - Update all documentation
5. **Release** - Tag version and publish
6. **Post-Release** - Monitor for issues and feedback

**Release Schedule:**

* **Major releases** - Every 6-12 months
* **Minor releases** - Every 2-3 months  
* **Patch releases** - As needed for critical fixes

Issue Triage
~~~~~~~~~~~~

**Issue Labels:**

* ``bug`` - Something isn't working
* ``enhancement`` - New feature or improvement
* ``documentation`` - Documentation related
* ``good first issue`` - Good for newcomers
* ``help wanted`` - Community help requested
* ``priority: high`` - Critical issues
* ``status: needs-info`` - Waiting for more information

**Triage Process:**

1. **Initial Review** - Validate issue and add labels
2. **Prioritization** - Assign priority and milestone
3. **Assignment** - Assign to maintainer or contributor
4. **Progress Tracking** - Monitor progress and provide updates
5. **Resolution** - Close when fixed and verified

Thank You
---------

Your contributions make Borgitory better for everyone. Whether you're fixing a typo, adding a feature, or helping other users, every contribution is valuable and appreciated.

For questions about contributing, please:

* Check the existing documentation
* Search existing issues and discussions
* Create a new discussion or issue
* Reach out to maintainers

Happy contributing! 🎉
