# Compact Single-Screen Layout and Visual De-Cluttering for VCNV Round

Written against: fe42151ff105beddce3bea6a853f41537c38921d

## Evidence chain

- Surface: `client/src/components/VcnvRound.tsx` rendered during VCNV round gameplay (`PICK_ROW`, `ROW_QUESTION`, `ROW_REVEAL`, `CENTER_QUESTION`).
- Problem: As directly evidenced in user screenshot `media_1793908705260_3de407b5.png`, the VCNV round exceeds the viewport height (> 1080px), forcing contestants to scroll down to view the question and submit their answer during time-sensitive 15s answering phases. Additionally, the interface suffers from high cognitive clutter ("quá nhiều điểm để nhìn") with redundant instructional text, a 5-box tutorial points ladder, multiple repetitive footers, and a duplicated phase banner.
- Design evidence:
  - Rendered screenshot `media_1793908705260_3de407b5.png` showing 6 stacked vertical blocks pushing the Question Card off-screen.
  - Neo-Brutalism Design Specification: Desktop canvas target 1440 × 900px and 1280 × 800px; clean white background `#FFFDF7`, primary yellow `#FFE45C`, crisp `#171717` borders.
  - Real-time competition UX requirement: Contestants must observe the question prompt, time remaining, and answer input field in one unified, un-scrolled viewport.
- Owner: `client/src/components/VcnvRound.tsx`
- Scope and affected surfaces:
  - `client/src/components/VcnvRound.tsx` (primary surface)
  - `client/src/components/Scoreboard.tsx` (compact padding for vertical budget)
- Uncertainty: None.

## Design decision

Re-architect the VCNV screen into a zero-scroll single viewport hierarchy (total height under 720px) and eliminate visual noise:

1. **Remove redundant instructional text & tutorial widgets**:
   - Eliminate the 5-box static ladder (`60 ĐIỂM Sau câu 1`, `50 ĐIỂM Sau câu 2`, etc.). During gameplay, the contestant only needs to know the *current* reward, which is already dynamically shown (`+50đ`).
   - Remove redundant footer text captions: `"4 từ hàng ngang (4 gợi ý) • Gợi ý thứ 5..."` and `"Mỗi hàng ngang giải đúng sẽ mở 1 góc hình ảnh tương ứng"`.
   - Remove the standalone subphase banner (`⚡ HÀNG NGANG SỐ 1 - TẤT CẢ THÍ SINH CÙNG TRẢ LỜI TRONG 15 GIÂY!`), as this information is already co-located in the Question Card header and the countdown timer.

2. **Consolidate the Main Keyword Bar**:
   - Instead of a standalone 220px card, merge the Main Keyword title, the N letter boxes `[?][?][?][?][?][?][?]`, the current points badge, and the CNV Buzzer button into a single sleek horizontal banner (~54px height).

3. **Symmetrize & Compact the 2-Column Game Board**:
   - Left column (4 Rows): Compact row paddings (`py-1.5 px-3`), letter box sizes (`w-5 h-5` to `w-6 h-6`), and display row status cleanly.
   - Right column (5-Piece Image): Constrain image aspect ratio to fit the exact height of the 4 rows (~210px), removing empty margins and decorative clutter.

4. **Elevate Question Answering Prominence**:
   - Position the Question Card directly beneath the game board with tight padding (`p-4`), concise heading, clear question prompt, and an inline horizontal form (`[Input field] [Nút Gửi]`).
   - Total stacked vertical height: Navbar (54px) + Scoreboard (54px) + Header/Timer (40px) + Keyword Bar (52px) + Game Board (210px) + Question Card (130px) = **~540px**, guaranteeing zero scroll even on 1280x800 and 1366x768 screens.

## Reuse

- Tokens: `bg-white`, `bg-[#FFFDF7]`, `bg-[#FFE45C]`, `border-2 border-[#171717]`, `shadow-neo-sm`, `shadow-neo`, `tabular-nums`.
- Primitives: `CountdownTimer`, `QuestionSpeakerButton`.
- Exemplar: [client/src/components/Scoreboard.tsx](file:///d:/IT%20PROJECT/DuonglendinhSBLT/client/src/components/Scoreboard.tsx)

## Changes

1. `client/src/components/VcnvRound.tsx`
   - Change:
     - Replace the multi-level Keyword Card with a single-line horizontal card containing: Keyword Title, N letter boxes, current points badge (`+50đ`), and CNV buzzer trigger button.
     - Remove the 5-box point ladder (`grid-cols-5` block) and the 3 disclaimer paragraphs.
     - Remove the redundant `⚡ HÀNG NGANG SỐ 1...` subphase banner block.
     - Reduce padding and row heights in the 4 Rows container (`p-3`, row `p-2`, letter boxes `w-6 h-6`).
     - Constrain 5-piece image wrapper with `h-[210px]` and `object-contain`/`object-cover` so it matches the 4-row height exactly without pushing content down.
     - Compact the Question Card: Reduce padding to `p-4`, tighten prompt font size to `text-base font-black`, and place input + submit button on a single compact row.
   - Preserve:
     - All socket action handlers: `buzz()`, `submitAnswer()`, `pickVcnvRow()`, keyboard listener (Space for buzzer, 1-4 for row pick).
     - Full modal behavior for CNV buzzer winner (`CNV_ANSWERING`).
     - Reveal results logic and player answer list.
   - Verify:
     - All elements fit inside a standard 900px/800px window without vertical scrollbar.
     - Time to locate the question and submit an answer is immediate with zero scrolling required.

2. `client/src/components/Scoreboard.tsx`
   - Change:
     - Compact vertical padding from `p-3` to `py-2 px-3`.
     - Compact seat card inner padding from `p-3` to `py-1.5 px-3` and font sizes so the entire scoreboard occupies ≤ 60px height.
   - Preserve:
     - 5 seat slots, active player highlight, host crown icon, tabular scores.
   - Verify:
     - Header area takes minimal vertical footprint, maximizing room for gameplay.

## Scope

- Inherit: `client/src/components/VcnvRound.tsx`, `client/src/components/Scoreboard.tsx`.
- Verify: VCNV subphases (`PICK_ROW`, `ROW_QUESTION`, `ROW_REVEAL`, `CNV_ANSWERING`).
- Exclude: Backend socket events, game rules, scoring logic, other round layouts.

## Validation

- Product: Contestants participate in VCNV round with complete visibility of timer, keyword, board, question, and answer input in a single view without any scrolling.
- Interface: Tested at 1440 × 900, 1280 × 800, and 1366 × 768. No vertical scrollbar appears during `ROW_QUESTION` phase.
- System: Strict adherence to Neo-Brutalism White & Yellow design tokens (`#FFFDF7`, `#FFE45C`, `#171717`, `shadow-neo`).
- Repository: `npm --prefix client run build` → exit code 0.

## Stop conditions

- Stop if game state requirements mandate displaying historical round points table during gameplay.
- Stop if image aspect ratio cannot be constrained without distorting custom uploaded VCNV images.

## Design documentation

- After acceptance and validation: Record the single-viewport vertical budget guideline (≤ 720px for gameplay canvas) in `DESIGN.md`.
