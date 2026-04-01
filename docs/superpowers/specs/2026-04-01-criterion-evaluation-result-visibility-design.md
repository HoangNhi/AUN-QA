# Criterion Evaluation Result Visibility Design

## Context

Trang `CriterionEvaluation` hiện có hai vấn đề UX:

1. Khi tiêu chí đã được duyệt, người dùng không phải Chủ tịch/Phó chủ tịch không thấy được khu vực thể hiện kết quả chốt cuối, nên khó hiểu trạng thái thực tế của tiêu chí.
2. Ở grid ngoài trang, cột cuối đang thiên về cách gọi "Điểm" (AUN), trong khi với MOET cần hiển thị rõ dạng kết quả `ĐẠT/KHÔNG ĐẠT`.

Mục tiêu là hiển thị kết quả chốt cuối cho tất cả vai trò theo cách nhất quán giữa popup và grid, nhưng vẫn giữ phân quyền thao tác duyệt.

## Goals

- Mọi người dùng đều nhìn thấy kết quả cuối sau khi tiêu chí đã duyệt.
- Chỉ Chủ tịch/Phó chủ tịch mới có quyền thao tác chốt khi chưa duyệt.
- Grid hiển thị theo ngôn ngữ "Kết quả" nhất quán cho cả AUN và MOET.
- Không thay đổi API contract hiện có nếu dữ liệu đã đủ (`OfficialScore`, `OfficialResult`, `Status`, `framework`).

## Non-Goals

- Không thay đổi luồng nghiệp vụ duyệt backend.
- Không bổ sung metadata mới (ai duyệt, thời điểm duyệt) trong phạm vi thay đổi này.
- Không refactor lớn các component ngoài phạm vi `CriterionEvaluation`.

## Current State Summary

- `CriterionPopup` hiện chỉ render card `Chốt & Phê duyệt` khi `canApprove === true`.
- Người không có quyền duyệt không có bề mặt UI để thấy kết quả chốt cuối.
- `CriteriaGrid` đã có nhánh hiển thị MOET theo `OfficialResult`, nhưng cần chuẩn hóa cột "Kết quả" làm tên cột chính và đảm bảo hành vi nhất quán.
- `framework` tại page đã được tính theo `effectiveEvaluationMode` để ưu tiên mode từ popup khi popup mở.

## Proposed UX and Behavior

### 1. Popup Approval Card: always visible, role-dependent actions

Card `Chốt & Phê duyệt` sẽ luôn xuất hiện cho mọi vai trò, với 3 state:

1. `isApproved === true`:
- Hiển thị trạng thái `Đã duyệt`.
- Hiển thị kết quả chốt cuối:
  - AUN: `x/7` (kèm label mức điểm nếu có).
  - MOET: `ĐẠT` hoặc `KHÔNG ĐẠT`.
- Không hiển thị control chỉnh sửa cho mọi vai trò.

2. `isApproved === false && canApprove === true`:
- Giữ nguyên control chọn điểm/kết quả + nút `Duyệt`.
- Hành vi submit approval giữ nguyên.

3. `isApproved === false && canApprove === false`:
- Hiển thị read-only message: `Đang chờ Chủ tịch/PCT chốt kết quả`.
- Không có input/button thao tác.

Fallback hiển thị:
- Nếu `isApproved === true` nhưng thiếu dữ liệu kết quả hợp lệ, hiển thị `Đã duyệt (chưa có kết quả)` để tránh hiểu nhầm.

### 2. Grid Column: unified "Kết quả"

- Header cột cuối luôn là `Kết quả`.
- Cell hiển thị:
  - AUN: `OfficialScore/7` khi đã duyệt và có điểm.
  - MOET: badge/text `ĐẠT` hoặc `KHÔNG ĐẠT` theo `OfficialResult`.
  - Trường hợp khác: `—`.

## Component-Level Design

## `CriterionPopup.tsx`

- Bỏ điều kiện bọc toàn bộ card bằng `canApprove`.
- Tách logic hiển thị card theo state:
  - Approved summary block (mọi vai trò).
  - Approver action block (chỉ approver khi chưa duyệt).
  - Non-approver pending block (read-only khi chưa duyệt).
- Dùng lại state `officialScore`, `officialResult` và `framework` hiện có.
- Thêm helper hiển thị kết quả cuối để giảm lặp điều kiện.

## `CriteriaGrid.tsx`

- Đổi label cột cuối thành `Kết quả` cố định.
- Duy trì logic `OfficialScoreCell` cho AUN/MOET và chuẩn hóa presentation text (uppercase cho MOET).

## Data Flow

- Nguồn trạng thái duyệt: `item.Status`.
- Nguồn kết quả cuối:
  - AUN: `item.OfficialScore`.
  - MOET: `item.OfficialResult`.
- Nguồn framework: prop `framework` từ `CriterionEvaluationPage`.
- Không thêm query mới; tận dụng dữ liệu popup/list hiện có.

## Error Handling and Edge Cases

- `Status=Approved` nhưng thiếu `OfficialScore/OfficialResult`: hiển thị fallback text thay vì dấu `—` mơ hồ trong popup.
- Khi đổi framework theo chu kỳ/popup, UI render theo `framework` hiện tại và không cho thao tác sai role.
- Khi dữ liệu popup đang fetching, phần card vẫn render theo dữ liệu item hiện tại; tránh nhấp nháy layout.

## Testing Strategy

### Manual Test Matrix

1. AUN + Approver + Not Approved:
- Thấy control chốt điểm, duyệt được.

2. AUN + Non-approver + Not Approved:
- Thấy card read-only "đang chờ chốt", không có control.

3. AUN + Any role + Approved:
- Thấy kết quả chốt cuối dạng `x/7` trong popup.
- Grid cột `Kết quả` hiển thị `x/7`.

4. MOET + Approver + Not Approved:
- Thấy dropdown `ĐẠT/KHÔNG ĐẠT`, duyệt được.

5. MOET + Non-approver + Not Approved:
- Thấy card read-only "đang chờ chốt", không có control.

6. MOET + Any role + Approved:
- Popup hiển thị `ĐẠT` hoặc `KHÔNG ĐẠT`.
- Grid cột `Kết quả` hiển thị `ĐẠT/KHÔNG ĐẠT`.

### Regression Checks

- Không ảnh hưởng form submit cá nhân.
- Không ảnh hưởng panel hội đồng đã nộp.
- Không ảnh hưởng logic mở popup và framework mapping hiện tại.

## Implementation Scope

- `AUN-QA.Web/src/features/business/routes/CriterionEvaluation/components/CriterionPopup.tsx`
- `AUN-QA.Web/src/features/business/routes/CriterionEvaluation/components/CriteriaGrid.tsx`

## Rollout Notes

- Đây là thay đổi UI/UX và conditional rendering, rủi ro nghiệp vụ thấp.
- Có thể triển khai trong một PR nhỏ với manual test theo matrix ở trên.
