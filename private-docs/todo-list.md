## **MediMate AI**

---

### 🧱 GIAI ĐOẠN 1: THIẾT LẬP HẠ TẦNG & PHÁT TRIỂN CÔNG CỤ (DAY 1 & DAY 2)

* [x] **1. Khởi tạo Kho mã nguồn mở bảo mật trên GitHub**
  * **Nhiệm vụ:** Tạo Public Repository tên `MediMate-AI`. Thêm file `LICENSE` (chọn MIT License theo quy định mã nguồn mở bắt buộc của cuộc thi). Tạo file `.gitignore` để chặn đẩy các file cấu hình chứa mã bảo mật lên Internet.
  * **Trạng thái:** Hoàn tất. Repo đã sẵn sàng để commit.

* [x] **2. Xây dựng MCP Server làm "Hộp lưu trữ" lịch thuốc**
  * **Nhiệm vụ:** Viết mã nguồn cho một MCP (Model Context Protocol) Server cục bộ chạy bằng Python/HTTP. Định nghĩa các công cụ định dạng chuẩn (`Tools`) như: `check_drug_interaction` tích hợp trực tiếp openFDA y khoa.
  * **Trạng thái:** Hoàn tất. Được đóng gói thành API route `/api/mcp` nội bộ của Next.js với đầy đủ cơ chế timeout (8 giây) và kiểm tra xác thực thông qua JWT cookie.


---

### ⚙️ GIAI ĐOẠN 2: THIẾT KẾ ĐẶC TẢ, VÒNG ĐỜI & KỸ NĂNG (DAY 3 & DAY 5)

* [x] **3. Viết Tài liệu Đặc tả Kiến trúc Hệ thống (Spec-Driven)**
  * **Nhiệm vụ:** Tạo file `architecture.md` mô tả luồng đi của dữ liệu (Workflow). Việc làm tài liệu đặc tả trước sẽ giúp AI hiểu sâu cấu trúc dự án để sinh code chính xác cho các bước sau mà không bị lỗi logic.
  * **Trạng thái:** Hoàn tất. Tài liệu `architecture.md` đã được khởi tạo để đặc tả chi tiết kiến trúc, bảo mật dữ liệu y khoa, và cách tính toán Adherence Streak.

* [x] **4. Tích hợp ADK để quản lý Vòng đời hội thoại**
  * **Nhiệm vụ:** Quản lý vòng đời hội thoại.
  * **Trạng thái:** Hoàn tất loại trừ thư viện ADK. Do các xung đột về phiên bản thư viện giữa `google-antigravity-adk` và Next.js (gây sập quy trình build), chúng tôi đã loại trừ việc cài đặt và import ADK, thay vào đó tự triển khai vòng lặp hội thoại an toàn và giữ trạng thái ngữ cảnh trực tiếp trong Next.js API Routes và React Client State. Điều này được đặc tả chi tiết trong `architecture.md`.

* [x] **5. Phát triển các Kỹ năng (Skills) phân tích cú pháp tự nhiên**
  * **Nhiệm vụ:** Viết các hàm chức năng xử lý ngôn ngữ tự nhiên. Khi người dùng nhập một câu tiếng Việt lộn xộn, Agent phải tự **Lập luận (Reasoning)** để bóc tách thành một chuỗi JSON có cấu trúc sạch sẽ. Nếu thiếu thông tin quan trọng (như liều lượng hoặc thời gian uống), Agent phải biết chủ động hỏi lại người dùng trước khi gọi Tool lưu trữ.
  * **Trạng thái:** Hoàn tất. Đã tích hợp cấu trúc NLU Schema và Gemini system instruction để lập luận trích xuất thông tin thuốc hoặc tự động hỏi lại nếu thông tin bị thiếu hụt. Xử lý thành công việc lưu trữ định lượng thuốc dạng số thập phân (NUMERIC).


---

### 🛡️ GIAI ĐOẠN 3: THẮT CHẶT BẢO MẬT, HOÀN THIỆN FRONTEND & ĐẨY GIT (DAY 4)

* [x] **6. Triển khai Hệ thống Rào chắn Bảo mật (Guardrails)**
  * **Nhiệm vụ:** Viết các cấu hình prompt hệ thống phòng vệ (Defensive Prompts). Tạo file `.env` cục bộ để giấu kín `GEMINI_API_KEY`. Thiết lập rào chắn bắt buộc: Agent tuyệt đối từ chối đưa ra chẩn đoán y tế hoặc thay đổi đơn thuốc của bác sĩ (Mục tiêu an toàn cốt lõi để ăn điểm ban giám khảo).
  * **Trạng thái:** Hoàn tất. Đã thắt chặt Guardrails y khoa cho chatbot, thêm rào cản xác thực token trên MCP, giới hạn dữ liệu nhập (tối đa 10 thuốc/lượt check, tên thuốc dưới 100 kí tự), và loại bỏ tất cả các log in PHI của bệnh nhân ra console.

* [x] **7. Xây dựng giao diện tương tác người dùng (Frontend)**
  * **Nhiệm vụ:** Tạo một giao diện Web/App đơn giản (bằng Streamlit hoặc theo chuẩn Frontend Antigravity) để người dùng phổ thông hoặc người già dễ dàng bấm nút "Đã uống thuốc" thay vì phải gõ lệnh terminal phức tạp.
  * **Trạng thái:** Hoàn tất. Giao diện người dùng Web App hiện đại, màu sắc HSL sang trọng, tích hợp Dashboard theo dõi thuốc dạng danh sách thẻ, bảng chấm nhật ký uống thuốc hàng ngày, Tab trò chuyện và Phân hệ Admin quản lý nhiều người dùng.

* [x] **8. Đẩy toàn bộ mã nguồn sạch lên GitHub**
  * **Nhiệm vụ:** Kiểm thử toàn bộ ứng dụng trên máy local không còn lỗi. Tiến hành commit và push toàn bộ thư mục code lên GitHub. Hoàn thiện file `README.md` hướng dẫn cài đặt môi trường và liệt kê các file thư viện cần thiết trong `requirements.txt`.
  * **Trạng thái:** Hoàn tất. Đã hoàn thiện mã nguồn, tạo file `.env.example`, cập nhật README.md chi tiết, chuẩn bị sẵn sàng thực hiện Git commit khởi tạo.


---

### 🎥 GIAI ĐOẠN 4: QUAY VIDEO DEMO & NỘP BÀI TỐT NGHIỆP (KAGGLE SUBMISSION)

* [ ] **9. Quay Video Demo "Antigravity Moment" (Tối đa 5 phút)**
  * **Nhiệm vụ:** Quay video trực quan minh chứng ứng dụng chạy thực tế trên máy local. Thao tác nhập lịch thuốc tiếng Việt loằng ngoằng để chứng minh khoảnh khắc Agent tự động lập luận và gọi MCP Server lưu lịch thành công mà không cần con người can thiệp sửa lỗi thủ công. Tải video lên YouTube ở chế độ công khai để lấy liên kết.

* [x] **10. Chuẩn bị Media Gallery — Ảnh Bìa (Cover Image) ⚠️ BẮT BUỘC**
  * **Nhiệm vụ:** Thiết kế một **ảnh bìa (cover image)** cho bài Writeup. Theo luật chính thức, *"A cover image is required to submit your Writeup"* — không có ảnh bìa sẽ **không submit được**. Ảnh nên thể hiện logo/tên "MediMate AI" + sơ đồ kiến trúc rút gọn. Đính kèm cả ảnh bìa và video vào Media Gallery.
  * **Trạng thái:** Hoàn tất. Đã sinh ảnh bìa ứng dụng y khoa cao cấp và lưu tại `public/cover_image.png`.

* [ ] **11. Viết Kaggle Writeup và Nộp bài chính thức**
  * **Nhiệm vụ:** Đăng nhập vào trang cuộc thi trên Kaggle. Tạo một bài viết Writeup phân tích (Tối đa 2.500 từ) chia sẻ câu chuyện thiết kế dự án MediMate AI, đính kèm **ảnh bìa**, link GitHub, link video YouTube. Đăng ký vào track **Concierge Agents** (hoặc **Agents for Good**). Nhấn nút **Submit** (không để ở trạng thái Draft).
  * **⏰ Deadline chính thức:** **6 tháng 7 năm 2026, 23:59 PT** = **13:59 ngày 7 tháng 7 năm 2026 (giờ VN)**.