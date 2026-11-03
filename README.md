# OLYMPIA NỘI BỘ (v1.1)

Web game thời gian thực mô phỏng 4 vòng thi **Đường lên đỉnh Olympia** (Khởi động, Vượt chướng ngại vật, Tăng tốc, Về đích) kèm Câu hỏi phụ.

---

## 1. Công nghệ Sử dụng (Tech Stack)

- **Monorepo:** `shared/`, `server/`, `client/`
- **Ngôn ngữ:** TypeScript
- **Backend:** Node.js 20 + Express + Socket.IO
- **Frontend:** React 18 + Vite + Zustand + Tailwind CSS + Lucide Icons + Canvas Confetti
- **Audio:** Web Audio API tổng hợp hiệu ứng âm thanh trực tiếp (không phụ thuộc asset ngoài)
- **Kiểm thử:** Vitest (15 unit & concurrency test suites)
- **Triển khai:** Docker container đơn giản, chạy 1 tiến trình duy nhất (1 vCPU, 1 GB RAM)

---

## 2. Hướng dẫn Cài đặt & Khởi chạy

### Cài đặt thư viện
```bash
npm install
```

### Chạy chế độ Phát triển (Development Mode)
Mở 2 terminal riêng biệt:

1. **Terminal 1 - Khởi động Backend (Port 4000):**
```bash
npm run dev:server
```

2. **Terminal 2 - Khởi động Frontend Vite (Port 3000):**
```bash
npm run dev:client
```
Truy cập vào trình duyệt: `http://localhost:3000`

### Kiểm thử Tự động (Unit & Concurrency Tests)
```bash
npm test
```
Kiểm thử bao gồm:
- Chuẩn hóa Unicode NFC / NFD tiếng Việt (Unikey, macOS, mobile)
- So khớp đáp án và các đáp án tương đương (`alternatives`)
- Vòng đời phòng, sảnh, cơ chế tự động chuyển quyền chủ phòng
- 8 trường hợp tính điểm Về Đích & Ngôi sao hy vọng (G12, G13)
- Ngưỡng đồng hạng Tăng Tốc $\le 50\text{ ms}$ (G8)
- Khóa chuông nguyên tử: 5 bot bấm chuông đồng thời 100 lần (đảm bảo đúng 1 người thắng)

### Đóng gói & Chạy Bản Production
```bash
npm run build
npm start
```
Server sẽ phục vụ cả API, Socket.IO và giao diện web tĩnh tại `http://localhost:4000`.

### Triển khai bằng Docker
```bash
docker compose up -d --build
```

---

## 3. Luật chơi & Phím tắt

- **Không cần tài khoản:** Nhập tên để vào phòng (tối đa 5 thí sinh), nhận ghế 1–5 và tự động lưu `token` vào `localStorage` để tự động kết nối lại nếu tải lại trang.
- **Phím tắt hỗ trợ:**
  - `Phím Space`: Bấm chuông giành quyền trả lời (Khởi động chung, VCNV, Giành quyền Về đích, Câu hỏi phụ).
  - `Phím 1, 2, 3, 4`: Chọn nhanh các đáp án trắc nghiệm A, B, C, D ở vòng Khởi động.
- **Chủ phòng:**
  - Có quyền nạp bộ đề tùy chỉnh (.xlsx hoặc .json) tại sảnh chờ.
  - Có nút **"Sửa kết quả chấm"** hiển thị trong 10 giây sau khi công bố đáp án (REVEAL) để sửa đổi kết quả cho thí sinh nếu cần.
  - Tải biên bản chi tiết trận đấu ra file CSV sau khi kết thúc trận.
