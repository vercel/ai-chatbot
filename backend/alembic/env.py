"""
Alembic environment configuration for async SQLAlchemy with PostgreSQL.

This file configures Alembic to work with async SQLAlchemy models.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import settings to get database URL
from app.config import settings

# Import your models and Base
from app.core.database import Base
from app.models import *  # noqa: F401, F403 - Import all models so Alembic can detect them

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the SQLAlchemy URL from settings
# We use async engine with run_sync, so we can use the async URL directly
# Just remove the +asyncpg driver for Alembic's connection string
postgres_url = settings.POSTGRES_URL

# Use sync URL if provided, otherwise convert async URL to standard postgresql://
if settings.POSTGRES_URL_SYNC:
    postgres_url = settings.POSTGRES_URL_SYNC
elif postgres_url.startswith("postgresql+asyncpg://"):
    # Convert to standard postgresql:// for Alembic
    # The async engine will handle the actual connection
    postgres_url = postgres_url.replace("postgresql+asyncpg://", "postgresql://")
elif postgres_url.startswith("postgresql://"):
    # Already standard URL, use as-is
    pass
else:
    raise ValueError(
        f"Unsupported database URL format: {postgres_url}. "
        "Expected postgresql:// or postgresql+asyncpg://"
    )

config.set_main_option("sqlalchemy.url", postgres_url)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using async engine with sync operations.

    Alembic operations are run synchronously using connection.run_sync(),
    which allows us to use the async engine while executing sync migrations.
    """
    # Create async engine using the original async URL from settings
    # We need to use asyncpg for the actual connection
    async_url = settings.POSTGRES_URL
    if not async_url.startswith("postgresql+asyncpg://"):
        # If it's already a standard postgresql:// URL, add asyncpg driver
        async_url = async_url.replace("postgresql://", "postgresql+asyncpg://")

    # Create async engine configuration
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = async_url

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
