# 📋 MediMate AI — Trợ lý Sức khỏe & Quản lý Nhắc lịch Uống thuốc thông minh

MediMate AI là một ứng dụng trợ lý y khoa cá nhân hóa (Personal Health Agent) tích hợp trí tuệ nhân tạo (AI) giúp nhắc lịch uống thuốc, theo dõi tiến độ tuân thủ điều trị (adherence) của bệnh nhân và tự động kiểm tra tương tác thuốc an toàn thông qua dữ liệu nhãn thuốc chính thức từ **openFDA**.

Dự án này là bài tập lớn cuối khóa (Capstone Project) thuộc chương trình **Kaggle Vibe Coding — track Concierge Agents**.

---

## ✨ Tính Năng Nổi Bật

1. **Trợ lý Sức khỏe AI Đa nhiệm**: Tương tác bằng ngôn ngữ tự nhiên thông qua giao diện chat tiếng Việt cực kỳ thân thiện.
2. **Kiểm tra Tương Tác Thuốc (JSON-RPC theo mô hình MCP + OpenFDA)**: Một endpoint công cụ JSON-RPC 2.0 nội bộ (thiết kế theo mô hình Model Context Protocol – MCP: `tools/list`, `tools/call`) tự động tra cứu dữ liệu từ OpenFDA và cảnh báo tương tác chéo nguy hiểm trước khi thêm lịch uống thuốc mới.
3. **Quản lý Đơn Thuốc Bằng Hình Ảnh (OCR)**: Cho phép người dùng chụp ảnh đơn thuốc bằng camera hoặc tải ảnh lên. AI tự động trích xuất thông tin thuốc, liều lượng, tần suất và tự động lên lịch uống.
4. **Theo dõi Tỷ lệ Tuân thủ (Adherence Streak)**: Tính toán chuỗi ngày tuân thủ thực tế của người dùng dựa trên tỷ lệ uống thuốc đúng hẹn đạt trên 80% mỗi ngày.
5. **Phân hệ Quản trị Hệ thống (Admin Portal)**:
   - Dành riêng cho tài khoản quản trị (được cấp quyền qua danh sách email `ADMIN_EMAILS` phía server, mặc định `admin@medimate.ai`).
   - Tổng quan thống kê toàn hệ thống: Số người dùng, tổng số thuốc, tỷ lệ tuân thủ điều trị chung.
   - Bảng phân tích chi tiết từng bệnh nhân: Chuỗi ngày tuân thủ, số lượng thuốc và nhật ký uống thuốc hôm nay.
   - Đục sâu xem chi tiết toàn bộ lịch thuốc đã đăng ký của từng bệnh nhân.
   - Phát thông báo khẩn cấp hệ thống (System Broadcast).

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend/Backend**: Next.js (App Router), React, TailwindCSS.
- **Cơ sở dữ liệu**: Supabase (PostgreSQL) với RLS (Row Level Security) được thắt chặt.
- **AI/LLM**: `@google/genai` — mặc định dùng mô hình `gemini-2.5-flash` (có thể đổi qua biến môi trường `GEMINI_MODEL`) phục vụ trích xuất NLU, OCR và tương tác hội thoại.
- **External API**: OpenFDA (U.S. Food and Drug Administration).

---

## 📁 Cấu Trúc Dự Án

```
├── public/                 # Ảnh, biểu tượng ứng dụng
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/       # API quản trị: thống kê, danh sách bệnh nhân, tạo/xoá user
│   │   │   ├── broadcast/   # API phát/đọc thông báo hệ thống
│   │   │   ├── chat/        # API xử lý hội thoại AI, OCR và lên lịch uống thuốc
│   │   │   ├── logs/        # API truy xuất & cập nhật trạng thái uống thuốc
│   │   │   ├── mcp/         # Endpoint công cụ JSON-RPC (theo mô hình MCP) tra cứu OpenFDA
│   │   │   ├── medications/ # API CRUD đơn thuốc của bệnh nhân
│   │   │   ├── sos/         # API gửi cảnh báo cho người bảo hộ (Resend / mô phỏng)
│   │   │   └── stats/       # API tính chuỗi ngày tuân thủ (streak) thực tế
│   │   ├── admin,schedule,stats,chat/ # Route rút gọn, redirect về tab tương ứng ở trang chính
│   │   ├── globals.css     # Định nghĩa CSS & thiết lập màu sắc giao diện
│   │   ├── layout.tsx      # Layout chính (đã chuyển ngữ sang vi)
│   │   └── page.tsx        # Dashboard chính và cửa sổ hội thoại với AI
│   ├── components/         # UI dùng chung: Chrome (header/nav/auth), Modals, types
│   ├── services/
│   │   └── medicationService.ts # Các tác vụ CRUD dữ liệu thuốc & logic chuỗi tuân thủ
│   └── utils/
│       ├── apiError.ts     # Chuẩn hoá phản hồi lỗi API (ẩn chi tiết nhạy cảm)
│       └── supabase/       # Khởi tạo Supabase Client (bảo vệ chống sập khi build static)
├── supabase/
│   ├── migrations/         # Bộ migrations tạo bảng, phân quyền và trigger
│   └── schema.sql          # Lược đồ database hoàn chỉnh của hệ thống
└── .env.example            # Biểu mẫu cấu hình biến môi trường
```

---

## ⚙️ Cấu Hình Biến Môi Trường

Tạo file `.env.local` ở thư mục gốc và nhập các khóa cấu hình sau:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
# (Tùy chọn) Đổi mô hình Gemini nếu tài khoản của bạn có model khác:
# GEMINI_MODEL=gemini-2.5-flash

# Danh sách email admin (phân tách bằng dấu phẩy) được cấp quyền vào Admin Portal.
ADMIN_EMAILS=admin@medimate.ai

# (Tùy chọn) Gửi email cảnh báo cho người bảo hộ qua Resend. Nếu bỏ trống, cảnh báo SOS
# chạy ở chế độ mô phỏng (không gửi email thật).
# RESEND_API_KEY=your_resend_api_key_here
# SOS_FROM_EMAIL=MediMate <onboarding@resend.dev>
```

> 💡 **Lưu ý**: Khóa `SUPABASE_SERVICE_ROLE_KEY` là bắt buộc để sử dụng chức năng Quản trị (Admin) nhằm truy vấn danh sách người dùng qua API của Supabase Auth. Nếu thiếu khóa này, Admin Portal sẽ hiển thị trạng thái trống trung thực (không tạo dữ liệu giả) kèm hướng dẫn cấu hình. `ADMIN_EMAILS` quyết định tài khoản nào được vào Admin Portal (kiểm tra phía server, không thể giả mạo).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Thiết lập cơ sở dữ liệu
Chạy các tệp tin SQL trong thư mục `supabase/migrations` (theo thứ tự từ `00` đến `05`) hoặc chạy file `supabase/schema.sql` trực tiếp trong trình soạn thảo SQL của Supabase Dashboard.

### 3. Khởi chạy dự án ở chế độ phát triển
```bash
npm run dev
```
Mở trình duyệt truy cập vào [http://localhost:3000](http://localhost:3000).

### 4. Build sản phẩm (Production)
```bash
npm run build
```

---

## 👥 Tài Khoản Demo Khảo Sát (1-Click Login)

Để thuận tiện cho việc chạy thử và đánh giá dự án mà không cần đăng ký tài khoản mới, hệ thống đã cài đặt sẵn 2 tài khoản demo trên cơ sở dữ liệu. Bạn có thể nhấn nút **Đăng Nhập Admin** hoặc **Đăng Nhập User** ở màn hình đăng nhập để tự động điền thông tin:

*   **Tài khoản Quản trị (Admin Account)**:
    *   **Email**: `admin@medimate.ai`
    *   **Mật khẩu**: `admin123456`
    *   *Tính năng*: Được cấp quyền truy cập **Tab Quản trị (Admin Portal)** để xem chỉ số toàn hệ thống, danh sách bệnh nhân và phát thông báo khẩn cấp.
*   **Tài khoản Bệnh nhân (Standard User)**:
    *   **Email**: `user@medimate.ai`
    *   **Mật khẩu**: `user123456`
    *   *Tính năng*: Quản lý thuốc cá nhân, đặt lịch, tương tác với AI Agent hỗ trợ phân tích đơn thuốc qua ảnh (OCR).

---

## 🔒 Kiểm Soát Bảo Mật & RLS

Hệ thống áp dụng các nguyên tắc bảo mật dữ liệu y khoa lấy cảm hứng từ HIPAA (HIPAA-inspired safeguards):
- Mọi API route phục vụ người dùng đều yêu cầu xác thực phiên đăng nhập bằng JWT cookies thông qua Supabase.
- RLS của bảng `medication_logs` được thắt chặt qua chính sách kiểm tra quyền sở hữu đối với cả `user_id` của bản ghi log lẫn `user_id` của tệp tin thuốc (`medication_id`) được tham chiếu tới, ngăn chặn tuyệt đối việc ghi đè log chéo giữa các tài khoản.
- Không ghi nhận dữ liệu y khoa nhạy cảm (PHI) ra ngoài tệp tin log hệ thống (console logs).
- API MCP giới hạn tối đa 10 loại thuốc kiểm tra tương tác cùng lúc và chặn các tên thuốc quá 100 ký tự để phòng ngừa tấn công DoS.
