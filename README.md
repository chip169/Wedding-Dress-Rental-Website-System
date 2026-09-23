# 💍 WEDDING DRESS RENTAL WEBSITE SYSTEM
Hệ thống Website Cho Thuê Áo Cưới & Trang Phục Cưới Cao Cấp.

Dự án phát triển web theo mô hình Agile/Scrum phục vụ đồ án môn học WDP301.

---

## 📌 MỤC LỤC
1. [Giới thiệu & Tính năng chính](#-giới-thiệu--tính-năng-chính)
2. [Công nghệ sử dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
3. [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
4. [Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
5. [Cấu hình biến môi trường (.env)](#-cấu-hình-biến-môi-trường-env)
6. [Quy chuẩn Git & Làm việc nhóm (Git Conventions)](#-quy-chuẩn-git--làm-việc-nhóm-git-conventions)
7. [Tài liệu Product Backlog](#-tài-liệu-product-backlog)

---

## 🌟 GIỚI THIỆU & TÍNH NĂNG CHÍNH

Hệ thống cung cấp giải pháp toàn diện cho dịch vụ cho thuê trang phục cưới và đặt lịch trải nghiệm:
- **Khách hàng (Customer)**: Duyệt bộ sưu tập váy cưới cao cấp, đặt lịch hẹn thử váy tại showroom, kiểm tra tình trạng trống theo ngày, đặt cọc thuê đồ trực tuyến và quản lý đơn hàng.
- **Nhân viên (Staff)**: Tiếp nhận lịch thử đồ, kiểm tra bàn giao và nhận lại váy, ghi nhận hư hỏng, cập nhật hoàn cọc.
- **Quản trị viên (Admin)**: Quản lý danh mục áo cưới, kiểm soát doanh thu, đơn hàng và phân quyền hệ thống.

---

## 🛠 CÔNG NGHỆ SỬ DỤNG (TECH STACK)

### Frontend (`/frontend`)
- **Core**: React.js 18+ (Vite Bundler - JavaScript)
- **Styling**: Tailwind CSS + Ant Design 5 (Theme tùy biến màu sắc tiệc cưới sang trọng)
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios (Cấu hình sẵn Axios Interceptor tự động gán JWT Token)
- **Icons**: Lucide React & Ant Design Icons

### Backend (`/backend`)
- **Runtime**: Node.js (ES Modules `import/export`)
- **Framework**: Express.js
- **Database**: MongoDB (qua ODM Mongoose)
- **Bảo mật & Tiện ích**: `dotenv`, `cors`, `nodemon`

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
Wedding-Dress-Rental-Website-System/
├── .editorconfig                   # Cấu hình đồng bộ định dạng mã nguồn
├── .gitignore                      # Danh sách file loại trừ khỏi Git
├── package.json                    # Script điều khiển chạy cả FE & BE cùng lúc
├── PRODUCT_BACKLOG.md              # Bảng Product Backlog chi tiết theo Agile/Scrum
├── README.md                       # Hướng dẫn dự án & quy chuẩn làm việc
│
├── frontend/                       # Mã nguồn Client
│   ├── public/                     # Tài nguyên tĩnh (favicon, ...)
│   ├── src/
│   │   ├── api/                    # Cấu hình axiosClient, interceptors
│   │   ├── assets/                 # Hình ảnh, logo, icons
│   │   ├── components/             # Reusable UI Components (common, layout)
│   │   ├── contexts/               # Quản lý state toàn cục (AuthContext, CartContext)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── pages/                  # Các trang (admin, auth, customer)
│   │   ├── routes/                 # Định tuyến & phân quyền
│   │   ├── services/               # Tầng gọi API theo thực thể
│   │   ├── utils/                  # Formatters, constants, helpers
│   │   ├── App.jsx                 # Component gốc
│   │   ├── index.css               # Tailwind CSS base
│   │   └── main.jsx                # Điểm khởi chạy React
│   ├── .env & .env.example
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── backend/                        # Mã nguồn Server
    ├── src/
    │   ├── config/                 # Cấu hình hệ thống (kết nối MongoDB db.js)
    │   ├── controllers/            # Xử lý logic request/response
    │   ├── middlewares/            # Middlewares xác thực và xử lý lỗi
    │   ├── models/                 # Mongoose Models/Schemas
    │   ├── routes/                 # Định tuyến API
    │   ├── services/               # Tầng xử lý nghiệp vụ độc lập
    │   ├── utils/                  # Hàm tiện ích dùng chung
    │   └── app.js                  # Khởi tạo Express, CORS, JSON body parser
    ├── .env & .env.example
    ├── package.json
    └── server.js                   # Điểm khởi chạy server và kết nối DB
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản 18 trở lên (Khuyến nghị Node.js 20.x hoặc 22.x).
- **MongoDB**: Đã cài đặt MongoDB cục bộ hoặc có tài khoản MongoDB Atlas.

### Bước 1: Clone dự án
```bash
git clone https://github.com/chip169/Wedding-Dress-Rental-Website-System.git
cd Wedding-Dress-Rental-Website-System
```

### Bước 2: Cài đặt Dependencies cho cả 2 phía
Từ thư mục gốc:
```bash
npm run install:all
```
*(Lệnh trên sẽ tự động cài đặt dependencies cho cả thư mục root, backend và frontend)*

### Bước 3: Khởi chạy dự án

#### Cách 1: Khởi chạy cả 2 server cùng lúc (Khuyến nghị)
Tại thư mục gốc:
```bash
npm run dev
```
- **Backend API**: Chạy tại `http://localhost:5000` (Kiểm tra tại `http://localhost:5000/health`)
- **Frontend App**: Chạy tại `http://localhost:3000`

#### Cách 2: Khởi chạy riêng lẻ từng phần
- **Chạy Backend**:
  ```bash
  cd backend
  npm run dev
  ```
- **Chạy Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```

---

## ⚙️ CẤU HÌNH BIẾN MÔI TRƯỜNG (.env)

Tạo file `.env` từ file `.env.example` ở cả hai thư mục:

### 1. Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/wedding_dress_rental
CLIENT_URL=http://localhost:3000
```

### 2. Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Wedding Dress Rental
```

---

## 🌿 QUY CHUẨN GIT & LÀM VIỆC NHÓM (GIT CONVENTIONS)

Để đảm bảo lịch sử Git sạch đẹp và tránh xung đột mã nguồn (merge conflicts) giữa các thành viên:

### 1. Quy tắc phân nhánh (Branching Strategy)
- `main`: Nhánh chính thức, chỉ chứa code đã kiểm thử hoàn chỉnh và sẵn sàng deploy/demo. **Không được push trực tiếp lên main**.
- `develop`: Nhánh tích hợp chung của toàn nhóm trong suốt quá trình phát triển Sprint.
- Nhánh tính năng được tạo từ `develop` theo quy ước:
  - Tính năng mới: `feature/<story-id>-<tên-ngắn-gọn>` (Ví dụ: `feature/US-01-user-registration`)
  - Sửa lỗi: `bugfix/<tên-lỗi>` (Ví dụ: `bugfix/fix-token-expiration`)
  - Sửa lỗi khẩn cấp trên main: `hotfix/<tên-lỗi>`

### 2. Quy chuẩn viết Commit Message (Conventional Commits)
Cú pháp: `<type>: <mô tả ngắn gọn bằng tiếng Anh hoặc tiếng Việt>`
- `feat`: Thêm tính năng mới (Ví dụ: `feat: add dress listing page`)
- `fix`: Sửa lỗi (Ví dụ: `fix: handle 401 error in axios interceptor`)
- `docs`: Cập nhật tài liệu (Ví dụ: `docs: update product backlog`)
- `style`: Định dạng code, CSS không ảnh hưởng logic (Ví dụ: `style: adjust dress card padding`)
- `refactor`: Tái cấu trúc mã nguồn (Ví dụ: `refactor: optimize auth controller`)
- `chore`: Cấu hình build, cài thư viện, cấu hình git (Ví dụ: `chore: install concurrently`)

### 3. Quy trình làm việc nhóm
1. Kéo code mới nhất từ `develop` về trước khi làm việc:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Tạo nhánh làm việc mới:
   ```bash
   git checkout -b feature/US-01-register
   ```
3. Commit theo chuẩn và đẩy nhánh lên GitHub:
   ```bash
   git add .
   git commit -m "feat: implement register form validation"
   git push origin feature/US-01-register
   ```
4. Tạo **Pull Request (PR)** vào nhánh `develop` và yêu cầu ít nhất 1 thành viên review trước khi merge.

---

## 📋 TÀI LIỆU PRODUCT BACKLOG

Toàn bộ danh sách 22 User Stories, tiêu chí chấp nhận (Acceptance Criteria), phân bổ độ ưu tiên MoSCoW, Story Points và kế hoạch phân bổ Sprint chi tiết được lưu trữ tại file:
👉 **[PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md)**
