# 🤖 AGENTS.md — Quy Chuẩn Lập Trình Cho AI & Thành Viên Dự Án

> **Dự án**: Wedding Dress Rental Website System (Hệ thống Thuê Áo Cưới & Trang Phục Cưới Cao Cấp)  
> **Môn học**: WDP301  
> **Kiến trúc**: Decoupled Monorepo (Client – Server tách rời: React SPA + Express RESTful API)

---

## 📌 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

Mọi trợ lý AI (Cursor, Copilot, Antigravity, Claude, ChatGPT) và thành viên phát triển **BẮT BUỘC** tuân thủ các điều khoản sau:

1. **Chuẩn Module**: Toàn bộ dự án chạy trên **ES Modules** (`import` / `export`). **TUYỆT ĐỐI KHÔNG DÙNG** `require()` hoặc `module.exports`.
2. **Không tự ý cài thêm thư viện (Dependencies)**: Chỉ sử dụng các gói thư viện đã có trong [package.json](file:///g:/FA26/WDP301/Wedding-Dress-Rental-Website-System/package.json), [backend/package.json](file:///g:/FA26/WDP301/Wedding-Dress-Rental-Website-System/backend/package.json) và [frontend/package.json](file:///g:/FA26/WDP301/Wedding-Dress-Rental-Website-System/frontend/package.json). Nếu cần thư viện mới, phải xin ý kiến Tech Lead/Leader.
3. **Đúng vị trí file (Strict File Placement)**: Tuyệt đối không tạo file tùy tiện ra ngoài cấu trúc thư mục quy định.
4. **Không viết code gộp tầng (No Architecture Violations)**: Backend cấm gọi Database từ Controller; Frontend cấm gọi API trực tiếp trong Component.

---

## 🗄️ 2. QUY CHUẨN BACKEND (`/backend`)

Backend được tổ chức theo kiến trúc **Layered Architecture (Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Models)**:

### 2.1. Phân chia trách nhiệm từng tầng:
* **Routes (`src/routes/`)**:
  - Chỉ làm nhiệm vụ ánh xạ đường dẫn HTTP và gắn middleware (xác thực `authMiddleware`, phân quyền `roleMiddleware`, upload file...).
  - Gọi hàm xử lý tương ứng từ Controller.
* **Controllers (`src/controllers/`)**:
  - Nhận `req` (Request), kiểm tra sơ bộ dữ liệu đầu vào (params, query, body).
  - Gọi tầng Service để xử lý nghiệp vụ: `const result = await dressService.createDress(req.body);`
  - Trả về `res` (Response) theo định dạng chuẩn JSON.
  - **NGHIÊM CẤM**: Không thực hiện câu lệnh truy vấn Mongoose Model (`find`, `save`, `findByIdAndUpdate`, ...) bên trong Controller!
* **Services (`src/services/`)**:
  - Chứa **100% logic nghiệp vụ** và tính toán (tính giá thuê, tiền cọc, kiểm tra trùng lịch, cập nhật trạng thái váy...).
  - Tương tác với Mongoose Models để đọc/ghi dữ liệu.
  - Ném ra `Error` khi vi phạm nghiệp vụ để Controller hoặc Middleware bắt lại.
* **Models (`src/models/`)**:
  - Định nghĩa Mongoose Schema, kiểu dữ liệu, ràng buộc (validation, enum, timestamps).
* **Middlewares (`src/middlewares/`)**:
  - Xử lý xác thực JWT, kiểm tra quyền hạn (Role), bắt lỗi tập trung (`errorHandler.js`).

### 2.2. Chuẩn định dạng phản hồi API (Standard API Response):
Mọi API trả về **phải** tuân theo một cấu trúc thống nhất:

* **Thành công**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách áo cưới thành công",
    "data": [ ... ]
  }
  ```
* **Thất bại**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy thông tin sản phẩm"
  }
  ```
* Sử dụng HTTP Status Code chính xác:
  - `200 OK`: Thành công (GET, PUT, PATCH).
  - `201 Created`: Tạo mới thành công (POST).
  - `400 Bad Request`: Dữ liệu đầu vào không hợp lệ.
  - `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn/sai.
  - `403 Forbidden`: Đã đăng nhập nhưng không đủ quyền (ví dụ Customer truy cập trang Admin).
  - `404 Not Found`: Không tìm thấy tài nguyên.
  - `500 Internal Server Error`: Lỗi phát sinh từ hệ thống server.

---

## 🎨 3. QUY CHUẨN FRONTEND (`/frontend`)

Frontend được xây dựng bằng **React 19 + Vite** theo kiến trúc **Component-Based**:

### 3.1. Phân chia thư mục:
* **`src/components/common/`**: Các UI Component dùng chung (Button, Modal, Input, Logo, Loader...).
* **`src/components/layout/`**: Layout khung ứng dụng (Header, Footer, Sidebar, AdminLayout, CustomerLayout...).
* **`src/pages/`**: Các màn hình chia theo nhóm đối tượng:
  - `src/pages/customer/`: Giao diện khách hàng (Home, Catalog, Detail, Booking, Cart, Profile...).
  - `src/pages/admin/`: Giao diện quản trị viên (Dashboard, DressManagement, OrderManagement...).
  - `src/pages/staff/`: Giao diện nhân viên showroom.
  - `src/pages/auth/`: Đăng nhập, đăng ký, quên mật khẩu.
* **`src/api/`**: Cấu hình Axios Client tập trung (`axiosClient.js`), cài đặt base URL và Interceptor tự động gán token `Authorization: Bearer <token>`.
* **`src/services/`**: Tầng giao tiếp API (mỗi thực thể một file, ví dụ: `dressService.js`, `bookingService.js`, `authService.js`).
* **`src/contexts/`**: Quản lý State toàn cục bằng React Context (`AuthContext`, `CartContext`...).
* **`src/hooks/`**: Custom hooks xử lý logic tái sử dụng.

### 3.2. Quy tắc lập trình giao diện:
1. **Giao tiếp API**:
   - **CẤM**: Gọi trực tiếp `axios.get()` hoặc `fetch()` trong component JSX.
   - **BẮT BUỘC**: Viết hàm trong `src/services/` rồi import vào Component:
     ```javascript
     // ✅ ĐÚNG:
     import { getDresses } from '@/services/dressService';
     
     useEffect(() => {
       getDresses().then(res => setDresses(res.data));
     }, []);
     ```
2. **Styling & UI**:
   - Sử dụng **Tailwind CSS** làm chính cho bố cục (grid, flex, spacing, responsive).
   - Sử dụng **Ant Design (antd v6)** cho các component phức tạp: Table, Form, DatePicker, Select, Modal, Message notification.
   - Màu sắc theo chủ đề tiệc cưới thanh lịch: Gold/Champagne, Rose Gold, Trắng kem, Đen tuyền.
   - **Hạn chế tối đa**: Viết inline style `style={{ ... }}` (chỉ dùng khi tính kích thước động).
3. **Thư viện Icon**:
   - Chỉ dùng icons từ **`lucide-react`** hoặc **`@ant-design/icons`**.

---

## 🏷️ 4. QUY ƯỚC ĐẶT TÊN (NAMING CONVENTIONS)

| Đối tượng | Quy ước | Ví dụ |
| :--- | :--- | :--- |
| **React Component / Page** | PascalCase | `DressCard.jsx`, `BookingModal.jsx`, `HomePage.jsx` |
| **Folder Component / Page** | camelCase / kebab-case | `components/common/`, `pages/customer/` |
| **Service / Helper / Controller file** | camelCase | `dressService.js`, `authController.js`, `formatCurrency.js` |
| **Mongoose Model file** | PascalCase hoặc camelCase | `Dress.js`, `User.js`, `Appointment.js` |
| **Biến / Hàm (Variables / Functions)** | camelCase | `getDressById`, `totalPrice`, `isAvailable` |
| **Hằng số (Constants)** | UPPER_SNAKE_CASE | `ORDER_STATUS_PENDING`, `DEFAULT_PAGE_SIZE` |
| **CSS Classes (Custom)** | kebab-case | `wedding-gold-gradient` |

---

## 🛡️ 5. QUY CHUẨN GIT & MERGE CODE

* **Tên nhánh (Branch)**:
  - Tính năng mới: `feature/<tên-tính-năng>` (VD: `feature/dress-booking`)
  - Sửa lỗi: `fix/<tên-lỗi>` (VD: `fix/login-token-expired`)
* **Quy chuẩn Commit Message**:
  - `feat: thêm chức năng đặt lịch thử váy`
  - `fix: sửa lỗi tính nhầm tiền cọc`
  - `style: cập nhật giao diện trang chủ theo tone màu gold`
  - `refactor: tách logic xử lý đơn hàng từ controller sang service`
* **Tuyệt đối không commit**:
  - Thư mục `node_modules/`, `dist/`, `.env` (chứa secret key).
