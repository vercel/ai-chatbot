# Knowledge Selection Feature

This feature allows users to select specific knowledge items to use during chat retrieval, providing more focused and relevant AI responses.

## Usage

- Click the database icon button next to the attachment button in the chat area
- In the modal, select/deselect knowledge items to filter what the AI uses for retrieval
- By default, all knowledge items are selected
- Settings are saved per chat conversation

## Implementation Details

- Knowledge items are displayed in a 2x2 grid with scrollable interface
- Each item shows title, type, and date added
- Select/deselect all button allows easy bulk selection
- Selected IDs are stored in localStorage for persistence
- API automatically filters retrieval based on selected knowledge items

## Security

- All knowledge filtering occurs server-side
- Only completed knowledge documents are available for selection
- Results are limited to 10 documents for optimal UX
