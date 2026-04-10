# FSELearningEnglish

## CI/CD (GitHub Actions → VPS)

Repo có 2 workflow deploy tự động khi push lên `main`:

- Backend: `.github/workflows/backend-deploy.yml`
- Frontend: `.github/workflows/frontend-deploy.yml`

### 1) GitHub Secrets cần khai báo

Vào **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret** và tạo các secret:

- `VPS_HOST`: IP/Domain của VPS (vd: `1.2.3.4`)
- `VPS_USER`: user SSH deploy (vd: `deploy`)
- `VPS_SSH_KEY`: private key (OpenSSH) để Actions SSH vào VPS
- `VPS_BACKEND_PATH`: thư mục deploy backend (vd: `/home/deploy/app/backend`)
- `VPS_BACKEND_SERVICE`: tên systemd service backend (vd: `elearning-backend.service`)
- `VPS_FRONTEND_PATH`: thư mục deploy frontend (vd: `/var/www/html`)

Gợi ý: tạo key pair trên máy local, add public key vào `~/.ssh/authorized_keys` của `VPS_USER`, rồi copy private key vào secret `VPS_SSH_KEY`.

### 2) Yêu cầu sudo trên VPS (không hỏi password)

Workflow dùng lệnh:

- `sudo systemctl restart <backend-service>`
- `sudo systemctl reload nginx`

Vì vậy user `VPS_USER` cần được allow các lệnh này **không cần password** (sudoers / NOPASSWD), nếu không deploy sẽ bị fail do không thể tương tác nhập mật khẩu trong GitHub Actions.

### 3) Khi nào workflow chạy?

- Tự chạy khi `push` lên `main` và có thay đổi trong:
	- `BackendELearningEnglish/**` (backend)
	- `FrontElearningEnglish/**` (frontend)
- Có thể chạy tay trong tab **Actions** (workflow_dispatch).