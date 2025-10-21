# Hướng dẫn sử dụng AI Chatbot với Model Nội bộ

## Tổng quan

Ứng dụng chatbot này đã được cấu hình để sử dụng AI model nội bộ của ZTE thay vì các model external như OpenAI hay Anthropic.

## Các thay đổi đã thực hiện

### 1. Khắc phục lỗi Hydration Mismatch
- **File**: `components/suggested-actions.tsx`
- **Vấn đề**: Component render khác nhau giữa server và client
- **Giải pháp**: Sử dụng `useState` và `useEffect` để đảm bảo consistency

### 2. Custom Provider cho AI Model Nội bộ
- **File**: `lib/ai/custom-provider.ts`
- **Chức năng**: Tạo custom provider để kết nối với AI agent nội bộ
- **Tính năng**: 
  - Hỗ trợ streaming
  - Xử lý session management
  - Chuyển đổi format messages

### 3. SSL Verification Handler
- **File**: `lib/ai/fetch-agent.ts`
- **Chức năng**: Xử lý SSL verification cho mạng nội bộ
- **Tính năng**: Bỏ qua SSL verification khi cần thiết

### 4. Test Script
- **File**: `test-internal-ai.js`
- **Chức năng**: Test kết nối với AI model nội bộ
- **Cách sử dụng**: `node test-internal-ai.js`

## Cấu hình

### Environment Variables
Các biến môi trường có thể được cấu hình trong `.env.local`:

```env
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=70
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=Z_tywg_2025
```

### Model Configuration
Các model được cấu hình trong `lib/ai/models.ts`:
- `chat-model`: NPO AI Agent
- `chat-model-reasoning`: NPO AI Reasoning

## Cách sử dụng

### 1. Test kết nối
```bash
node test-internal-ai.js
```

### 2. Chạy ứng dụng
```bash
npm run dev
```

### 3. Truy cập ứng dụng
Mở trình duyệt và truy cập `http://localhost:3000`

## Lưu ý quan trọng

1. **Mạng nội bộ**: Đảm bảo bạn đang kết nối với mạng nội bộ của ZTE
2. **SSL Certificate**: Ứng dụng đã được cấu hình để bỏ qua SSL verification cho mạng nội bộ
3. **Model không có reasoning**: Model nội bộ không hỗ trợ reasoning, vì vậy một số tính năng có thể bị vô hiệu hóa
4. **Session Management**: Mỗi cuộc trò chuyện sẽ có session ID riêng để duy trì context

## Troubleshooting

### Lỗi kết nối
- Kiểm tra kết nối mạng nội bộ
- Xác nhận AI agent server đang chạy
- Kiểm tra thông tin đăng nhập

### Lỗi Hydration
- Đã được khắc phục bằng cách sử dụng client-side rendering
- Nếu vẫn gặp lỗi, kiểm tra browser extensions

### Lỗi SSL
- Đã được xử lý bằng custom fetch agent
- Không cần cấu hình thêm

## Support

Nếu gặp vấn đề, vui lòng liên hệ team AI để được hỗ trợ.
