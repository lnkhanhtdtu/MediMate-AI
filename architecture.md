# 🏛️ Tài liệu Kiến trúc Hệ thống — MediMate AI

Tài liệu này mô tả chi tiết kiến trúc phần mềm, mô hình dữ liệu, các luồng nghiệp vụ cốt lõi (luồng chẩn đoán và kiểm tra tương tác thuốc) và cơ chế bảo mật thông tin y khoa của hệ thống MediMate AI.

---

## 1. Tổng quan Kiến trúc

MediMate AI được thiết kế theo mô hình **Next.js App Router** kết hợp với kiến trúc **Bảo mật Cơ sở dữ liệu Phân tán (Supabase BaaS)**. Toàn bộ nghiệp vụ nghiệp vụ được đóng gói dưới dạng các Serverless API Routes được bảo vệ bởi lớp Supabase Auth Middleware.

```mermaid
graph TD
    Client[Next.js Client UI] -->|1. Gửi tin nhắn / Ảnh OCR| ChatAPI[/api/chat]
    Client -->|4. Cập nhật uống thuốc| LogsAPI[/api/logs]
    ChatAPI -->|2. Tra cứu dữ liệu nhãn| MCP[/api/mcp]
    MCP -->|Gọi API ngoài| OpenFDA[openFDA API]
    ChatAPI -->|3. Phân tích tương tác| Gemini[Google Gemini 3.1 Flash-Lite]
    ChatAPI -->|Lưu đơn thuốc| DB[(Supabase DB)]
    LogsAPI -->|Ghi nhật ký uống| DB
```

---

## 2. Luồng Nghiệp vụ Trọng yếu

### A. Luồng Thêm Thuốc & Kiểm tra Tương tác (Intake & Safe Interaction Checker)

Khi người dùng gửi yêu cầu thêm thuốc mới (bằng văn bản chat hoặc ảnh đơn thuốc):
1. **Intake Agent**: Gemini trích xuất thông tin thuốc (`name`, `dosage`, `frequency`, `schedule`, `total_stock`, `dosage_quantity`).
2. **Retrieve Current Drugs**: Hệ thống tải danh sách các thuốc bệnh nhân đang uống từ Supabase.
3. **MCP Query**: 
   - Điểm cuối `/api/chat` gọi POST nội bộ tới điểm cuối MCP Server `/api/mcp`.
   - MCP Server sử dụng `AbortSignal.timeout(8000)` để truy vấn thông tin tương tác từ API OpenFDA Hoa Kỳ.
4. **Interaction Checker Agent**:
   - Nhận báo cáo nhãn thô từ MCP.
   - Sử dụng Gemini phân tích các cảnh báo tương tác chéo giữa thuốc mới sắp thêm và các thuốc cũ.
   - Nếu phát hiện tương tác nguy cơ mức độ **High** hoặc **Medium**, hệ thống dừng quá trình và trả về phản hồi `WARNING_INTERACTION` kèm hướng dẫn tiếng Việt. Bệnh nhân có quyền hủy bỏ hoặc chấp nhận rủi ro để ghi lại lịch.

### B. Luồng Tính toán Chuỗi Tuân thủ (Adherence Streak Calculation)

Tỷ lệ tuân thủ điều trị thực tế (Adherence Rate) được tính tự động qua API `/api/stats` và phương thức `getComplianceStreak()`:
- Quét toàn bộ nhật ký uống thuốc trong vòng 30 ngày gần nhất.
- Gom nhóm theo ngày (định dạng `YYYY-MM-DD`).
- Một ngày được tính là **ĐẠT** nếu tỷ lệ lượt thuốc đã uống (trạng thái `taken`) trên tổng lượt thuốc phải uống trong ngày đó đạt từ **80% trở lên**.
- Chuỗi ngày liên tục (streak) bắt đầu đếm lùi từ ngày hôm nay (hoặc hôm qua nếu hôm nay chưa đến giờ uống thuốc hoặc chưa uống đủ nhưng còn các lượt thuốc chờ trong ngày).

---

## 3. Chính sách Bảo mật Dữ liệu Y khoa (HIPAA Compliance & Security)

Để bảo đảm tính bảo mật của thông tin y khoa cá nhân, MediMate AI áp dụng các biện pháp sau:

1. **Row Level Security (RLS) ở mức Database**:
   - Bảng `medications` chỉ cho phép người sở hữu (dựa trên `auth.uid() = user_id`) thao tác CRUD.
   - Bảng `medication_logs` áp dụng chính sách RLS thắt chặt ở hành vi `INSERT`, ngăn chặn chéo việc gán log vào thuốc của người dùng khác:
     ```sql
     WITH CHECK (
         auth.uid() = user_id
         AND EXISTS (
             SELECT 1 FROM public.medications
             WHERE id = medication_id AND user_id = auth.uid()
         )
     )
     ```
2. **Bảo vệ Điểm cuối MCP Server**:
   - Endpoint `/api/mcp` yêu cầu xác thực người dùng thông qua Supabase Auth Session Cookie được truyền từ route `/api/chat`. Chặn hoàn toàn các truy cập ẩn danh ngoài hệ thống.
3. **Chặn Rò rỉ Dữ liệu Nhạy cảm (No PHI Leak)**:
   - Nghiêm cấm ghi dữ liệu y khoa của bệnh nhân ra console log của máy chủ (ví dụ: `console.log` dữ liệu đơn thuốc hoặc thông tin log uống thuốc).

---

## 4. Phân hệ Quản trị (Admin Panel Layout & RBAC)

Hệ thống phân quyền truy cập thông qua email người dùng (kiểm tra email chứa từ khóa `admin` hoặc có định dạng `admin@medimate.ai`).
- **Admin API (`/api/admin/users`)**: Khởi tạo Supabase client sử dụng khóa `SUPABASE_SERVICE_ROLE_KEY` giúp bypass chính sách RLS để thu thập dữ liệu thống kê tổng thể toàn hệ thống và hiển thị danh sách người dùng kèm chuỗi ngày tuân thủ thực tế của họ.
- **Mock Fallback**: Nếu hệ thống phát hiện không có biến môi trường `SUPABASE_SERVICE_ROLE_KEY` tại máy chủ cục bộ (preview mode), API sẽ trả về dữ liệu Mock chi tiết của 3 bệnh nhân ảo để người dùng trải nghiệm giao diện quản trị đầy đủ tính năng.

---

## 5. Loại trừ Thư mục ADK & Workspace Customizations

Để tránh gây nhiễu cho các tiến trình build và kiểm tra cú pháp (TypeScript linting, package bundling), hãy bảo đảm các thư mục cấu hình hỗ trợ lập trình sau đây được đưa vào danh sách loại trừ (exclude/ignore):
- Thư mục cấu hình toàn cục `.gemini/`
- Thư mục tùy biến dự án `.agents/`
- Các tệp tin markdown tạm thời trong thư mục artifacts của AppData.
