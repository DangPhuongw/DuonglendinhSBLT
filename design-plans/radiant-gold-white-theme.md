# Neo-Brutalist Vibrant Yellow & White Visual System

Written against: 19c1545884a1840c7af7d38d71ab482eb2e367dc

## Evidence chain

- Surface: `client/src/App.tsx`, `client/src/components/Navbar.tsx`, `client/src/components/Scoreboard.tsx`, `client/src/components/Lobby.tsx`
- Problem: Giao diện hiện tại đang đi theo hướng Dark Mode phẳng (`bg-slate-950`), trong khi định hướng thiết kế mới được người dùng cung cấp (qua hình ảnh tham chiếu) là phong cách **Neo-Brutalism (Neubrutalism)**:
  - Tông màu chủ đạo là **Vàng chanh / Vàng điện quang (Electric / Canary Yellow: `#E8FE36` hoặc `#FAFF00`)** phối cùng **Trắng tinh khiết (`#FFFFFF`)** và **Đen mực (`#000000`)**.
  - Đường viền đen đậm sắc nét (`border-2 border-black` / `border-[2.5px] border-black`).
  - Đổ bóng cứng hình học (Hard offset shadows, 0 blur: `box-shadow: 4px 4px 0px #000000`).
  - Nút bấm và thẻ card có hiệu ứng nhấn cơ học (Tactile press interaction: khi click thì lún xuống, triệt tiêu bóng `active:translate-x-1 active:translate-y-1 active:shadow-none`).
  - Phông chữ dày, đậm (`font-black`, `font-extrabold`) với các điểm nhấn highlight màu vàng đè dưới chữ.
- Design evidence: Ảnh tham khảo từ người dùng (`media_1793904386806_b0f6e30c.jpg`) minh họa hệ thống thẻ bo góc (`rounded-2xl`), viền đen dày, bóng đổ đặc `4px 4px 0px #000`, nút bấm CTA vàng tươi nổi bật trên nền trắng/vàng chanh.
- Owner: `client/tailwind.config.js`, `client/src/index.css`, `client/src/App.tsx`, `client/src/components/Lobby.tsx`, `client/src/components/Navbar.tsx`, `client/src/components/Scoreboard.tsx`
- Scope and affected surfaces: Toàn bộ layout shell, sảnh chờ, thanh điều hướng và bảng điểm của ứng dụng client.
- Uncertainty: None.

## Design decision

Chuyển đổi toàn diện phong cách hiển thị sang **Neo-Brutalism Pop**:
1. **Bảng màu (Palette)**:
   - Màu chính (Primary Accent): Vàng chanh / Canary Yellow (`#E8FE36` hoặc `#FFE600`).
   - Nền thẻ (Surfaces): Trắng tinh (`#FFFFFF`).
   - Nền trang (App Canvas): Vàng chanh nhạt hoặc trắng ngà (`#FAF9F5` / `#EEF953`) kèm các doodle / họa tiết hình học phong cách Neo-brutalist.
   - Viền & Chữ (Lines & Typography): Đen tuyền (`#000000`), tương phản tối đa 100%.
   - Màu phụ trợ (Secondary Accents): Xanh pastel (`#A5C9FF`), Hồng đào (`#FFB5D5`), Xanh mint (`#7BF1A8`) cho các tag/badge thông tin.
2. **Hình khối & Đổ bóng (Shapes & Shadows)**:
   - Bo góc mềm vừa phải: `rounded-2xl` cho thẻ, `rounded-xl` cho nút và input.
   - Viền đen: `border-2 border-black` hoặc `border-[2.5px] border-black`.
   - Đổ bóng cứng không làm mờ: `shadow-[4px_4px_0px_#000]` cho thẻ và nút; `shadow-[2px_2px_0px_#000]` cho nhãn nhỏ.
3. **Hiệu ứng chuyển động (Tactile Micro-interactions)**:
   - Nút bấm: Bình thường có bóng `4px 4px 0px #000`. Khi hover: nhấc nhẹ `hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000]`. Khi active/click: lún xuống `active:translate-x-1 active:translate-y-1 active:shadow-none`.
   - Chuyển tiếp mượt: `transition: all 0.15s cubic-bezier(0.2, 0, 0, 1)`.

## Reuse

- `client/tailwind.config.js`: mở rộng cấu hình thêm tokens màu `neo` (`neo.yellow: '#E8FE36'`, `neo.black: '#000000'`, `neo.white: '#FFFFFF'`, `neo.blue: '#A5C9FF'`) và cấu hình bóng cứng `boxShadow: { 'neo': '4px 4px 0px 0px #000', 'neo-sm': '2px 2px 0px 0px #000', 'neo-lg': '6px 6px 0px 0px #000' }`.
- Exemplar: Nút CTA vàng "Start Now!" và thẻ "NFT Pack" trong ảnh mẫu của người dùng (`media_1793904386806_b0f6e30c.jpg`).

## Changes

1. `client/tailwind.config.js`
   - Change: Bổ sung theme mở rộng cho Neo-Brutalism:
     - `colors.neo`:
       - `yellow`: `#E8FE36` (vàng chanh rực rỡ đặc trưng)
       - `yellowDark`: `#D6EC24`
       - `black`: `#000000`
       - `white`: `#FFFFFF`
       - `blue`: `#A5C9FF`
       - `pink`: `#FFB5D5`
       - `green`: `#7BF1A8`
     - `boxShadow`:
       - `neo`: `4px 4px 0px 0px #000000`
       - `neo-sm`: `2px 2px 0px 0px #000000`
       - `neo-lg`: `6px 6px 0px 0px #000000`
       - `neo-hover`: `6px 6px 0px 0px #000000`
   - Preserve: Toàn bộ content scan paths.
   - Verify: Tailwind sinh đúng các utility classes `bg-neo-yellow`, `shadow-neo`, `border-neo-black`.

2. `client/src/index.css`
   - Change: Định nghĩa các class CSS chuẩn phong cách Neo-Brutalism:
     - `.btn-neo`: Nút bấm với viền đen `2.5px`, bóng cứng `4px 4px 0px #000`, hiệu ứng nhấc khi hover và lún khi click (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).
     - `.card-neo`: Thẻ nền trắng với viền đen `2.5px`, bo góc `rounded-2xl`, bóng cứng `shadow-[4px_4px_0px_#000]`.
     - `.badge-neo`: Nhãn bo viền đen nhỏ với bóng `2px 2px 0px #000`.
   - Preserve: `@keyframes pulse-ring` và class `.buzzer-active` để nút chuông vẫn rung đập đúng nhịp.
   - Verify: Các class tiện ích hiển thị chính xác theo mẫu thiết kế.

3. `client/src/App.tsx`
   - Change:
     - Đổi nền toàn cục từ `bg-slate-950 text-white` sang nền sáng trẻ trung:
       - `bg-[#EEF953] text-black` hoặc `bg-[#FAFAFA] text-black` với các mảng vàng chanh rực rỡ và họa tiết sao / tia chớp kiểu doodle.
     - Thanh tua vòng thi ở góc phải: thiết kế dạng hộp trắng viền đen dày, bóng cứng `shadow-neo`, các nút tròn/bo góc với màu sắc pop (vàng `#E8FE36`, xanh dương pastel `#A5C9FF`, xanh mint `#7BF1A8`).
   - Preserve: Logic chuyển đổi vòng thi `renderCurrentView()`, kết nối Socket và ErrorBoundary.
   - Verify: Toàn bộ app mang không khí vui tươi, tươi sáng, pop art và năng lượng cao.

4. `client/src/components/Navbar.tsx`
   - Change:
     - Header đổi thành `bg-white border-b-3 border-black px-4 py-3 shadow-[0_4px_0px_#000] text-black`.
     - Logo: Hộp vuông vàng chanh viền đen đậm `w-9 h-9 rounded-xl bg-[#E8FE36] border-2 border-black flex items-center justify-center font-black text-black shadow-neo-sm`.
     - Chữ thương hiệu: "OLYMPIA NỘI BỘ" với font chữ siêu đậm đen tuyền `font-black text-black tracking-tight`.
     - Mã phòng: Hộp nền trắng viền đen bo góc với nút copy nảy cơ học.
     - Nút âm thanh, giọng đọc: Đổi sang nút vuông bo góc `rounded-xl border-2 border-black bg-white hover:bg-slate-100 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-black`.
   - Preserve: Logic clipboard, toggle âm thanh và toggle giọng đọc TTS.
   - Verify: Navbar sắc sảo, nổi bật các khối viền đen và nền vàng chanh.

5. `client/src/components/Lobby.tsx`
   - Change:
     - Khối tạo/vào phòng: Thẻ bọc trắng `bg-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_#000]`.
     - Tiêu đề "OLYMPIA NỘI BỘ": Phông đen đậm với dải highlight màu vàng chanh vắt ngang phía dưới (như mẫu *Item's* trong ảnh tham chiếu).
     - Ô nhập tên và mã phòng: `bg-white border-2 border-black rounded-xl text-black font-bold placeholder-slate-400 shadow-[3px_3px_0px_#000] focus:shadow-[4px_4px_0px_#000] focus:outline-none`.
     - Nút "Tạo phòng mới": Nút lớn màu vàng chanh `#E8FE36` viền đen dày, chữ đen đậm `font-black`, bóng đen `4px 4px 0px #000`, có animation nhấn cơ học.
     - Thẻ 5 ghế người chơi:
       + Ghế trống: Thẻ viền nét đứt đen `border-2 border-dashed border-black/50 bg-slate-50 rounded-2xl`.
       + Ghế đã có người: Thẻ trắng viền đen `bg-white border-2 border-black rounded-2xl shadow-neo`.
       + Ghế của bạn (isMe): Thẻ nền vàng chanh `#E8FE36` viền đen dày `border-3 border-black rounded-2xl shadow-neo font-black`.
       + Huy hiệu số ghế: Vòng tròn viền đen nền vàng chanh hoặc trắng.
     - Khối điều khiển Host: Thẻ bọc trắng viền đen dày, nút nạp file và nút "Bắt đầu trận đấu" rực rỡ với màu vàng chanh, bóng cứng.
   - Preserve: Logic nạp bộ đề Excel/JSON, trạng thái kiểm tra đủ người chơi, thao tác kick người chơi.
   - Verify: Sảnh chờ biến hóa hoàn toàn theo phong cách Neubrutalism chuẩn xác theo ảnh mẫu.

6. `client/src/components/Scoreboard.tsx`
   - Change:
     - Thanh bảng điểm trên cùng: Nền trắng viền đen `border-b-2 border-black bg-white py-2`.
     - Các thẻ điểm của 5 ghế:
       + Thẻ nền trắng viền đen `border-2 border-black rounded-xl shadow-neo-sm`.
       + Thẻ người chơi đang trả lời (Active): Nền vàng chanh `#E8FE36` viền đen `border-2 border-black shadow-neo scale-[1.02]`.
       + Điểm số: Chữ số đen tuyền font mono đậm `font-black text-black text-lg`.
   - Preserve: Hiển thị biểu tượng Ngôi sao hy vọng, vương miện Host, trạng thái mất kết nối.
   - Verify: Bảng điểm trực quan, các con số nổi bật và dễ đọc từ xa.

## Scope

- Inherit: Shell chính (`App.tsx`), sảnh chờ (`Lobby.tsx`), thanh điều hướng (`Navbar.tsx`), bảng điểm (`Scoreboard.tsx`).
- Verify: Các màn chơi chính (`CountdownTimer.tsx`, `KhoiDongRound.tsx`, `VcnvRound.tsx`, `TangTocRound.tsx`, `VeDichRound.tsx`, `Podium.tsx`).
- Exclude: Backend Socket events, câu hỏi và thuật toán tính điểm.

## Validation

- Product: Giao diện chuyển thành phong cách Neo-Brutalism: nền sáng rực rỡ, thẻ trắng, viền đen dày, bóng cứng không blur, các nút bấm vàng chanh nảy và lún cơ học khi click.
- Interface: Kiểm tra độ hiển thị trên Desktop & Mobile, kiểm tra tương tác hover và active/press của mọi nút và thẻ card.
- System: Đảm bảo bóng cứng và border không làm vỡ bố cục grid responsive.
- Repository: `npm --prefix client run build` → Biên dịch thành công không lỗi.

## Stop conditions

- Stop if cấu trúc state hoặc các sự kiện Socket bị gián đoạn.

## Design documentation

- After acceptance and validation: Ghi nhận phong cách Neo-Brutalism (Màu vàng chanh `#E8FE36`, viền đen `border-black`, bóng `shadow-neo`) vào `DESIGN.md`.
