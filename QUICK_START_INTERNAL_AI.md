# Quick Start - AI Agent Nội Bộ

## 🚀 Cài đặt nhanh

### 1. Tạo file `.env.local`
```env
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=70
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=Z_tywg_2025
```

### 2. Test kết nối
```bash
node test-internal-ai.js
```

### 3. Chạy ứng dụng
```bash
pnpm dev
```

## ✅ Hoàn thành!

Ứng dụng sẽ sử dụng AI agent nội bộ thay vì model bên ngoài.

## 📋 Các file đã thay đổi

- `lib/ai/custom-provider.ts` - Custom provider
- `lib/ai/providers.ts` - Sử dụng internal provider  
- `lib/ai/models.ts` - Cập nhật tên model
- `test-internal-ai.js` - Script test
- `SETUP_INTERNAL_AI.md` - Hướng dẫn chi tiết

## 🔧 Troubleshooting

- **Lỗi kết nối:** Kiểm tra mạng nội bộ và thông tin server
- **Lỗi auth:** Kiểm tra username/password trong `.env.local`
- **Chi tiết:** Xem `SETUP_INTERNAL_AI.md`
