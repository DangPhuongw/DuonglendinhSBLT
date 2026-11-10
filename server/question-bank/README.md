# Kho câu hỏi

Mỗi trận, server **bốc ngẫu nhiên** câu hỏi từ các file `.xlsx` trong thư mục này. Bạn chỉ cần mở file Excel
để thêm, xóa, sửa câu hỏi. Lưu file xong là trận kế tiếp dùng luôn, không cần khởi động lại server.

## Mỗi trận cần tối thiểu bao nhiêu câu

| Sheet | Cần tối thiểu | Mỗi trận bốc |
|---|---|---|
| `KhoiDong_Rieng` | 20 Dễ + 10 Trung bình | 5 ô, mỗi ô 4 Dễ + 2 Trung bình |
| `KhoiDong_Chung` | 4 Dễ + 4 Trung bình + 2 Khó | 10 câu: 4 Dễ, 4 Trung bình, 2 Khó |
| `VCNV` | 1 cụm | 1 cụm (4 hàng ngang + ô trung tâm + từ khóa) |
| `TangToc` | 4 | 4 |
| `VeDich` | 10 câu 10đ, 6 câu 20đ, 10 câu 30đ | đúng số đó (10đ = Dễ, 20đ = Trung bình, 30đ = Khó) |
| `CauHoiPhu` | 3 | 3 |

Kho càng lớn thì càng lâu mới gặp lại câu cũ. Mức tối thiểu chỉ cho ra đúng một bộ đề cố định.

## Các cột

Tên cột không phân biệt hoa thường, có dấu hay không (`Prompt` = `Câu hỏi`, `Answer` = `Đáp án`...).

| Cột | Ý nghĩa |
|---|---|
| `Prompt` | Nội dung câu hỏi |
| `OptionA` … `OptionD` | 4 phương án (chỉ Khởi động riêng và chung, trắc nghiệm) |
| `Answer` | Đáp án. Khởi động: một chữ cái A, B, C hoặc D. Các vòng khác: đáp án bằng chữ |
| `Alternatives` | Các cách viết tương đương, cách nhau bằng dấu `;` (không cần thêm bản không dấu) |
| `Difficulty` | `Dễ`, `Trung bình` (hoặc `Vừa`) hay `Khó`. **Bắt buộc** ở 2 sheet Khởi động; các sheet khác không cần |
| `Topic` | Ghi chú / chủ đề, tùy ý |
| `Skip` | Gõ `x` để tạm tắt câu hỏi mà không phải xóa |
| `Points` | Chỉ ở sheet `VeDich`: 10, 20 hoặc 30 |
| `Cluster`, `Type` | Chỉ ở sheet `VCNV` (xem dưới) |

### Sheet VCNV

Mỗi cụm gồm đúng 6 dòng có cùng mã `Cluster`: 4 dòng `Type = ROW` (hàng ngang), 1 dòng `CENTER`
(ô trung tâm), 1 dòng `OBSTACLE` (từ khóa chướng ngại vật, `Prompt` có thể để trống). Cụm thiếu hoặc
thừa dòng sẽ bị bỏ qua cả cụm.

## Độ khó

Độ khó chỉ dùng để chọn câu, **người chơi không nhìn thấy**. Số câu mỗi mức ở 3 vòng:

- **Khởi động riêng**: mỗi ô 6 câu = 4 câu Dễ + 2 câu Trung bình.
- **Khởi động chung**: 10 câu = 4 Dễ, 4 Trung bình, 2 Khó.
- Thứ tự xuất hiện được **trộn lẫn** các mức.
- **Về đích**: theo mức điểm, câu 10 điểm là Dễ, 20 điểm là Trung bình, 30 điểm là Khó (không cần cột Difficulty).

Câu Khởi động thiếu độ khó bị bỏ qua và báo lỗi. Nếu một mức độ khó không đủ số câu, trận vẫn bắt đầu
nhưng dùng bộ đề mặc định, và log báo rõ mức nào thiếu (ví dụ "Khởi động chung - Khó có 1/2").
Trong mỗi mức độ khó, câu chưa dùng được bốc trước.

## Tránh lặp câu

Server ghi nhớ câu nào đã dùng ở trận nào (file `snapshots/_question-usage.json`) và luôn ưu tiên câu
**chưa dùng / dùng lâu nhất**, nên cả kho được dùng hết một vòng rồi mới lặp. Trên Render gói free, file
này bị xóa mỗi lần deploy hoặc khởi động lại, khi đó việc ghi nhớ bắt đầu lại từ đầu.

Mã câu hỏi tự sinh từ nội dung câu hỏi, nên **sửa nội dung một câu = coi như câu mới**.

## Kiểm tra kho

```bash
npm run bank:check --workspace=server
```

In ra số câu từng vòng, lỗi từng dòng (file / sheet / dòng), và chạy thử ghép nhiều trận liên tiếp
(thêm số trận: `npm run bank:check --workspace=server -- 20`).

Dòng lỗi (thiếu đáp án, độ khó sai, đáp án trắc nghiệm không phải A–D, câu trùng...) bị bỏ qua và ghi
vào log của server, không làm hỏng cả kho. Nếu kho không đủ số câu tối thiểu, trận vẫn bắt đầu nhưng
dùng bộ đề mặc định và log báo rõ vòng nào thiếu.

## Khi chủ phòng tải file đề riêng

Bộ đề tải lên ở Sảnh chờ được giữ nguyên, không bị thay bằng đề ngẫu nhiên. Dùng cho thi chính thức.

## Xuất lại bộ đề mặc định ra Excel

```bash
npm run bank:export --workspace=server
```
