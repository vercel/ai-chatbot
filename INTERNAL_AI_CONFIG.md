# Cấu hình AI Agent Nội Bộ

## Environment Variables

Tạo file `.env.local` trong thư mục gốc của dự án với nội dung sau:

```env
# AI Agent Nội Bộ Configuration
# Cấu hình kết nối với AI agent nội bộ của công ty

# Server thông tin
INTERNAL_AI_SERVER_IP=10.196.5.134
INTERNAL_AI_PORT=28001
INTERNAL_AI_ASSET_ID=70

# Thông tin xác thực
INTERNAL_AI_USERNAME=aiteam1
INTERNAL_AI_PASSWORD=Z_tywg_2025
```

## Cách cấu hình

1. **Tạo file `.env.local`** trong thư mục gốc của dự án
2. **Copy nội dung trên** vào file `.env.local`
3. **Cập nhật các giá trị** theo thông tin AI agent của bạn:
   - `INTERNAL_AI_SERVER_IP`: IP server của AI agent
   - `INTERNAL_AI_PORT`: Port của AI agent
   - `INTERNAL_AI_ASSET_ID`: Asset ID của AI agent
   - `INTERNAL_AI_USERNAME`: Username để xác thực
   - `INTERNAL_AI_PASSWORD`: Password để xác thực

## Lưu ý

- File `.env.local` sẽ không được commit vào git (đã có trong .gitignore)
- Đảm bảo kết nối mạng nội bộ để có thể truy cập AI agent
- Kiểm tra firewall và proxy settings nếu cần
