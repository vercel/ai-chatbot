# AI Model Configuration

## Tổng quan

Hệ thống hiện tại hỗ trợ 3 AI model hoàn toàn khác nhau, mỗi model có cấu hình server riêng biệt:

1. **NPO Yen** - AI model chuyên biệt cho Network Performance Optimization
2. **CS AI** - AI model tổng quát cho Customer Service
3. **CS Minh** - AI model cho Customer Service được phát triển bởi Minh

## Cấu hình Environment Variables

### NPO Yen (npo-yen-model)
```env
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=70
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=AInow123@
```

### CS AI (cs-ai-model)
```env
INTERNAL_AI_REASONING_SERVER_IP=10.196.5.134
INTERNAL_AI_REASONING_PORT=28001
INTERNAL_AI_REASONING_ASSET_ID=56
INTERNAL_AI_REASONING_USERNAME=aiteam1
INTERNAL_AI_REASONING_PASSWORD=AInow123@
```

### CS Minh (cs-minh-model)
```env
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=68
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=AInow123@
```

## Cách thay đổi cấu hình

Mỗi model có thể được cấu hình độc lập:

1. **NPO Yen Model**: Sử dụng `INTERNAL_AI_*` variables
2. **CS AI Model**: Sử dụng `INTERNAL_AI_REASONING_*` variables  
3. **CS Minh Model**: Sử dụng `INTERNAL_AI_*` variables (cùng server với NPO Yen nhưng khác Asset ID)

### Thay đổi cấu hình cho từng model:
- **Server IP**: Cập nhật biến tương ứng với model
- **Port**: Cập nhật biến tương ứng với model
- **Asset ID**: Cập nhật biến tương ứng với model

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

Để test việc chuyển đổi giữa các AI model:

1. Khởi động ứng dụng
2. Chọn AI model từ dropdown (NPO Yen, CS AI, hoặc CS Minh)
3. Gửi message và kiểm tra response từ model đã chọn
4. Mỗi model sẽ kết nối đến server/asset ID riêng biệt
5. Kiểm tra console logs để debug nếu có lỗi

## Lưu ý

- Mỗi model là một AI model hoàn toàn khác nhau, không phải là mode của cùng một model
- Mỗi model có thể có khả năng và chuyên môn khác nhau
- Cấu hình server có thể khác nhau cho từng model
