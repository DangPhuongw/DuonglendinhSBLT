# Quy định Dự án Đường lên đỉnh SBLT (Olympia)

Tài liệu này áp dụng vĩnh viễn cho tất cả các tác vụ soạn thảo, tạo bộ đề thi đấu, nạp câu hỏi và quản lý ngân hàng đề thi.

---

## 1. QUY TẮC BẮT BUỘC KHI SOẠN CÂU HỎI TRẮC NGHIỆM (Khởi động riêng & Khởi động chung)

### ⚠️ TUYỆT ĐỐI KHÔNG ĐỂ THIÊN LỆCH ĐÁP ÁN (Full A, Full B,...)
- **Nghiêm cấm tuyệt đối**: Soạn câu hỏi mà đáp án đúng bị dồn vào một chữ cái (ví dụ toàn bộ câu đều là đáp án `A`, hoặc hầu hết câu đều là `B`).
- **Phân bổ đồng đều**: Các đáp án đúng (`A`, `B`, `C`, `D`) **bắt buộc phải được phân bổ cân bằng xấp xỉ 25%** cho mỗi phương án:
  - **Khởi động riêng (30 câu)**: Mỗi chữ cái `A`, `B`, `C`, `D` xuất hiện từ **7 đến 8 lần**.
  - **Khởi động chung (12 câu)**: Mỗi chữ cái `A`, `B`, `C`, `D` xuất hiện đúng **3 lần**.
- **Xáo trộn ngẫu nhiên (Shuffle)**: Khi thêm câu hỏi mới, vị trí của đáp án đúng trong 4 phương án (`OptionA`, `OptionB`, `OptionC`, `OptionD`) phải được xáo trộn ngẫu nhiên; không để một chữ cái đáp án xuất hiện liên tiếp quá 2 lần.

---

## 2. QUY TẮC VÒNG VƯỢT CHƯỚNG NGẠI VẬT (VCNV)

- **Không lộ từ khóa trong câu hỏi hàng ngang**: Trong nội dung câu hỏi của 4 hàng ngang (`ROW_1` đến `ROW_4`), **tuyệt đối không được nhắc đến từ khóa Chướng ngại vật**.
- Các hàng ngang đóng vai trò là những manh mối liên tưởng logic dẫn dắt đến từ khóa chướng ngại vật theo đúng format chuẩn của chương trình Đường lên đỉnh Olympia.

---

## 3. QUY TẮC ĐỘ KHÓ VÀ CẤU TRÚC BỘ ĐỀ

- **Khởi động riêng**: 30 câu (5 ghế × 6 câu: mỗi ghế gồm 4 câu Dễ + 2 câu Trung bình).
- **Khởi động chung**: 12 câu (5 câu Dễ + 4 câu Trung bình + 3 câu Khó).
- **Trộn ngẫu nhiên độ khó trong Khởi động**: Thứ tự xuất hiện các câu hỏi theo độ khó trong từng ghế của Khởi động riêng và trong Khởi động chung **bắt buộc phải được xáo trộn ngẫu nhiên** (xen kẽ Dễ, Trung bình, Khó); **tuyệt đối không xếp theo thứ tự tuyến tính dồn toàn bộ câu Dễ lên đầu rồi mới tới Trung bình và Khó**.
- **Về đích**: 26 câu (10 câu 10 điểm = Dễ, 6 câu 20 điểm = Trung bình, 10 câu 30 điểm = Khó).
- **Câu hỏi phụ (TieBreak)**: 3 câu hỏi ngắn phân định thắng thua.
- **Tránh trùng lặp câu hỏi**: Kiểm tra đối chiếu chéo nội dung câu hỏi giữa các bộ đề (`BoDe_ThiDau_*.xlsx`) và với ngân hàng câu hỏi (`kho-cau-hoi-mau.xlsx`) để đảm bảo không bị lặp câu giữa các trận.
