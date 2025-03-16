# Tasks Feature Setup Guide

This guide will help you set up the Tasks feature for WIZZO.

## Database Setup

The Tasks feature requires specific database tables that need to be created before the feature can be used.

### 1. Check Your Environment Variables

Make sure you have a `.env.local` file with the following entry:

```
POSTGRES_URL=postgresql://your_username:your_password@localhost:5432/your_database
```

Replace `your_username`, `your_password`, and `your_database` with your actual PostgreSQL connection details.

### 2. Run the Tasks Migration

Execute the following command to create the necessary database tables:

```bash
npm run tasks:migrate
```

This will run a script that creates the following tables:
- `task_project`: Stores task projects (categories)
- `task_item`: Stores individual task items
- `task_label`: Stores task labels
- `task_item_label`: Maps relationships between tasks and labels

### 3. Verify the Database Setup

You can verify that the tables were created successfully by running:

```bash
npm run tasks:verify
```

This will check if all the required tables exist in your database.

## Testing the Feature

After setting up the database, you can test the Tasks feature:

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the Tasks page: http://localhost:3000/tasks

3. You should be able to:
   - Create new tasks
   - Set due dates and priorities
   - Create projects
   - Assign tasks to projects
   - Mark tasks as completed

## Troubleshooting

If you encounter any issues:

1. **Database Connection Issues**
   - Check that your `POSTGRES_URL` is correct
   - Ensure your PostgreSQL server is running

2. **Table Doesn't Exist Errors**
   - Run `npm run tasks:migrate` to create the tables
   - Run `npm run tasks:verify` to check the table status

3. **Other Database Errors**
   - Check the console logs for specific error messages
   - Ensure you have proper permissions on your database

## Resetting the Tasks Tables

If you need to reset the Tasks tables, you can drop them from your PostgreSQL database:

```sql
DROP TABLE IF EXISTS task_item_label CASCADE;
DROP TABLE IF EXISTS task_label CASCADE;
DROP TABLE IF EXISTS task_item CASCADE;
DROP TABLE IF EXISTS task_project CASCADE;
```

And then run the migration again:

```bash
npm run tasks:migrate
```
