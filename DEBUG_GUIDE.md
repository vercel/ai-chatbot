# Debug Guide - AI Model Connection Issues

## Vấn đề hiện tại
Lỗi: "the request couldn't be processed. Please check your input and try again"

## Các bước debug

### 1. Kiểm tra Console Logs
Mở Developer Tools (F12) và kiểm tra Console tab khi gửi message. Bạn sẽ thấy logs chi tiết:

```
[npo-yen-model] doGenerate called with messages: [...]
[npo-yen-model] Sending message to https://10.196.5.134:28001/api/ifactory-agent-run/v1/chat/api/70: {...}
[npo-yen-model] AI Agent response: {...}
```

### 2. Chạy Test Script
Chạy script test để kiểm tra kết nối trực tiếp:

```bash
node test-ai-connection.js
```

Script này sẽ test tất cả 3 model và hiển thị kết quả chi tiết.

### 3. Kiểm tra Network Tab
Trong Developer Tools, mở Network tab và gửi message để xem:
- Request được gửi đến đâu
- Response status code
- Response body

### 4. Các lỗi có thể gặp

#### A. Lỗi kết nối mạng
```
❌ Request Error: connect ECONNREFUSED 10.196.5.134:28001
```
**Giải pháp**: Kiểm tra server có đang chạy không

#### B. Lỗi SSL/TLS
```
❌ Request Error: unable to verify the first certificate
```
**Giải pháp**: Đã được xử lý bằng `NODE_TLS_REJECT_UNAUTHORIZED = '0'`

#### C. Lỗi Authentication
```
❌ HTTP Error: 401
```
**Giải pháp**: Kiểm tra username/password

#### D. Lỗi Asset ID
```
❌ AI Agent returned error code: -1
```
**Giải pháp**: Kiểm tra Asset ID có đúng không

### 5. Kiểm tra Environment Variables
Đảm bảo các biến môi trường được set đúng:

```env
# NPO Yen Model
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=70
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=AInow123@

# CS AI Model
INTERNAL_AI_REASONING_SERVER_IP=10.196.5.134
INTERNAL_AI_REASONING_PORT=28001
INTERNAL_AI_REASONING_ASSET_ID=56
INTERNAL_AI_REASONING_USERNAME=aiteam1
INTERNAL_AI_REASONING_PASSWORD=AInow123@
```

### 6. Test từng model riêng biệt
1. Chọn model "NPO Yen" và gửi message đơn giản: "Hello"
2. Kiểm tra console logs
3. Lặp lại với "CS AI" và "CS Minh"

### 7. Kiểm tra Server Status
Có thể test trực tiếp bằng curl:

```bash
curl -k -X POST \
  https://10.196.5.134:28001/api/ifactory-agent-run/v1/chat/api/70 \
  -H "Content-Type: application/json" \
  -H "username: aiteam1" \
  -H "password: $(echo -n 'AInow123@' | base64)" \
  -d '{
    "sessionInfo": {
      "sessionId": "test123"
    },
    "contentType": "rich-text",
    "content": "Hello"
  }'
```

## Cải thiện đã thực hiện

1. **Enhanced Logging**: Thêm logs chi tiết cho mỗi bước
2. **Better Error Handling**: Xử lý lỗi tốt hơn với thông tin chi tiết
3. **Message Parsing**: Cải thiện cách parse messages từ AI SDK
4. **Response Validation**: Kiểm tra response format kỹ hơn

## Next Steps

1. Chạy ứng dụng và kiểm tra console logs
2. Gửi message và xem logs chi tiết
3. Chạy test script nếu cần
4. Báo cáo kết quả để tiếp tục debug
