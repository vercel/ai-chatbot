# Hướng dẫn cài đặt AI Agent Nội Bộ

## Tổng quan

Dự án đã được cấu hình để sử dụng AI agent nội bộ của công ty thay vì các model bên ngoài như Grok, OpenAI, etc.

## Các file đã được chỉnh sửa

1. **`lib/ai/custom-provider.ts`** - Custom provider cho AI agent nội bộ
2. **`lib/ai/providers.ts`** - Cập nhật để sử dụng internal provider
3. **`lib/ai/models.ts`** - Cập nhật tên và mô tả model
4. **`INTERNAL_AI_CONFIG.md`** - Hướng dẫn cấu hình environment variables

## Các bước cài đặt

### 1. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc với nội dung:

```env
# AI Agent Nội Bộ Configuration
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=70
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=Z_tywg_2025
```

**Lưu ý:** Thay đổi các giá trị theo thông tin AI agent thực tế của bạn.

### 2. Kiểm tra kết nối mạng

Đảm bảo máy tính của bạn có thể kết nối đến AI agent server:

```bash
# Test kết nối
ping 10.196.5.134

# Test port
telnet 10.196.5.134 28001
```

### 3. Test kết nối AI Agent

Chạy script test để kiểm tra kết nối:

```bash
node test-internal-ai.js
```

Nếu thành công, bạn sẽ thấy response từ AI agent.

### 4. Chạy ứng dụng

```bash
# Cài đặt dependencies (nếu chưa có)
pnpm install

# Chạy development server
pnpm dev
```

## Cách hoạt động

### API Format

AI agent nội bộ sử dụng format API riêng:

```json
{
  "sessionInfo": {
    "sessionId": "unique_session_id"
  },
  "contentType": "rich-text",
  "content": "user_message_here"
}
```

### Response Format

```json
{
  "sessionInfo": {
    "sessionId": "session_id",
    "assistantIds": ["70"],
    "username": "aiteam1"
  },
  "contentType": "rich-text",
  "content": "AI agent response here"
}
```

### Custom Provider

Custom provider sẽ:
1. Chuyển đổi messages từ AI SDK format sang format của AI agent
2. Gọi API AI agent với authentication
3. Chuyển đổi response về format AI SDK
4. Hỗ trợ streaming (nếu cần)

## Troubleshooting

### Lỗi kết nối

1. **Kiểm tra mạng nội bộ:**
   ```bash
   ping 10.196.5.134
   ```

2. **Kiểm tra port:**
   ```bash
   telnet 10.196.5.134 28001
   ```

3. **Kiểm tra SSL certificate:**
   - AI agent có thể sử dụng self-signed certificate
   - Code đã được cấu hình để bỏ qua SSL verification

### Lỗi authentication

1. Kiểm tra username/password trong `.env.local`
2. Kiểm tra asset_id có đúng không
3. Kiểm tra AI agent có đang chạy không

### Lỗi API format

1. Kiểm tra response format từ AI agent
2. Có thể cần điều chỉnh `callInternalAI` function trong `custom-provider.ts`

## Tùy chỉnh thêm

### Thay đổi AI Agent khác

Nếu muốn sử dụng AI agent khác, cập nhật:

1. **Environment variables** trong `.env.local`
2. **API URL format** trong `custom-provider.ts` nếu cần
3. **Request/Response format** nếu AI agent sử dụng format khác

### Thêm tính năng

1. **Session management:** Lưu session ID để duy trì conversation
2. **Error handling:** Xử lý lỗi chi tiết hơn
3. **Logging:** Thêm logging để debug
4. **Caching:** Cache response nếu cần

## Liên hệ

Nếu gặp vấn đề, liên hệ team AI để được hỗ trợ về:
- Thông tin kết nối AI agent
- API documentation
- Troubleshooting
