# AI Model Configuration

## Tổng quan

Hệ thống hiện tại hỗ trợ 2 AI model chính với cấu hình server khác nhau:

1. **NPO AI Agent** - AI agent chính cho Network Performance Optimization
2. **NPO AI Reasoning** - AI agent với khả năng reasoning nâng cao cho các vấn đề phức tạp

## Cấu hình Environment Variables

### NPO AI Agent (chat-model)
```env
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=70
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=AInow123@
```

### NPO AI Reasoning (chat-model-reasoning)
```env
INTERNAL_AI_REASONING_SERVER_IP=10.196.5.135
INTERNAL_AI_REASONING_PORT=28002
INTERNAL_AI_REASONING_ASSET_ID=71
INTERNAL_AI_REASONING_USERNAME=aiteam1
INTERNAL_AI_REASONING_PASSWORD=AInow123@
```

## Cách thay đổi cấu hình

1. **Thay đổi server IP**: Cập nhật `INTERNAL_AI_SERVER_IP` hoặc `INTERNAL_AI_REASONING_SERVER_IP`
2. **Thay đổi port**: Cập nhật `INTERNAL_AI_PORT` hoặc `INTERNAL_AI_REASONING_PORT`
3. **Thay đổi asset ID**: Cập nhật `INTERNAL_AI_ASSET_ID` hoặc `INTERNAL_AI_REASONING_ASSET_ID`

## Cấu trúc file

- `lib/ai/model-configs.ts` - Định nghĩa cấu hình cho từng model
- `lib/ai/custom-provider.ts` - Implementation của custom AI provider
- `lib/ai/models.ts` - Định nghĩa các model và mô tả

## Xử lý lỗi

Hệ thống đã được cải thiện để xử lý các lỗi từ AI agent:

1. **Lỗi kết nối**: Hiển thị thông báo lỗi rõ ràng
2. **Lỗi API response**: Kiểm tra `code` field trong response
3. **Fallback title**: Tự động tạo title từ user message nếu không thể generate được

## Testing

Để test việc chuyển đổi model:

1. Khởi động ứng dụng
2. Chọn model từ dropdown
3. Gửi message và kiểm tra response
4. Kiểm tra console logs để debug nếu có lỗi
