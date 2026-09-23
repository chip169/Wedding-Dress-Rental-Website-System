# PRODUCT BACKLOG - WEDDING DRESS RENTAL WEBSITE SYSTEM
**Dự án**: Hệ thống Website Thuê Áo Cưới (Wedding Dress Rental Website System)  
**Môn học / Khóa**: WDP301 - Web Development Project  
**Phương pháp luận**: Agile / Scrum  

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Mục tiêu
Xây dựng nền tảng trực tuyến chuyên nghiệp phục vụ việc quản lý và cung cấp dịch vụ cho thuê trang phục cưới (váy cưới, áo dài, vest chú rể, phụ kiện cưới), hỗ trợ khách hàng tìm kiếm, đặt lịch thử đồ tại showroom, đặt cọc thuê đồ trực tuyến và quản lý quy trình trả đồ/hoàn cọc minh bạch.

### 1.2. Các bên liên quan & Vai trò người dùng (User Personas / Actors)
1. **Khách vãng lai (Guest)**: Người dùng chưa đăng nhập, có thể xem danh mục, bộ sưu tập váy cưới, bảng giá niêm yết, chính sách và tìm kiếm showroom.
2. **Khách hàng (Customer)**: Người dùng đã đăng ký tài khoản, có thể đặt lịch hẹn thử váy tại cửa hàng, chọn mẫu đặt thuê, thanh toán cọc trực tuyến, theo dõi tiến độ đơn hàng và đánh giá chất lượng dịch vụ.
3. **Nhân viên (Staff)**: Tiếp nhận lịch hẹn thử đồ của khách, kiểm tra tình trạng váy khi giao/nhận, cập nhật trạng thái đơn thuê (chuẩn bị đồ, đang thuê, đã trả, đồ hỏng/cần giặt ủi), xử lý cọc.
4. **Quản trị viên (Admin)**: Quản lý toàn bộ danh mục sản phẩm, bộ sưu tập, giá thuê, kho hàng, tài khoản người dùng, phân quyền nhân viên và theo dõi báo cáo doanh thu thống kê.

---

## 2. QUY ƯỚC & ĐỊNH NGHĨA CHUNG (DoR & DoD)

### 2.1. Definition of Ready (DoR) - Tiêu chí sẵn sàng thực hiện User Story
- User Story được mô tả rõ ràng theo cấu trúc: *Là một [Vai trò], tôi muốn [Hành động], để [Mục đích]*.
- Có đầy đủ danh sách **Tiêu chí chấp nhận (Acceptance Criteria - AC)** cụ thể, có thể kiểm thử được.
- Đã được nhóm ước lượng điểm (Story Points) bằng thang Fibonacci.
- Các phụ thuộc kỹ thuật (API, Database schema, UI mockup) đã được xác định.

### 2.2. Definition of Done (DoD) - Tiêu chí hoàn thành User Story
- Mã nguồn đáp ứng đúng tất cả các Tiêu chí chấp nhận (AC).
- Mã nguồn được tuân thủ Coding Conventions và đã qua Code Review / Pull Request.
- Đã kiểm thử chức năng (Manual Test / Unit Test) không phát sinh lỗi nghiêm trọng.
- API được kiểm thử trên Postman/Swagger (đối với Backend).
- Giao diện phản hồi tốt (Responsive) trên màn hình máy tính và thiết bị di động (đối với Frontend).
- Đã merge vào nhánh `develop` thành công.

---

## 3. DANH SÁCH PRODUCT BACKLOG CHI TIẾT

> **Quy ước độ ưu tiên (MoSCoW)**:
> - **Must Have (M)**: Bắt buộc phải có để hệ thống vận hành tối thiểu.
> - **Should Have (S)**: Cần thiết, có giá trị cao, nên hoàn thành trong các Sprint chính.
> - **Could Have (C)**: Tính năng mở rộng, tăng trải nghiệm người dùng nếu còn thời gian.
> - **Won't Have (W)**: Chưa phát triển trong phạm vi phiên bản hiện tại.

### EPIC 01: Quản lý Tài khoản & Phân quyền (Authentication & Authorization)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-01** | Là một **Guest**, tôi muốn đăng ký tài khoản bằng email/số điện thoại để trở thành khách hàng thành viên. | - Form đăng ký có kiểm tra tính hợp lệ của email, số điện thoại, mật khẩu (tối thiểu 6 ký tự).<br>- Không cho phép đăng ký trùng email.<br>- Mật khẩu được mã hóa an toàn (bcrypt) trước khi lưu vào DB. | **Must** | 3 | Sprint 1 |
| **US-02** | Là một **Người dùng**, tôi muốn đăng nhập vào hệ thống bằng tài khoản đã tạo để truy cập các dịch vụ cá nhân. | - Đăng nhập thành công trả về JWT Token lưu vào Client.<br>- Điều hướng chính xác theo Role: Customer về trang chủ/tài khoản, Admin/Staff về Dashboard.<br>- Hiển thị thông báo rõ ràng khi sai thông tin. | **Must** | 3 | Sprint 1 |
| **US-03** | Là một **Khách hàng**, tôi muốn xem và cập nhật thông tin cá nhân (họ tên, SĐT, địa chỉ, số đo chiều cao/cân nặng) để tiện cho việc thuê và thử đồ. | - Xem được thông tin hiện tại.<br>- Cập nhật được thông tin cá nhân.<br>- Lưu các thông số số đo cơ bản để nhân viên tư vấn chọn size váy phù hợp. | **Should** | 2 | Sprint 1 |
| **US-04** | Là một **Người dùng**, tôi muốn đăng xuất khỏi hệ thống để bảo vệ thông tin khi không sử dụng. | - Hủy token phía client, xóa thông tin user trong local storage.<br>- Chuyển hướng người dùng về trang chủ. | **Must** | 1 | Sprint 1 |

---

### EPIC 02: Quản lý Danh mục & Sản phẩm Áo cưới (Catalog & Dress Management)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-05** | Là một **Admin**, tôi muốn thêm mới áo cưới vào hệ thống với thông tin chi tiết (tên, danh mục, kích cỡ, màu sắc, giá thuê, số tiền cọc, hình ảnh mô tả). | - Form thêm đầy đủ các trường thông tin.<br>- Cho phép chọn loại danh mục: Váy xòe, Đuôi cá, Chữ A, Áo dài, Vest chú rể.<br>- Cho phép upload nhiều hình ảnh.<br>- Lưu trữ trạng thái sẵn sàng cho thuê (`Available`). | **Must** | 5 | Sprint 2 |
| **US-06** | Là một **Admin**, tôi muốn cập nhật hoặc xóa (ẩn) sản phẩm áo cưới khi mẫu váy lỗi thời hoặc ngừng phục vụ. | - Chỉnh sửa được mọi thông tin và giá của áo cưới.<br>- Xóa mềm (Soft Delete/Ẩn) nếu áo cưới đang nằm trong các đơn hàng lịch sử. | **Must** | 3 | Sprint 2 |
| **US-07** | Là một **Guest/Customer**, tôi muốn xem danh sách các mẫu áo cưới kèm hình ảnh, tên và giá thuê niêm yết. | - Danh sách hiển thị dạng lưới (Grid Card) thẩm mỹ, sang trọng.<br>- Có phân trang (Pagination) hoặc Lazy load.<br>- Hiển thị nhãn trạng thái (Còn hàng / Tạm hết). | **Must** | 3 | Sprint 2 |
| **US-08** | Là một **Guest/Customer**, tôi muốn xem chi tiết thông tin một chiếc váy cưới (hình ảnh phóng to, số đo kích cỡ S/M/L, chất liệu, phụ kiện đi kèm, giá cọc). | - Hiển thị slider/gallery ảnh chất lượng cao.<br>- Bảng hướng dẫn chọn size váy chi tiết.<br>- Nút hành động: "Đặt lịch thử váy" và "Thêm vào giỏ thuê". | **Must** | 3 | Sprint 2 |

---

### EPIC 03: Tìm kiếm, Lọc & Phân loại Trang phục (Search & Filtering)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-09** | Là một **Guest/Customer**, tôi muốn tìm kiếm áo cưới theo tên hoặc từ khóa để nhanh chóng tìm thấy mẫu ưng ý. | - Ô tìm kiếm hỗ trợ debounce để tối ưu hiệu năng gọi API.<br>- Tìm kiếm không phân biệt chữ hoa, chữ thường và dấu tiếng Việt. | **Should** | 2 | Sprint 2 |
| **US-10** | Là một **Guest/Customer**, tôi muốn lọc áo cưới theo danh mục, khoảng giá thuê, kích cỡ và màu sắc. | - Bộ lọc đa tiêu chí (danh mục, khoảng giá min-max, size S/M/L/XL).<br>- Tự động cập nhật kết quả lọc tức thì.<br>- Có nút "Xóa tất cả bộ lọc". | **Should** | 3 | Sprint 2 |

---

### EPIC 04: Đặt lịch Hẹn Thử Váy tại Showroom (Fitting Appointment)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-11** | Là một **Customer**, tôi muốn đặt lịch hẹn đến showroom thử váy (chọn ngày, khung giờ, ghi chú mẫu váy quan tâm) để được phục vụ chu đáo. | - Chọn ngày và khung giờ còn trống (tránh trùng quá tải ca thử).<br>- Gửi thông tin danh sách váy muốn thử (tối đa 3 - 5 mẫu/buổi).<br>- Trạng thái ban đầu: `Pending` (Chờ xác nhận). | **Must** | 5 | Sprint 3 |
| **US-12** | Là một **Staff**, tôi muốn xem danh sách lịch hẹn thử đồ và xác nhận hoặc từ chối lịch hẹn của khách. | - Bảng danh sách lịch hẹn theo ngày/tuần.<br>- Có thể đổi trạng thái: `Confirmed`, `Completed`, `Cancelled`.<br>- Gửi thông báo/email xác nhận lịch hẹn cho khách hàng. | **Must** | 3 | Sprint 3 |

---

### EPIC 05: Đặt Thuê Áo Cưới & Quản lý Đặt cọc (Rental Booking & Deposit)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-13** | Là một **Customer**, tôi muốn chọn ngày bắt đầu thuê và ngày dự kiến trả đồ để hệ thống kiểm tra tình trạng còn trống của áo cưới. | - Có DatePicker chọn khoảng thời gian thuê (Start Date - End Date).<br>- Hệ thống kiểm tra xem váy cưới có bị trùng lịch thuê với đơn khác hay không. | **Must** | 5 | Sprint 3 |
| **US-14** | Là một **Customer**, tôi muốn thêm áo cưới và phụ kiện vào Giỏ đồ thuê để tiến hành thuê cùng lúc. | - Giỏ hàng lưu trữ danh sách váy, thời gian thuê, đơn giá và tổng số tiền cọc.<br>- Cho phép cập nhật số lượng hoặc xóa sản phẩm khỏi giỏ. | **Must** | 3 | Sprint 3 |
| **US-15** | Là một **Customer**, tôi muốn tiến hành Tạo đơn thuê và xác nhận cam kết chính sách giữ gìn áo cưới. | - Màn hình Checkout hiển thị chi tiết: Tiền thuê + Tiền cọc giữ đồ (Deposit) + Phí vận chuyển (nếu có).<br>- Checkbox đồng ý với Điều khoản và Quy định bồi hoàn khi hư hại váy cưới. | **Must** | 5 | Sprint 3 |

---

### EPIC 06: Tích hợp Thanh toán & Quản lý Giao dịch (Payment)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-16** | Là một **Customer**, tôi muốn thanh toán tiền đặt cọc thuê đồ qua cổng thanh toán trực tuyến (VNPAY / Chuyển khoản QR) để giữ đồ. | - Tạo URL thanh toán VNPAY / sinh mã VietQR động theo mã đơn.<br>- Nhận IPN Callback từ cổng thanh toán để tự động cập nhật trạng thái đơn sang `Đã đặt cọc`. | **Should** | 5 | Sprint 4 |
| **US-17** | Là một **Staff/Admin**, tôi muốn ghi nhận thanh toán tiền mặt trực tiếp tại showroom đối với các đơn khách nhận đồ trực tiếp. | - Nhân viên có quyền bấm xác nhận "Đã nhận cọc tiền mặt".<br>- Lưu lịch sử giao dịch và người thực hiện thu tiền. | **Should** | 2 | Sprint 4 |

---

### EPIC 07: Quản lý Tiến độ Đơn Thuê & Trả Đồ (Order & Return Management)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-18** | Là một **Staff**, tôi muốn kiểm tra và chuyển trạng thái đơn hàng qua các bước: Chuẩn bị đồ -> Bàn giao cho khách -> Đang thuê -> Đã nhận lại đồ. | - Quy trình vòng đời đơn thuê: `Pending` -> `Deposit_Paid` -> `Delivered/Renting` -> `Returned` -> `Completed`.<br>- Ghi chú tình trạng váy khi trả (Bình thường / Hư hại / Bẩn cần giặt hấp đặc biệt). | **Must** | 5 | Sprint 4 |
| **US-19** | Là một **Staff/Admin**, tôi muốn xử lý hoàn trả tiền đặt cọc cho khách hàng sau khi kiểm tra váy cưới nguyên vẹn (hoặc khấu trừ tiền bồi thường nếu hư hỏng). | - Giao diện tính toán tiền hoàn cọc = Tiền cọc - Phí phạt trễ hạn - Phí sửa chữa hư tổn.<br>- Xác nhận hoàn tiền thành công và đóng đơn hàng. | **Must** | 4 | Sprint 4 |
| **US-20** | Là một **Customer**, tôi muốn tra cứu lịch sử và trạng thái hiện tại của tất cả các đơn thuê của mình. | - Xem danh sách đơn thuê kèm trạng thái trực quan.<br>- Xem chi tiết từng đơn hàng, hợp đồng thuê và hóa đơn tiền cọc. | **Should** | 3 | Sprint 4 |

---

### EPIC 08: Đánh giá & Báo cáo Doanh thu (Review & Analytics)

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Priority | Story Points | Sprint |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **US-21** | Là một **Customer**, tôi muốn viết đánh giá và chấm điểm sao cho mẫu váy cưới sau khi đã hoàn thành đơn thuê. | - Chỉ những đơn hàng trạng thái `Completed` mới được đánh giá.<br>- Cho phép chấm từ 1 đến 5 sao và viết nhận xét kèm ảnh thực tế khi mặc. | **Could** | 3 | Sprint 4 |
| **US-22** | Là một **Admin**, tôi muốn xem biểu đồ thống kê tổng doanh thu thuê, số lượng đơn hàng theo tháng và mẫu váy cưới được thuê nhiều nhất. | - Dashboard hiển thị các thẻ tổng quan: Tổng doanh thu, Số đơn đang thuê, Số lượt thử váy trong tháng.<br>- Biểu đồ trực quan (cột / tròn) thể hiện doanh số và top váy cưới thịnh hành. | **Should** | 5 | Sprint 4 |

---

## 4. KẾ HOẠCH PHÂN BỔ SPRINT DỰ KIẾN (Sprint Breakdown)

| Sprint | Thời gian dự kiến | Mục tiêu chính | User Stories bàn giao |
| :--- | :---: | :--- | :--- |
| **Sprint 1** | Tuần 1 - 2 | Cấu hình nền tảng, Xác thực & Phân quyền, Quản lý tài khoản người dùng | US-01, US-02, US-03, US-04 |
| **Sprint 2** | Tuần 3 - 4 | Quản lý danh mục áo cưới, Hiển thị bộ sưu tập, Tìm kiếm & Lọc sản phẩm | US-05, US-06, US-07, US-08, US-09, US-10 |
| **Sprint 3** | Tuần 5 - 6 | Đặt lịch hẹn thử váy tại showroom, Đặt thuê váy, Kiểm tra trùng lịch, Giỏ thuê & Checkout | US-11, US-12, US-13, US-14, US-15 |
| **Sprint 4** | Tuần 7 - 8 | Tích hợp thanh toán cọc VNPAY, Quản lý vòng đời đơn thuê, Trả đồ & Hoàn cọc, Báo cáo doanh thu | US-16, US-17, US-18, US-19, US-20, US-21, US-22 |
