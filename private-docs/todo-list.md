## **MediMate AI**

---

### 🧱 GIAI ĐOẠN 1: THIẾT LẬP HẠ TẦNG & PHÁT TRIỂN CÔNG CỤ (DAY 1 & DAY 2)

* [x] **1. Khởi tạo Kho mã nguồn mở bảo mật trên GitHub**
* **Nhiệm vụ:** Tạo Public Repository tên `MediMate-AI`. Thêm file `LICENSE` (chọn MIT License theo quy định mã nguồn mở bắt buộc của cuộc thi). Tạo file `.gitignore` để chặn đẩy các file cấu hình chứa mã bảo mật lên Internet.
* **Tài liệu áp dụng:** [Getting Started with Google Antigravity](https://codelabs.developers.google.com/getting-started-google-antigravity?hl=vi#0) *(Hướng dẫn thiết lập môi trường Antigravity ban đầu trên máy local)*.


* [ ] **2. Xây dựng MCP Server làm "Hộp lưu trữ" lịch thuốc**
* **Nhiệm vụ:** Viết mã nguồn cho một MCP (Model Context Protocol) Server cục bộ chạy bằng Python. Định nghĩa các công cụ định dạng chuẩn (`Tools`) như: `save_medication_schedule` (ghi lịch thuốc thành file JSON bảo mật trên máy) và `get_medication_history` (đọc lịch sử uống thuốc).
* **Tài liệu áp dụng:** [Developer Knowledge: MCP Antigravity](https://codelabs.developers.google.com/developer-knowledge-mcp-antigravity?utm_medium=email&utm_source=gamma&utm_campaign=learn-intensive-assignment2-june-2026&hl=vi#0) *(Cách cấu hình giao thức kết nối tri thức cục bộ cho Agent)*.



---

### ⚙️ GIAI ĐOẠN 2: THIẾT KẾ ĐẶC TẢ, VÒNG ĐỜI & KỸ NĂNG (DAY 3 & DAY 5)

* [ ] **3. Viết Tài liệu Đặc tả Kiến trúc Hệ thống (Spec-Driven)**
* **Nhiệm vụ:** Tạo file `architecture.md` mô tả luồng đi của dữ liệu (Workflow). Việc làm tài liệu đặc tả trước sẽ giúp AI hiểu sâu cấu trúc dự án để sinh code chính xác cho các bước sau mà không bị lỗi logic.
* **Tài liệu áp dụng:** [Vibecode: Ambient Expense Agent](https://codelabs.developers.google.com/vibecode-ambient-expense-agent?hl=en#0) *(Phương pháp Spec-Driven Production - Thiết kế tác vụ dựa trên tài liệu đặc tả)*.


* [ ] **4. Tích hợp ADK để quản lý Vòng đời hội thoại**
* **Nhiệm vụ:** Sử dụng bộ phát triển Agent Development Kit (ADK) để viết file cốt lõi `main.py`. Thiết lập cấu trúc vòng lặp hội thoại để Agent có khả năng giữ ngữ cảnh cuộc trò chuyện tiếng Việt khi giao tiếp với người dùng.
* **Tài liệu áp dụng:** [Agents CLI ADK Lifecycle](https://codelabs.developers.google.com/agents-cli-adk-lifecycle?utm_source=reg&utm_medium=email&utm_campaign=learn-intensive-assignment3-june-2026&utm_content&hl=vi#0) *(Quản lý các trạng thái vòng đời khởi tạo, thực thi và kết thúc của một Agent)*.


* [ ] **5. Phát triển các Kỹ năng (Skills) phân tích cú pháp tự nhiên**
* **Nhiệm vụ:** Viết các hàm chức năng xử lý ngôn ngữ tự nhiên. Khi người dùng nhập một câu tiếng Việt lộn xộn, Agent phải tự **Lập luận (Reasoning)** để bóc tách thành một chuỗi JSON có cấu trúc sạch sẽ. Nếu thiếu thông tin quan trọng (như liều lượng hoặc thời gian uống), Agent phải biết chủ động hỏi lại người dùng trước khi gọi Tool lưu trữ.
* **Tài liệu áp dụng:** [Getting Started with Antigravity Skills](https://codelabs.developers.google.com/getting-started-with-antigravity-skills?hl=vi#0) & [Antigravity CLI Hands-on](https://codelabs.developers.google.com/antigravity-cli-hands-on?hl=vi#0) *(Cách nạp kỹ năng xử lý tác vụ thông minh cho trợ lý ảo)*.



---

### 🛡️ GIAI ĐOẠN 3: THẮT CHẶT BẢO MẬT, HOÀN THIỆN FRONTEND & ĐẨY GIT (DAY 4)

* [ ] **6. Triển khai Hệ thống Rào chắn Bảo mật (Guardrails)**
* **Nhiệm vụ:** Viết các cấu hình prompt hệ thống phòng vệ (Defensive Prompts). Tạo file `.env` cục bộ để giấu kín `GEMINI_API_KEY`. Thiết lập rào chắn bắt buộc: Agent tuyệt đối từ chối đưa ra chẩn đoán y tế hoặc thay đổi đơn thuốc của bác sĩ (Mục tiêu an toàn cốt lõi để ăn điểm ban giám khảo).
* **Tài liệu áp dụng:** [Secure Agentic Coding](https://codelabs.developers.google.com/secure-agentic-coding?utm_source=reg&utm_medium=email&utm_campaign=learn-intensive-assignment4-june-2026&utm_content&hl=vi#0) *(Kỹ thuật bảo vệ hệ thống trước Prompt Injection và cấu hình rào chắn an toàn dữ liệu)*.


* [ ] **7. Xây dựng giao diện tương tác người dùng (Frontend)**
* **Nhiệm vụ:** Tạo một giao diện Web/App đơn giản (bằng Streamlit hoặc theo chuẩn Frontend Antigravity) để người dùng phổ thông hoặc người già dễ dàng bấm nút "Đã uống thuốc" thay vì phải gõ lệnh terminal phức tạp.
* **Tài liệu áp dụng:** [Vibecode Frontend with Antigravity](https://codelabs.developers.google.com/vibecode-frontend-with-antigravity?utm_source=reg&utm_medium=email&utm_campaign=learn-intensive-assignment5-june-2026&utm_content&hl=vi#0) *(Xây dựng tầng giao diện trực quan cho ứng dụng Agent)*.


* [ ] **8. Đẩy toàn bộ mã nguồn sạch lên GitHub**
* **Nhiệm vụ:** Kiểm thử toàn bộ ứng dụng trên máy local không còn lỗi. Tiến hành commit và push toàn bộ thư mục code lên GitHub. Hoàn thiện file `README.md` hướng dẫn cài đặt môi trường và liệt kê các file thư viện cần thiết trong `requirements.txt`.



---

### 🎥 GIAI ĐOẠN 4: QUAY VIDEO DEMO & NỘP BÀI TỐT NGHIỆP (KAGGLE SUBMISSION)

* [ ] **9. Quay Video Demo "Antigravity Moment" (Tối đa 5 phút)**
* **Nhiệm vụ:** Quay video trực quan minh chứng ứng dụng chạy thực tế trên máy local. Thao tác nhập lịch thuốc tiếng Việt loằng ngoằng để chứng minh khoảnh khắc Agent tự động lập luận và gọi MCP Server lưu lịch thành công mà không cần con người can thiệp sửa lỗi thủ công. Tải video lên YouTube ở chế độ công khai để lấy liên kết.
* *(Mẹo nhỏ: Có thể tham khảo cách tối ưu quy trình deploy thực tế qua bài [Deploy from AI Studio to Run](https://codelabs.developers.google.com/deploy-from-aistudio-to-run?hl=vi#0) hoặc bài [Enterprise Cloud Scale Deploying](https://codelabs.developers.google.com/enterprise-cloud-scale-deploying-the-expense-agent-to-agent-runtime-on-google-cloud?utm_source=reg&utm_medium=email&utm_campaign=learn-intensive-assignment5-june-2026&utm_content&hl=vi#0) nếu bạn muốn quay thêm minh chứng ứng dụng đã sẵn sàng chạy thực tế trên Cloud để lấy điểm cộng tối đa từ ban giám khảo).*


* [ ] **10. Chuẩn bị Media Gallery — Ảnh Bìa (Cover Image) ⚠️ BẮT BUỘC**
* **Nhiệm vụ:** Thiết kế một **ảnh bìa (cover image)** cho bài Writeup. Theo luật chính thức, *"A cover image is required to submit your Writeup"* — không có ảnh bìa sẽ **không submit được**. Ảnh nên thể hiện logo/tên "MediMate AI" + sơ đồ kiến trúc rút gọn. Đính kèm cả ảnh bìa và video vào Media Gallery.


* [ ] **11. Viết Kaggle Writeup và Nộp bài chính thức**
* **Nhiệm vụ:** Đăng nhập vào trang cuộc thi trên Kaggle. Tạo một bài viết Writeup phân tích (Tối đa 2.500 từ) chia sẻ câu chuyện thiết kế dự án MediMate AI, đính kèm **ảnh bìa**, link GitHub, link video YouTube. Đăng ký vào track **Concierge Agents** (fit chính xác nhất — mô tả track nói rõ *"helping manage complicated medications - safe and secure agents... keeps personal information safe and secure"*; nếu muốn nhấn mạnh tác động sức khỏe cộng đồng thì cân nhắc **Agents for Good**). Nhấn nút **Submit** (không để ở trạng thái Draft).
* **⏰ Deadline chính thức:** **6 tháng 7 năm 2026, 23:59 PT** = **13:59 ngày 7 tháng 7 năm 2026 (giờ VN)**. Khuyến nghị nộp trước tối thiểu nửa ngày để tránh lỗi phút chót.