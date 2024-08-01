import { z } from 'zod';

// Define the schema for the body of a task
const bodySchema = z.object({
    content: z.string(),
    contentType: z.string()
});

// Define the schema for a single task
const taskSchema = z.object({
    "@odata.etag": z.string(),
    importance: z.string(),
    isReminderOn: z.boolean(),
    status: z.string(),
    title: z.string(),
    createdDateTime: z.string(),
    lastModifiedDateTime: z.string(),
    hasAttachments: z.boolean(),
    categories: z.array(z.string()),
    id: z.string(),
    body: bodySchema
});

// Define the schema for the entire response
const todoTasksResponseSchema = z.object({
    "@odata.context": z.string(),
    "@microsoft.graph.tips": z.string(),
    value: z.array(taskSchema)
});

// Example usage: validate the response
const response = {
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users('14c2fa29-1c19-401b-aacd-0e339c978931')/todo/lists('AAMkADhmYjY3M2VlLTc3YmYtNDJhMy04MjljLTg4NDI0NzQzNjJkMAAuAAAAAAAqiN_iXOf5QJoancmiEuQzAQAVAdL-uyq-SKcP7nACBA3lAAAAO9QQAAA%3D')/tasks",
    "@microsoft.graph.tips": "Use $select to choose only the properties your app needs, as this can lead to performance improvements. For example: GET me/todo/lists('<key>')/tasks?$select=body,bodyLastModifiedDateTime",
    "value": [
        {
            "@odata.etag": "W/\"L346FtCPQE6ffFMTnolssAAKiqI9RA==\"",
            "importance": "normal",
            "isReminderOn": false,
            "status": "notStarted",
            "title": "NextJS react test",
            "createdDateTime": "2024-07-31T15:38:19.5773066Z",
            "lastModifiedDateTime": "2024-07-31T15:38:19.6956322Z",
            "hasAttachments": false,
            "categories": [],
            "id": "AAMkADhmYjY3M2VlLTc3YmYtNDJhMy04MjljLTg4NDI0NzQzNjJkMABGAAAAAAAqiN_iXOf5QJoancmiEuQzBwAVAdL-uyq-SKcP7nACBA3lAAAAO9QQAAAvfjoW0I9ATp98UxOeiWywAAqNV8GSAAA=",
            "body": {
                "content": "",
                "contentType": "text"
            }
        },
        {
            "@odata.etag": "W/\"L346FtCPQE6ffFMTnolssAAKiNtBmw==\"",
            "importance": "high",
            "isReminderOn": false,
            "status": "notStarted",
            "title": "buy diplomas",
            "createdDateTime": "2024-07-13T14:42:24.7366347Z",
            "lastModifiedDateTime": "2024-07-26T20:48:23.1438339Z",
            "hasAttachments": false,
            "categories": [],
            "id": "AAMkADhmYjY3M2VlLTc3YmYtNDJhMy04MjljLTg4NDI0NzQzNjJkMABGAAAAAAAqiN_iXOf5QJoancmiEuQzBwAVAdL-uyq-SKcP7nACBA3lAAAAO9QQAAAvfjoW0I9ATp98UxOeiWywAAqC5NNZAAA=",
            "body": {
                "content": "Harvard Square COOP<http://harvardcoopbooks.bncollege.com/>\r\n1400 Massachusetts Avenue, Cambridge, MA 02138\r\nTel: (617) 499-2000 | Fax: (617) 547-2768\r\n\r\nHarvard Square\r\nMonday – Saturday: 10:00am – 8:00pm\r\nSunday: 10:00am – 6:00pm\r\n",
                "contentType": "text"
            }
        },
        {
            "@odata.etag": "W/\"L346FtCPQE6ffFMTnolssAAKgjchqg==\"",
            "importance": "normal",
            "isReminderOn": false,
            "status": "notStarted",
            "title": "fix ice in refrigerator",
            "createdDateTime": "2024-06-29T16:29:15.0690413Z",
            "lastModifiedDateTime": "2024-07-19T17:44:09.8048281Z",
            "hasAttachments": false,
            "categories": [],
            "id": "AAMkADhmYjY3M2VlLTc3YmYtNDJhMy04MjljLTg4NDI0NzQzNjJkMABGAAAAAAAqiN_iXOf5QJoancmiEuQzBwAVAdL-uyq-SKcP7nACBA3lAAAAO9QQAAAvfjoW0I9ATp98UxOeiWywAAp5BZxrAAA=",
            "body": {
                "content": "",
                "contentType": "text"
            }
        },
        {
            "@odata.etag": "W/\"L346FtCPQE6ffFMTnolssAAKdl4qlA==\"",
            "importance": "normal",
            "isReminderOn": false,
            "status": "notStarted",
            "title": "get new dryer",
            "createdDateTime": "2024-06-29T16:29:01.4978277Z",
            "lastModifiedDateTime": "2024-06-29T16:29:01.625629Z",
            "hasAttachments": false,
            "categories": [],
            "id": "AAMkADhmYjY3M2VlLTc3YmYtNDJhMy04MjljLTg4NDI0NzQzNjJkMABGAAAAAAAqiN_iXOf5QJoancmiEuQzBwAVAdL-uyq-SKcP7nACBA3lAAAAO9QQAAAvfjoW0I9ATp98UxOeiWywAAp5BZxqAAA=",
            "body": {
                "content": "",
                "contentType": "text"
            }
        }
    ]
};

const validationResult = todoTasksResponseSchema.safeParse(response);

if (validationResult.success) {
    console.log("Response is valid", validationResult.data);
} else {
    console.error("Response is invalid", validationResult.error);
}
