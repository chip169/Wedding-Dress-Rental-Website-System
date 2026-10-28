# 📑 TÀI LIỆU HỢP ĐỒNG API (API CONTRACT SPECIFICATION)

> **Dự án**: Wedding Dress Rental Website System (UniBridal)  
> **Dành cho**: Nhóm Lập Trình Backend (Express.js + Mongoose + MongoDB Atlas)  
> **Người biên soạn**: Tech Lead / Leader  
> **Kiến trúc bắt buộc**: Layered Architecture (`Routes` $\rightarrow$ `Controllers` $\rightarrow$ `Services` $\rightarrow$ `Models`)  
> **Chuẩn Module**: ES Modules (`import`/`export`), Tuyệt đối không dùng `require()`!

---

## 📌 1. NGUYÊN TẮC THIẾT KẾ & ĐỊNH DẠNG DỮ LIỆU CHUẨN

### 1.1. Base URL
```text
http://localhost:5000/api
```

### 1.2. Định Dạng Phản Hồi Thống Nhất (Standard API Response)

* **Thành công (HTTP 200, 201)**:
```json
{
  "success": true,
  "message": "Mô tả kết quả thành công bằng tiếng Việt",
  "data": { ... } // Hoặc mảng [ ... ]
}
```

* **Thất bại (HTTP 400, 401, 403, 404, 500)**:
```json
{
  "success": false,
  "message": "Mô tả nguyên nhân lỗi cụ thể"
}
```

### 1.3. Xác Thực (Authentication Header)
Tất cả các API yêu cầu đăng nhập phải gửi kèm JWT qua Header:
```http
Authorization: Bearer <token>
```

---

## 🔐 2. MODULE 1: AUTHENTICATION & USER (`/api/auth`)
*Phụ trách các chức năng Đăng ký, Đăng nhập, Profile và Đổi mật khẩu.*

| Method | Endpoint | Yêu cầu Auth | Mô tả |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | Public | Đăng ký tài khoản khách hàng mới |
| `POST` | `/auth/login` | Public | Đăng nhập hệ thống (trả về JWT token + user) |
| `GET` | `/auth/me` | Bearer Token | Lấy thông tin user đang đăng nhập |
| `PUT` | `/auth/profile` | Bearer Token | Cập nhật họ tên, số điện thoại, số đo, CCCD |
| `PUT` | `/auth/change-password` | Bearer Token | Đổi mật khẩu |

### Chi tiết Request / Response mẫu:

#### 🔹 `POST /api/auth/login`
* **Request Body**:
```json
{
  "email": "customer@unibridal.vn",
  "password": "Customer@123"
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "671e...89a",
      "fullName": "Cô Dâu Mai Phương",
      "email": "customer@unibridal.vn",
      "phone": "0987654321",
      "role": "customer",
      "roleId": { "code": "CUSTOMER", "name": "Khách hàng" }
    }
  }
}
```

---

## 👗 3. MODULE 2: VÁY CƯỚI & DANH MỤC (`/api/dresses`, `/api/categories`)
*Phụ trách danh mục 72 mẫu váy cưới, tìm kiếm, lọc và quản lý kho.*

| Method | Endpoint | Yêu cầu Auth | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/categories` | Public | Lấy danh sách 6 danh mục váy cưới |
| `GET` | `/dresses` | Public | Lấy danh sách váy cưới (hỗ trợ phân trang, lọc, tìm kiếm) |
| `GET` | `/dresses/:idOrSlug` | Public | Xem chi tiết 1 mẫu váy theo ID hoặc Slug |
| `GET` | `/dresses/:id/related` | Public | Lấy 4 mẫu váy tương tự cùng phom dáng |
| `POST` | `/dresses` | Admin/Staff | Thêm mẫu váy mới vào kho hàng |
| `PUT` | `/dresses/:id` | Admin/Staff | Cập nhật thông tin váy, giá thuê, tình trạng |
| `DELETE` | `/dresses/:id` | Admin | Ẩn hoặc xóa mẫu váy |

### Chi tiết Request / Response mẫu:

#### 🔹 `GET /api/dresses`
* **Query Parameters**:
  * `page` (mặc định: `1`): Trang hiện tại
  * `limit` (mặc định: `12`): Số lượng mỗi trang
  * `category`: Slug danh mục (`ballgown`, `mermaid`, `a-line`, `sheath`)
  * `priceRange`: Khoảng giá (`under-5`, `5-10`, `above-10`)
  * `search`: Từ khóa tìm kiếm theo tên hoặc chất liệu
* **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Lấy danh sách váy cưới thành công",
  "data": [
    {
      "_id": "671e...001",
      "code": "WDR-001",
      "name": "Elysian Rose Ballgown",
      "slug": "elysian-rose-ballgown-1",
      "silhouette": "Ballgown",
      "material": "Lụa Mikado Ý",
      "rentPrice": 5200000,
      "depositAmount": 15000000,
      "sizes": ["S", "M"],
      "status": "available",
      "rating": 4.9,
      "rentCount": 128,
      "images": ["/assets/images/card1_dress.jpg"]
    }
  ],
  "pagination": {
    "total": 72,
    "page": 1,
    "limit": 12,
    "totalPages": 6
  }
}
```

---

## 📅 4. MODULE 3: LỊCH HẸN THỬ VÁY (`/api/appointments`)
*Phụ trách quy trình đặt lịch phòng thử đồ VIP tại Showroom.*

| Method | Endpoint | Yêu cầu Auth | Mô tả |
| :--- | :--- | :---: | :--- |
| `POST` | `/appointments` | Public (Cho phép cả Guest) | Khách hàng gửi yêu cầu đặt lịch thử đồ |
| `GET` | `/appointments/my` | Bearer Token | Khách hàng xem danh sách lịch hẹn của mình |
| `GET` | `/appointments` | Staff / Admin | Nhân viên xem tất cả lịch hẹn cần phục vụ |
| `PATCH` | `/appointments/:id/status` | Staff / Admin | Cập nhật trạng thái lịch hẹn (`confirmed`, `completed`, `cancelled`) |

#### 🔹 `POST /api/appointments`
* **Request Body**:
```json
{
  "customerName": "Lê Nguyễn Thảo My",
  "customerPhone": "0938128899",
  "customerEmail": "thaomy.bride@gmail.com",
  "branch": "HCM_DISTRICT_1",
  "appointmentDate": "2026-11-15",
  "timeSlot": "13:30 — 15:00",
  "interestedDresses": ["671e...001", "671e...002"],
  "notes": "Muốn thử thêm voan dài đính kết và kiểm tra corsetry siết eo."
}
```

---

## 🛒 5. MODULE 4: ĐƠN THUÊ & KIỂM ĐỊNH HOÀN TRẢ (`/api/orders`)
*Phụ trách quy trình đặt cọc, giao nhận, và quyết toán hoàn cọc.*

| Method | Endpoint | Yêu cầu Auth | Mô tả |
| :--- | :--- | :---: | :--- |
| `POST` | `/orders` | Bearer Token | Tạo đơn thuê váy từ giỏ hàng |
| `GET` | `/orders/my` | Bearer Token | Khách hàng xem lịch sử đơn thuê cá nhân |
| `GET` | `/orders` | Staff / Admin | Danh sách đơn thuê hệ thống (quản lý đơn hàng) |
| `GET` | `/orders/:id` | Bearer Token | Xem chi tiết hành trình đơn hàng |
| `PATCH` | `/orders/:id/status` | Staff / Admin | Đổi trạng thái (`confirmed`, `preparing`, `handover`, `renting`, `returned`, `completed`) |
| `POST` | `/orders/:id/inspection` | Staff / Admin | Lập biên bản kiểm định tình trạng váy khi trả (phạt trễ / hư hại / hoàn cọc) |

#### 🔹 `POST /api/orders`
* **Request Body**:
```json
{
  "items": [
    {
      "dressId": "671e...001",
      "name": "Elysian Rose Ballgown",
      "size": "S",
      "rentPrice": 5200000,
      "depositAmount": 15000000
    }
  ],
  "rentalStartDate": "2026-11-20",
  "rentalEndDate": "2026-11-23",
  "shippingAddress": "128 Đồng Khởi, Bến Nghé, Quận 1, TP. HCM",
  "notes": "Giao váy nguyên túi bảo quản chống bụi và móc nhung."
}
```

---

## 📜 6. MODULE 5: HỢP ĐỒNG ĐIỆN TỬ (`/api/contracts`, `/api/contract-templates`)
*Phụ trách mẫu hợp đồng pháp lý và ký số CCCD.*

| Method | Endpoint | Yêu cầu Auth | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/contract-templates` | Public / Auth | Danh sách các mẫu hợp đồng tiêu chuẩn (Haute Couture, Bespoke...) |
| `POST` | `/contract-templates` | Admin | Tạo mẫu hợp đồng mới |
| `PUT` | `/contract-templates/:id` | Admin | Cập nhật điều khoản mẫu hợp đồng |
| `GET` | `/contracts` | Bearer Token | Danh sách hợp đồng đã phát hành |
| `GET` | `/contracts/:id` | Bearer Token | Chi tiết điều khoản hợp đồng |
| `POST` | `/contracts` | Staff / Admin | Khởi tạo hợp đồng từ đơn thuê |
| `POST` | `/contracts/:id/sign` | Bearer Token | Khách hàng xác nhận ký số CCCD điện tử |

---

## 💬 7. MODULE 6: CHĂM SÓC KHÁCH HÀNG & CHAT (`/api/conversations`, `/api/messages`)
*Phụ trách hệ thống tin nhắn tư vấn 1:1.*

| Method | Endpoint | Yêu cầu Auth | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/conversations` | Staff / Admin | Danh sách hội thoại đang chờ hỗ trợ |
| `GET` | `/conversations/:id/messages` | Bearer Token | Lấy lịch sử chat của 1 cuộc trò chuyện |
| `POST` | `/messages` | Bearer Token | Gửi tin nhắn mới (text, ảnh váy quan tâm) |
| `PATCH`| `/conversations/:id/read` | Bearer Token | Đánh dấu đã đọc |

---

## 👥 8. GỢI Ý PHÂN CÔNG CÔNG VIỆC CHO THÀNH VIÊN BACKEND

1. **Thành viên 1**: 
   * Xây dựng **Module 1 (Auth & User)** & **Module 2 (Dress & Category)**.
   * Xây dựng Middleware `errorHandler.js` bắt lỗi tập trung.
2. **Thành viên 2**: 
   * Xây dựng **Module 3 (Appointment)** & **Module 4 (Order & Return Inspection)**.
3. **Thành viên 3**: 
   * Xây dựng **Module 5 (Contract & Template)** & **Module 6 (Chat & Messages)**.

---
*Tài liệu này là chuẩn kỹ thuật chính thức. Frontend đã được cập nhật toàn bộ hàm trong `src/services/` sẵn sàng đón dữ liệu từ các API trên.*

