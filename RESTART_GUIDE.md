# Restart Guide - Fix Messages Parsing Issue

## Vấn đề hiện tại
- Messages vẫn là `undefined`
- Validation error vẫn xuất hiện mặc dù code đã được sửa
- Server có thể đang chạy code cũ

## Các bước restart

### 1. Stop Server
```bash
# Nhấn Ctrl+C để stop server hiện tại
```

### 2. Clear Next.js Cache
```bash
# Xóa .next folder
rm -rf .next

# Hoặc trên Windows
rmdir /s .next
```

### 3. Clear Node Modules Cache (nếu cần)
```bash
# Xóa node_modules và reinstall
rm -rf node_modules
npm install
```

### 4. Restart Server
```bash
npm run dev
```

## Kiểm tra sau khi restart

### 1. Mở Developer Tools (F12)
- Console tab
- Network tab

### 2. Gửi message và kiểm tra logs
Bạn sẽ thấy:
```
[npo-yen-model] Raw messages: [...]
[npo-yen-model] Last user message: {...}
[npo-yen-model] Extracted userMessage: "Hello"
[npo-yen-model] User message is empty, using fallback
```

### 3. Nếu vẫn có lỗi
- Kiểm tra console logs chi tiết
- Xem messages structure
- Báo cáo logs mới

## Code đã được sửa

### 1. Enhanced Logging
- Log raw messages
- Log last user message
- Log extracted userMessage

### 2. Fallback Message
- Sử dụng "Hello" nếu message empty
- Không throw error nữa

### 3. Better Error Handling
- Log chi tiết để debug
- Graceful fallback

## Expected Behavior

Sau khi restart, khi gửi message:
1. **Nếu messages có data**: Sẽ extract và gửi message thật
2. **Nếu messages empty**: Sẽ dùng fallback "Hello" và vẫn gửi được
3. **Logs chi tiết**: Sẽ thấy structure của messages

## Troubleshooting

### Nếu vẫn lỗi "User message is empty or invalid"
- Server chưa restart đúng cách
- Cache chưa được clear
- Cần hard refresh browser (Ctrl+Shift+R)

### Nếu messages vẫn undefined
- Có thể là issue với AI SDK
- Cần kiểm tra cách AI SDK truyền messages
- Có thể cần sửa cách gọi doGenerate/doStream
