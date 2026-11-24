# Ôn tập phỏng vấn: dự án Olympia Nội Bộ

Mục tiêu: trả lời trôi chảy từng câu dưới đây trong 1–2 phút, **không nhìn tài liệu**. Đọc phần trả lời, mở đúng file code để thấy tận mắt, rồi tự nói lại bằng lời của mình.

---

## 1. Năm người bấm chuông cùng lúc, server chọn người thắng thế nào?

**Trả lời ngắn:** Node.js chạy JavaScript trên một luồng duy nhất, nên hai sự kiện không bao giờ được xử lý cùng một lúc mà luôn có thứ tự. Thêm vào đó, mọi sự kiện của một phòng đều được xếp vào `EventQueue`, một hàng đợi chạy tuần tự từng việc một, kể cả các việc có `await`. Sự kiện bấm chuông nào vào hàng đợi trước thì được xử lý trước. Người đầu tiên đặt `buzzedPlayerId`, những người đến sau thấy chuông đã có chủ nên bị từ chối.

**Xem code:**
- `server/src/game/EventQueue.ts`: hàng đợi chỉ chạy việc kế tiếp khi việc trước đã xong.
- `server/src/index.ts`: sự kiện bấm chuông được bọc trong `machine.eventQueue.enqueue(...)`.
- `RoomStateMachine.handleBuzzer`: `if (this.buzzedPlayerId) return false;`
- `server/test/concurrencyBuzzer.test.ts`: 5 bot bấm đồng thời 100 lần, luôn đúng 1 người thắng.

**Câu hỏi đào sâu có thể gặp:**
- *"Người ở gần server có lợi thế không?"* Có. Ai có mạng nhanh hơn thì sự kiện tới trước. Muốn công bằng tuyệt đối thì phải lấy thời điểm bấm ở client rồi trừ độ lệch đồng hồ, nhưng như vậy lại phải tin client. Dự án chọn tin server.
- *"Chạy nhiều server thì sao?"* Khi đó mỗi server có hàng đợi riêng, cần một khóa dùng chung như Redis (`SET key value NX`) hoặc đưa mọi sự kiện của một phòng về đúng một server.

---

## 2. Vì sao thí sinh không gian lận được thời gian?

**Trả lời ngắn:** Đồng hồ thật nằm ở server. Khi bắt đầu một câu, server ghi `deadline = bây giờ + thời gian làm bài` và tự hẹn giờ. Khi nhận bài nộp, server so với giờ của chính nó: trễ quá `deadline + 300 ms` thì từ chối. 300 ms là phần bù cho độ trễ mạng. Đồng hồ trên màn hình chỉ để hiển thị, sửa code trình duyệt cũng không thay đổi được kết quả.

**Xem code:**
- `RoomStateMachine.setDeadline` (khoảng dòng 286)
- `RoomStateMachine.submitAnswer`: `if (deadline && now > deadline + GAME_CONFIG.NETWORK_GRACE_MS) return false;`
- `shared/src/config.ts`: `NETWORK_GRACE_MS: 300`
- Sự kiện `time:ping` / `time:pong` trong `index.ts`: client đo độ lệch giờ với server để đồng hồ trên màn hình chạy khớp.

---

## 3. Đáp án được giấu khỏi client ở đâu?

**Trả lời ngắn:** Server giữ câu hỏi đầy đủ, có đáp án. Mỗi lần gửi trạng thái phòng xuống client, server gọi `getSanitizedRoom()`. Hàm này dựng lại câu hỏi mà chỉ giữ các trường được phép xem (nội dung, phương án, thời gian, điểm) và bỏ `answer`, `alternatives`. Đáp án chỉ được gửi ở bước công bố.

**Xem code:** `RoomStateMachine.getSanitizedRoom` (khoảng dòng 234). Cách làm này gọi là *allowlist*: chỉ chọn những trường được gửi, thay vì xóa từng trường không được gửi. Nhờ vậy sau này thêm trường mới cũng không vô tình làm lộ.

---

## 4. Tải lại trang sao vẫn vào lại đúng ghế?

**Trả lời ngắn:** Khi vào phòng, mỗi người nhận một `token` ngẫu nhiên, lưu ở localStorage. Tải lại trang, client gửi `room:rejoin` kèm mã phòng và token. Server tìm người chơi có token đó, gắn kết nối mới vào, và cho kết nối cũ rời phòng để không nhận tin trùng. Token không bao giờ được gửi cho người chơi khác.

**Xem code:** `index.ts` (`room:rejoin`), `RoomStateMachine.handleReconnect`, `toPublicPlayers` (bỏ token trước khi gửi danh sách người chơi), `server/test/tokenPrivacy.test.ts`.

---

## 5. Server khởi động lại giữa trận thì sao?

**Trả lời ngắn:** Server gọi `persistSnapshot()` để `SnapshotManager` ghi phòng và bộ đề ra file trong thư mục `snapshots/`. Lúc khởi động, `RoomManager` đọc lại các file này và dựng lại phòng. Người chơi kết nối lại bằng token như câu 4.

**Điểm yếu nên tự nói ra trước:** dữ liệu nằm trên đĩa của một máy. Deploy trên dịch vụ có ổ đĩa tạm (như Render bản miễn phí) thì khởi động lại có thể mất hết. Bản nâng cấp là lưu vào Redis hoặc PostgreSQL.

---

## 6. Vì sao phải chuẩn hóa NFC/NFD khi so đáp án tiếng Việt?

**Trả lời ngắn:** Một chữ như "ệ" có thể được lưu theo hai cách: một ký tự dựng sẵn (NFC), hoặc chữ "e" cộng các dấu tách rời (NFD). Unikey trên Windows, macOS và điện thoại không gõ ra giống nhau, nên nhìn giống nhau mà so `===` vẫn sai. `normalizeAnswer` đưa tất cả về NFC, bỏ khoảng trắng thừa, viết hoa; với câu cho phép không dấu thì chuyển sang NFD rồi xóa dấu.

**Xem code:** `shared/src/answerMatcher.ts`, `server/test/answerMatcher.test.ts`.

---

## Câu hỏi "nếu…" hay gặp

| Câu hỏi | Ý trả lời |
|---|---|
| Có 1.000 phòng cùng lúc thì sao? | Hiện chạy một tiến trình, giữ mọi phòng trong RAM. Muốn scale: nhiều server + Redis adapter cho Socket.IO, sticky session hoặc chia phòng theo server, chuyển snapshot sang Redis. |
| Vì sao không dùng database? | Một trận chỉ dài khoảng 30 phút, dữ liệu sống ngắn. RAM + snapshot là đủ cho quy mô hiện tại. Nếu cần lịch sử người chơi hay bảng xếp hạng lâu dài thì thêm PostgreSQL. |
| `RoomStateMachine.ts` dài hơn 3.000 dòng, có vấn đề gì không? | Có: khó đọc, khó test riêng từng vòng. Hướng tách: mỗi vòng thi một class riêng theo cùng một interface (Strategy pattern), state machine chỉ điều phối chuyển vòng. |
| Bạn dùng AI tới đâu? | Nói thật. Ví dụ: "Em dùng AI để tăng tốc viết code, nhưng em đọc, chạy thử và tự sửa từng phần; em giải thích được các cơ chế chính như bấm chuông, đồng hồ, giấu đáp án." Câu này chỉ đúng khi bạn đã làm được mọi thứ trong file này. |
