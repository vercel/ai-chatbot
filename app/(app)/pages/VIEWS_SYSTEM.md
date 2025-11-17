# Views System Documentation _(legacy)_

> **Note:** The Views system has been superseded by the Pages implementation described in `docs/pages-migration.md`. This document remains for historical reference and will be removed after all consumers transition to Pages.

## Overview

The Views System is a configurable UI layout builder that allows users to create custom views composed of reusable blocks. Each view can display data from Supabase tables, records, reports, or trigger actions through interactive components.

## Architecture

### Core Concepts

1. **Views**: Top-level containers that define a page layout with multiple blocks
2. **Blocks**: Reusable components that display data or trigger actions
3. **Templates**: Pre-configured view patterns for common use cases
4. **URL Parameters**: Dynamic values passed via URL query strings that blocks can reference

### Database Schema

Views are stored in the `views` table with the following structure:

```sql
CREATE TABLE views (
    id TEXT PRIMARY KEY,                    -- Unique slug identifier
    name TEXT NOT NULL,                     -- Display name
    description TEXT,                       -- Optional description
    created_at TIMESTAMP WITH TIME ZONE,    -- Creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE,    -- Last update timestamp
    created_by UUID,                        -- Foreign key to auth.users
    layout JSONB DEFAULT '{}',              -- Layout configuration (reserved for future use)
    blocks JSONB DEFAULT '[]',             -- Array of block definitions
    settings JSONB DEFAULT '{}'             -- View-level settings (URL params, etc.)
);
```

**JSONB Fields:**

- **`blocks`**: Array of block objects, each with `id`, `type`, `position`, `dataSource`, and `displayConfig`
- **`settings`**: Object containing `urlParams` array defining required/optional URL parameters
- **`layout`**: Reserved for future grid layout configuration

## Block Types

### 1. List Block

Displays a paginated table of records from a Supabase table.

**Configuration:**

```typescript
{
  type: 'list',
  dataSource: {
    type: 'table',
    tableName: 'users',           // Table name (required)
    filters: {                     // Optional filters
      'filter[column_name]': {
        operator: 'equals',       // equals, not_equals, contains, etc.
        value: 'url.id'           // Can reference URL params
      }
    }
  },
  displayConfig: {
    format: 'table',              // 'table' | 'cards' | 'grid'
    showActions: true,            // Show row action buttons
    columns: ['id', 'name'],      // Specific columns (empty = all)
    editable: false              // Allow inline editing
  },
  position: { x: 0, y: 0, width: 12, height: 4 }
}
```

**Filter Operators:**
- `equals` - Exact match
- `not_equals` - Not equal
- `contains` - Case-insensitive contains (ILIKE)
- `greater_than` - Numeric/date comparison
- `less_than` - Numeric/date comparison
- `greater_than_or_equal` - >= comparison
- `less_than_or_equal` - <= comparison
- `is_null` - Column is NULL
- `is_not_null` - Column is not NULL

**Component:** `src/lib/components/views/blocks/ListBlock.svelte`

### 2. Record Block

Displays a single record in read-only, edit, or create mode.

**Configuration:**

```typescript
{
  type: 'record',
  dataSource: {
    type: 'record',
    tableName: 'users',           // Table name (required)
    recordId: 'url.id'            // Record ID (can reference URL params)
  },
  displayConfig: {
    mode: 'read',                 // 'read' | 'edit' | 'create'
    format: 'table',              // Display format (for read mode)
    columns: []                   // Specific columns (empty = all)
  },
  position: { x: 0, y: 0, width: 8, height: 6 }
}
```

**Modes:**
- **`read`**: Display-only form showing all fields
- **`edit`**: Editable form for existing record (requires `recordId`)
- **`create`**: Form for creating new record (no `recordId` needed)

**Component:** `src/lib/components/views/blocks/RecordBlock.svelte`

### 3. Report Block

Displays data from a saved SQL query (report) rendered as a chart.

**Configuration:**

```typescript
{
  type: 'report',
  dataSource: {
    type: 'report',
    reportId: 'report-uuid'       // Saved report ID
  },
  displayConfig: {
    chartType: 'bar',             // Chart type from shadcn-svelte charts
    title: 'Sales Summary'        // Optional title
  },
  position: { x: 0, y: 0, width: 3, height: 2 }
}
```

**Status:** Reports feature is planned but not yet implemented. The component exists as a placeholder.

**Component:** `src/lib/components/views/blocks/ReportBlock.svelte`

### 4. Trigger Block

A clickable button/pane that triggers a defined action/hook.

**Configuration:**

```typescript
{
  type: 'trigger',
  dataSource: {},                 // No data source needed
  displayConfig: {
    buttonText: 'Delete Record',  // Button label
    actionType: 'destructive',    // 'default' | 'destructive' | 'primary'
    requireConfirmation: true,     // Show confirmation dialog
    confirmationText: 'Are you sure?',
    hookName: 'delete_record'     // Hook/function name to call
  },
  position: { x: 8, y: 0, width: 4, height: 2 }
}
```

**Component:** `src/lib/components/views/blocks/TriggerBlock.svelte`

## URL Parameter Resolution

Views support dynamic URL parameters that blocks can reference. Parameters are defined in `settings.urlParams`:

```typescript
settings: {
  urlParams: [
    { name: 'id', required: true, description: 'Record ID' },
    { name: 'filter', required: false, description: 'Optional filter' }
  ]
}
```

**Referencing in Block Configuration:**

Blocks can reference URL parameters using the `url.paramName` syntax:

```typescript
// In dataSource
recordId: 'url.id'              // References ?id=123 in URL

// In filters
'filter[user_id]': {
  operator: 'equals',
  value: 'url.id'               // Uses URL parameter value
}
```

**Resolution Process:**

1. URL query parameters are extracted on page load
2. Blocks receive `urlParams` object as a prop
3. `resolveParameter()` function checks if a value starts with `url.`
4. If so, it extracts the parameter name and looks up the value
5. The resolved value is used in API calls

**Example:**

URL: `/app/views/users?id=bda7c6b1-73d1-4986-b75d-58982c327e44`

```typescript
urlParams = { id: 'bda7c6b1-73d1-4986-b75d-58982c327e44' }

// Block config
recordId: 'url.id'
// Resolves to: 'bda7c6b1-73d1-4986-b75d-58982c327e44'
```

## Data Flow

### View Creation Flow

1. **User clicks "Create View"** → Opens `CreateViewModal`
2. **User enters slug** → Real-time validation checks uniqueness
3. **User enters name/description** → Form validation
4. **User submits** → `POST /api/views` creates view with empty blocks
5. **Redirect to view builder** → `/app/views/[viewId]?viewMode=edit`

### View Editing Flow

1. **Load view** → `GET /api/views/[id]` fetches view data
2. **Parse JSONB** → `blocks`, `settings`, `layout` parsed from strings if needed
3. **Render ViewBuilder** → User can add/configure blocks
4. **Configure block** → `BlockConfigPanel` opens for selected block
5. **Save block** → Block added/updated in `viewConfig.blocks`
6. **Save view** → `PUT /api/views/[id]/save` persists changes

### View Rendering Flow

1. **Load view** → `+page.server.ts` fetches view and extracts URL params
2. **Parse blocks** → Ensure `blocks` is an array
3. **Render blocks** → `getBlockComponent()` maps block type to component
4. **Load block data** → Each block component fetches its own data:
   - ListBlock: `GET /api/supabase/table?table=...&filter[...]=...`
   - RecordBlock: `GET /api/supabase/record?table=...&id=...`
   - ReportBlock: `GET /api/reports/[id]` (future)
   - TriggerBlock: No data fetching
5. **Resolve parameters** → URL params resolved in block data fetching
6. **Render UI** → Components display data using their display config

## API Endpoints

### `/api/views` (GET)

List all views for the current user.

**Response:**
```json
{
  "views": [
    {
      "id": "users",
      "name": "Users",
      "description": "User management view",
      "blocks": [...],
      "settings": {...},
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### `/api/views` (POST)

Create a new view.

**Request:**
```json
{
  "id": "users",
  "name": "Users",
  "description": "User management view"
}
```

**Response:**
```json
{
  "view": {
    "id": "users",
    "name": "Users",
    "blocks": [],
    "settings": {},
    "layout": {}
  }
}
```

### `/api/views/[id]` (GET)

Fetch a specific view by ID.

**Response:**
```json
{
  "view": {
    "id": "users",
    "name": "Users",
    "blocks": [...],
    "settings": {...},
    "layout": {}
  }
}
```

**Note:** JSONB fields are automatically parsed from strings if needed.

### `/api/views/[id]/save` (PUT)

Save view configuration (blocks, settings, layout).

**Request:**
```json
{
  "name": "Users",
  "description": "Updated description",
  "blocks": [...],
  "settings": {...},
  "layout": {}
}
```

### `/api/supabase/table` (GET)

Fetch table data with optional filtering.

**Query Parameters:**
- `table` - Table name (required)
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 100, max: 1000)
- `filter[column]` - Filter value for column
- `filter_op[column]` - Filter operator for column

**Example:**
```
GET /api/supabase/table?table=users&filter[id]=url.id&filter_op[id]=equals
```

**Response:**
```json
{
  "columns": [...],
  "rows": [...],
  "pagination": {
    "page": 1,
    "limit": 100,
    "totalRows": 50,
    "totalPages": 1
  },
  "tableName": "users"
}
```

**Filter Format:**

Filters are sent as URL query parameters:
- `filter[column_name]=value` - The filter value
- `filter_op[column_name]=operator` - The operator (equals, contains, etc.)

The API endpoint parses these and applies them using Supabase query builder methods.

### `/api/supabase/record` (GET)

Fetch a single record by ID.

**Query Parameters:**
- `table` - Table name (required)
- `id` - Record ID (required)

**Response:**
```json
{
  "record": {
    "id": "...",
    "name": "...",
    ...
  },
  "columns": [...],
  "tableName": "users"
}
```

## Components

### ViewBuilder (`src/lib/components/views/builder/ViewBuilder.svelte`)

Main component for editing views in edit mode.

**Features:**
- Add/remove blocks
- Configure block properties
- Apply templates from popover
- Configure URL parameters
- Save view configuration

**State:**
- `viewConfig` - Current view configuration
- `selectedBlock` - Currently selected block for editing
- `blockConfigOpen` - Modal open state
- `templatePopoverOpen` - Template picker popover state
- `availableTables` - List of available Supabase tables
- `availableReports` - List of available reports (future)

### BlockConfigPanel (`src/lib/components/views/builder/BlockConfigPanel.svelte`)

Modal for configuring individual blocks.

**Sections:**
1. **Block Type** - Toggle buttons for list/record/report/trigger
2. **DataSource** - Table/report selection, filters (via `DataSourceConfig`)
3. **Display** - Format, columns, mode options (via `DisplayConfig`)

### DataSourceConfig (`src/lib/components/views/builder/DataSourceConfig.svelte`)

Configures data source for a block.

**Features:**
- Automatically sets `dataSource.type` based on block type
- Table selection for list/record blocks
- Report selection for report blocks
- Filter configuration (for list blocks) via `FilterConfig` component
- URL parameter reference support

### FilterConfig (`src/lib/components/views/builder/FilterConfig.svelte`)

Configures multiple filter conditions for list blocks.

**Features:**
- Add/remove filter conditions
- Column selection dropdown
- Operator selection (equals, contains, etc.)
- Value input with URL parameter support
- Visual filter condition cards

### DisplayConfig (`src/lib/components/views/builder/DisplayConfig.svelte`)

Configures how a block displays data.

**Options by Block Type:**

- **List**: Format (table/cards/grid), columns, showActions, editable
- **Record**: Mode (read/edit/create), format, columns
- **Report**: ChartType, title
- **Trigger**: buttonText, actionType, requireConfirmation, confirmationText, hookName

### CreateViewModal (`src/lib/components/views/CreateViewModal.svelte`)

Modal for creating new views with slug validation.

**Features:**
- Slug input with real-time validation
- Format validation (lowercase alphanumeric, hyphens, underscores)
- Uniqueness check via API call
- Debounced validation (500ms)
- Name and description inputs

## Templates

Templates are predefined view patterns stored in `src/lib/utils/view-templates.ts`.

**Available Templates:**

1. **Detail View** - Record detail with audit log and workflow runs
2. **List View** - Table list with summary report card
3. **Dashboard View** - Master list with detail panel and related records
4. **Form View** - Editable form with delete trigger and recent changes

**Template Structure:**

```typescript
{
  id: 'detail-view',
  name: 'Detail View',
  description: 'Record detail with form, audit log, and workflow runs',
  blocks: [
    {
      id: 'record-view',
      type: 'record',
      position: { x: 0, y: 0, width: 8, height: 6 },
      dataSource: {...},
      displayConfig: {...}
    }
  ],
  settings: {
    urlParams: [
      { name: 'id', required: true, description: 'Record ID' }
    ]
  }
}
```

**Applying Templates:**

Templates can be applied via the popover next to "Add Block" button in ViewBuilder. When applied, template blocks are added to the current view with unique IDs.

## Permissions

Views use the RBAC permission system:

- **`views.view`** - Required to view any view
- **`views.edit`** - Required to create/edit views

**Permission Checks:**
- View listing: `views.view`
- View detail (read mode): `views.view`
- View detail (edit mode): `views.edit`
- View creation: `views.edit`
- View saving: `views.edit`

**RLS Policies:**
- All authenticated users can view all views
- Users can only create/update/delete their own views (checked by `created_by`)

## Filtering System

### Filter Configuration UI

List blocks support multiple filter conditions configured in `FilterConfig`:

1. **Column Selection** - Choose from available table columns
2. **Operator Selection** - Choose comparison operator
3. **Value Input** - Enter value or reference URL parameter (e.g., `url.id`)

### Filter Storage Format

Filters are stored in `dataSource.filters` as:

```typescript
{
  'filter[column_name]': {
    operator: 'equals',
    value: 'url.id'
  }
}
```

### Filter Application

When a list block loads data:

1. Filters are extracted from `dataSource.filters`
2. Values are resolved (URL params substituted)
3. API request includes `filter[column]=value` and `filter_op[column]=operator`
4. `/api/supabase/table` endpoint applies filters using Supabase query builder

**Example:**

Block config:
```typescript
filters: {
  'filter[user_id]': {
    operator: 'equals',
    value: 'url.id'
  }
}
```

URL: `/app/views/audit-logs?id=123`

API call:
```
GET /api/supabase/table?table=audit_log&filter[user_id]=123&filter_op[user_id]=equals
```

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   └── views/
│   │       ├── CreateViewModal.svelte          # View creation modal
│   │       ├── ViewBlock.svelte                 # Base block wrapper
│   │       ├── builder/
│   │       │   ├── ViewBuilder.svelte          # Main editor component
│   │       │   ├── BlockConfigPanel.svelte     # Block configuration modal
│   │       │   ├── DataSourceConfig.svelte     # Data source configuration
│   │       │   ├── DisplayConfig.svelte        # Display options configuration
│   │       │   ├── FilterConfig.svelte         # Filter conditions UI
│   │       │   └── BlockLayoutPreview.svelte   # Visual block preview
│   │       └── blocks/
│   │           ├── ListBlock.svelte             # List/table block
│   │           ├── RecordBlock.svelte           # Record/form block
│   │           ├── ReportBlock.svelte           # Report/chart block
│   │           └── TriggerBlock.svelte          # Action trigger block
│   └── utils/
│       └── view-templates.ts                    # Predefined templates
├── routes/
│   ├── app/
│   │   └── views/
│   │       ├── +page.svelte                     # Views list page
│   │       ├── +page.server.ts                 # Views list loader
│   │       └── [viewId]/
│   │           ├── +page.svelte                 # View display/edit page
│   │           └── +page.server.ts             # View data loader
│   └── api/
│       ├── views/
│       │   ├── +server.ts                      # List/create views
│       │   └── [id]/
│       │       ├── +server.ts                  # Get view
│       │       └── save/
│       │           └── +server.ts              # Save view
│       └── supabase/
│           ├── table/
│           │   └── +server.ts                 # Table data with filters
│           └── record/
│               └── +server.ts                 # Single record data
└── supabase/
    └── migrations/
        └── 20250101000014_views_system.sql    # Database schema
```

## Best Practices

1. **URL Parameters**: Always define required URL parameters in `settings.urlParams` for documentation and validation
2. **Filter Values**: Use `url.paramName` syntax to make filters dynamic based on URL parameters
3. **Block IDs**: Use unique, descriptive IDs for blocks (e.g., `user-list`, `customer-detail`)
4. **Position**: Use grid coordinates (x, y, width, height) for block positioning. Width is typically 12 columns.
5. **Templates**: Start with templates and customize rather than building from scratch
6. **Mode Selection**: Use appropriate modes for record blocks (read for display, edit for forms, create for new records)

## Future Enhancements

- **Report System**: Implement saved SQL queries and chart rendering
- **Hook System**: Implement trigger block hooks for custom actions
- **Layout System**: Implement visual drag-and-drop block positioning
- **Block Linking**: Allow blocks to reference other blocks' data
- **Conditional Rendering**: Show/hide blocks based on conditions
- **Custom Styling**: Allow per-block styling configuration
- **Export/Import**: Export view configurations as JSON
- **View Sharing**: Share views between users/organizations

