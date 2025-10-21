# Debug 400 Bad Request Error

## Vấn đề hiện tại
Lỗi: "Failed to load resource: the server responded with a status of 400 (bad request)"

## Nguyên nhân có thể

### 1. Format Request không đúng
API có thể yêu cầu format khác với những gì chúng ta đang gửi.

### 2. Headers không đúng
Authentication headers có thể không đúng format.

### 3. Payload structure không đúng
Cấu trúc JSON payload có thể thiếu hoặc thừa field.

## Các bước debug

### Bước 1: Kiểm tra Console Logs
Mở Developer Tools (F12) → Console tab và gửi message. Bạn sẽ thấy:

```
[npo-yen-model] Request payload: {...}
[npo-yen-model] Request headers: {...}
[npo-yen-model] AI Agent API error: 400 Bad Request
```

### Bước 2: Chạy Test Scripts
```bash
# Test format đơn giản
node test-minimal.js

# Test format đầy đủ
node test-simple-request.js
```

### Bước 3: Kiểm tra Response Body
Trong console logs, tìm phần `errorText` để xem server trả về gì:

```
errorText: "Invalid request format"
errorText: "Missing required field: content"
errorText: "Authentication failed"
```

## Các format đã thử

### Format 1: Minimal
```json
{
  "content": "Hello"
}
```

### Format 2: With sessionInfo
```json
{
  "sessionInfo": {
    "sessionId": "test123"
  },
  "content": "Hello"
}
```

### Format 3: Full format
```json
{
  "sessionInfo": {
    "sessionId": "test123"
  },
  "contentType": "rich-text",
  "content": "Hello",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "modelId": "npo-yen-model"
}
```

## Headers đã thử

### Option 1: Custom headers
```
Content-Type: application/json
username: aiteam1
password: <base64-encoded-password>
```

### Option 2: Basic Auth
```
Content-Type: application/json
Authorization: Basic <base64-encoded-username:password>
```

### Option 3: Both
```
Content-Type: application/json
Authorization: Basic <base64-encoded-username:password>
username: aiteam1
password: <base64-encoded-password>
```

## Cải thiện đã thực hiện

1. **Enhanced Logging**: Log đầy đủ request payload và headers
2. **Multiple Formats**: Thử nhiều format payload khác nhau
3. **Better Error Messages**: Hiển thị chi tiết lỗi 400
4. **Input Validation**: Kiểm tra user message không rỗng

## Next Steps

1. **Restart ứng dụng** để load code mới
2. **Gửi message** và kiểm tra console logs
3. **Tìm errorText** trong logs để xem server response
4. **Chạy test scripts** để test format khác nhau
5. **Báo cáo kết quả** để tiếp tục debug

## Có thể cần kiểm tra

- API documentation của AI agent server
- Format request chính xác mà server mong đợi
- Authentication method đúng
- Required fields trong payload
