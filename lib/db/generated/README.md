# Schema Info

This is an auto-generated README file to help you understand your schema!

* SchemaID => `1875609341107881`
* Schema Version => `1`
* See schema on the [Stately Console](https://console.stately.cloud/1org/schemas/1875609341107881).

### Key Path Layout

| Group         | Key Path                             | Item Type  | primary | required | syncable | txn type |
|:--------------|:-------------------------------------|:-----------|:--------|:---------|:---------|:---------|
| `/chat-*`     | `/chat-*`                            | Chat       | Yes     | Yes      | Yes      | group    |
| `/chat-*`     | `/chat-*/message-*`                  | Message    | Yes     | Yes      | Yes      | group    |
| `/chat-*`     | `/chat-*/message-*/vote`             | Vote       | Yes     | Yes      | Yes      | group    |
| `/chat-*`     | `/chat-*/stream-*`                   | Stream     | Yes     | Yes      | Yes      | group    |
| `/document-*` | `/document-*/version-*`              | Document   | Yes     | Yes      | Yes      | group    |
| `/document-*` | `/document-*/version-*/suggestion-*` | Suggestion | Yes     | Yes      | Yes      | group    |
| `/email-*`    | `/email-*`                           | User       | No      | Yes      | Yes      | group    |
| `/message-*`  | `/message-*/vote-*`                  | Vote       | No      | Yes      | Yes      | group    |
| `/stream-*`   | `/stream-*`                          | Stream     | No      | Yes      | Yes      | group    |
| `/user-*`     | `/user-*`                            | User       | Yes     | Yes      | Yes      | group    |
| `/user-*`     | `/user-*/chat-*`                     | Chat       | No      | Yes      | Yes      | group    |
| `/user-*`     | `/user-*/document-*/version-*`       | Document   | No      | Yes      | Yes      | group    |
| `/user-*`     | `/user-*/suggestion-*`               | Suggestion | No      | Yes      | Yes      | group    |
| `/user-*`     | `/user-*/visibility-*/chat-*`        | Chat       | No      | No       | Yes      | group    |

### TODO:

What else should we add here? Let us know!
