# Catalunya English - AI-Powered Intelligent English Learning Platform

<div align="center">
  <img src="./Office/Screenshot/Trangchu.png" alt="Catalunya English Homepage" width="100%"/>
</div>

> **Project Website:** [learning-eng.hocnghiepvu.com](https://learning-eng.hocnghiepvu.com)  
> **[Read this in Vietnamese 🇻🇳](./README.md)**

- **Live Demo:** https://learning-eng.hocnghiepvu.com  
- **Status:** Production  
- **Author:** Tran Nhat Minh  
- **Email:** nhatminh5224.forwork@gmail.com  

---

## ⚡ Quick Snapshot (15s Overview)

*   **Core:** AI-Powered English Learning SaaS (Hybrid Model).
*   **Tech Stack:** React 19 + .NET 8 + PostgreSQL (Pgvector).
*   **AI Engine:** RAG Chatbot (Semantic Kernel) + Azure Speech + Gemini.
*   **Adaptive Learning:** Spaced Repetition (SM-2 Algorithm).
*   **Fintech:** Wallet system + PayOS Integration + Audit Trail.
*   **Architecture:** Structured Monolith (Clean Architecture) + DDD + SOLID.
*   **DevOps:** GitHub Actions (CI/CD) + Linux VPS (Nginx, Systemd).

---

## 🌍 1. The Problem

English learning in Vietnam still faces several core limitations:
- **Inflexibility:** Dependence on physical centers and fixed schedules.
- **Lack of Personalization:** Mass-market curricula that don't adapt to individual proficiency.
- **High Cost:** Difficult for the majority to access quality education.
- **Lack of Practice Tools:** Especially for Speaking & Writing skills.
- **Scalability Issues:** Teachers are limited by physical space and lack management tools.

---

## 💡 2. The Solution

Based on this context, the project **"Building an AI-Integrated Hybrid E-learning SaaS Platform"** was born to thoroughly solve these issues through:

- **Hybrid Model:** Combining Standard Courses (System) and Private Classes (Teacher) to optimize cost and personalization.
- **AI-Powered:** Utilizing AI (RAG, Azure Speech) for 24/7 practice tools and tutoring. Specifically, the **RAG Chatbot** acts as an intelligent consultant, retrieving knowledge from internal datasets to respond to:
    - 📚 Detailed information and roadmaps for **Courses**.
    - 👨‍🏫 Benefits and quotas for **Teacher Packages**.
    - ⚖️ Platform operational **Policies & Regulations**.
- **Fintech & SaaS:** Transforming from a simple learning web into an educational business platform, empowering teachers to scale.

---

## 🏗️ 3. Infrastructure & Architecture

The system is designed as a **Hybrid Cloud Infrastructure**, optimizing security and performance through specialized technical layers:

### 🌐 3.1 Infrastructure Map

| Component | Technology | Primary Responsibility |
| :--- | :--- | :--- |
| **Security & DNS** | **Cloudflare** | SSL/TLS management, WAF shield against DDoS, and CDN optimization. |
| **Reverse Proxy** | **Nginx** | Traffic coordination, **Byte-range requests** for media streaming, and **300MB** upload limit. |
| **Frontend Server** | **Nginx Native** | Serving React 19 static files, handling routing via `try_files`. |
| **Backend API** | **.NET 8 Kestrel** | Business logic processing, isolated at port 5030 on Localhost for security. |
| **Object Storage** | **MinIO** | Centralized S3-compatible storage for Media (Video/Audio) resources. |
| **Database** | **PostgreSQL** | Relational data storage and Vector knowledge base for AI (pgvector). |

### 📂 3.2 Project Map (Clean Architecture)

The project applies a **Structured Monolith** model with clear separation between business logic and technical infrastructure:

```text
FSELearningEnglish/
├── BackendELearningEnglish/
│   ├── LearningEnglish.Domain/          # Heart: Contains Entities, Enums, core business rules.
│   ├── LearningEnglish.Application/     # Logic: Use-cases, DTOs, CQRS (MediatR), Validators.
│   ├── LearningEnglish.Infrastructure/  # Service: EF Core, MinIO, PayOS, AI Semantic Kernel.
│   └── LearningEnglish.API/             # Port: Controllers, Middlewares, Auth, Service Registry.
└── FrontElearningEnglish/               # UI: React 19, Bootstrap 5, CSS, TanStack Query, Recharts.
```

---

## 🏗️ 4. System Workflows (BPMN 2.0)

To ensure stability and fault-tolerance, all core logic is standardized using **BPMN 2.0** diagrams. This is the foundational documentation helping technical teams deeply understand data flows and business decision points.

- **Top-Up Flow**: PayOS integration, Webhook Idempotency handling.  
  [[📄 XML File]](./Office/BPMN/TopUp_Flow.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>Idempotency Check:</b> Uses a reference code to ensure a top-up transaction is not processed twice when multiple Webhooks are received.</li>
      <li><b>Status Synchronization:</b> Synchronizes wallet status immediately after verifying the signature from the payment gateway.</li>
    </ul>
    <img src="./Office/BPMN/TopUp_Flow.png" alt="Top-Up Flow" width="100%"/>
  </details>

- **Purchase Flow**: Atomic transactions for data consistency.  
  [[📄 XML File]](./Office/BPMN/Purchase_Flow.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>Atomic Transaction:</b> Ensures that payment deduction and course permission granting occur simultaneously. If one step fails, the entire transaction is rolled back.</li>
      <li><b>Audit Logging:</b> Records balance fluctuation history (Balance Before/After) for financial reconciliation.</li>
    </ul>
    <img src="./Office/BPMN/Purchare.png" alt="Purchase Flow" width="100%"/>
  </details>

### 🧠 4.2 Learning Engine Group
- **Quiz Lifecycle**: Quiz management, Auto-save, and Auto-submit.  
  [[📄 XML File]](./Office/BPMN/Quiz_Lifecycle.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>Real-time Persistence:</b> Saves answer states after every response to prevent data loss during network issues.</li>
      <li><b>Background Auto-Submit:</b> Uses Background Tasks to automatically collect and grade quizzes as soon as time expires.</li>
    </ul>
    <img src="./Office/BPMN/Quiz_Lifecycle.png" alt="Quiz Lifecycle" width="100%"/>
  </details>

- **Adaptive SRS**: SM-2 algorithm for optimized memory retention.  
  [[📄 XML File]](./Office/BPMN/SRS_Adaptive_Learning.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>SM-2 Implementation:</b> Automatically calculates <i>Easiness Factor</i> and <i>Interval</i> based on user difficulty ratings.</li>
      <li><b>Spaced Repetition:</b> Intelligent review scheduling to transfer knowledge from short-term to long-term memory.</li>
    </ul>
    <img src="./Office/BPMN/SRS_Adaptive_Learning.png" alt="Adaptive SRS" width="100%"/>
  </details>

### 🤖 4.3 AI & SaaS Administration Group
- **AI Knowledge Hub (RAG)**: Multi-source knowledge retrieval with Semantic Kernel.  
  [[📄 XML File]](./Office/BPMN/AI_RAG_Flow.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>Multi-source Retrieval:</b> Aggregates knowledge from Courses, Service Packages, and System Policies to provide the most accurate responses.</li>
      <li><b>Context Augmentation:</b> Optimizes prompts by inserting knowledge contexts processed through Vector Search.</li>
    </ul>
    <img src="./Office/BPMN/AI_RAG_Flow.png" alt="AI RAG Flow" width="100%"/>
  </details>

- **SaaS Quota Governance**: Controlling teacher resource quotas.  
  [[📄 XML File]](./Office/BPMN/SaaS_Quota_Governance.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>Resource Enforcement:</b> Automates quota checks (Student count, Course count) based on the teacher's Subscription package.</li>
      <li><b>Usage Analytics:</b> Provides real-time data on resource usage versus purchased quotas.</li>
    </ul>
    <img src="./Office/BPMN/SaaS_Quota_Governance.png" alt="SaaS Quota" width="100%"/>
  </details>

### 🔐 4.4 Security & Permissions Group
- **Identity Security**: OTP registration, Spam protection, and 5-layer security.  
  [[📄 XML File]](./Office/BPMN/Identity_Security_Flow.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>Rate Limiting:</b> Uses Memory Cache for cooldown mechanisms (60s) between OTP requests to prevent API spam.</li>
      <li><b>Brute-force Protection:</b> Automatically locks OTP codes after 5 consecutive incorrect attempts.</li>
    </ul>
    <img src="./Office/BPMN/Identity_Security_Flow.png" alt="Identity Security" width="100%"/>
  </details>

- **RBAC Security**: Role-Based Access Control.  
  [[📄 XML File]](./Office/BPMN/RBAC_Security_Flow.xml)
  <details>
    <summary>🖼️ View Detailed Diagram & Explanation</summary>
    <br/>
    <ul>
      <li><b>Middleware Authorization:</b> Checks permissions via Middleware before requests reach the Controller.</li>
      <li><b>Dynamic Role Management:</b> Supports real-time user permission updates without system restarts.</li>
    </ul>
    <img src="./Office/BPMN/RBAC_Security_Flow.png" alt="RBAC Security" width="100%"/>
  </details>

> [!NOTE]  
> All detailed design files are located in: [`Office/BPMN/`](./Office/BPMN/)

---

## 📄 5. Database Design

The system uses **PostgreSQL** with 40+ entities organized for data integrity and auditability.

> [!TIP]
> **Detailed Database Documentation (Multi-format):**
> *   🌐 [**Interactive Diagram (dbdiagram.io)**](https://dbdiagram.io/d/69f670d2c6a36f9c1be58625)
> *   🖼️ **View Diagram:** [PNG](./Office/DB/Untitled.png) | [📐 SVG Vector (Recommended)](./Office/DB/Untitled.svg)
> *   📄 **Offline Documentation:** [PDF](./Office/DB/Untitled.pdf) | [💾 SQL Schema](./Office/DB/Untitled.sql)

### 💎 5.1 Core Business Pillars & Data Structures

| Module | Core Entities | Data Relationship Structure |
| :--- | :--- | :--- |
| **🔐 Identity** | `User`, `Role`, `RolePermission` | RBAC implementation, N-N link between Roles and Permissions. |
| **📚 LMS Core** | `Course`, `Module`, `Lesson`, `Quiz` | Strict 1-N hierarchy, optimized for learning content queries. |
| **📊 Adaptive** | `Progress`, `QuizResult` | History tracking for SM-2 parameter calculations (Interval, Repetition). |
| **💳 Fintech** | `Wallet`, `PaymentTransaction`, `WebhookQueue` | Audit Trail storage with Append-Only mechanism for balance history. |
| **🧠 AI Vector** | `CourseKnowledge`, `PolicyKnowledge` | Integration of Vector data types (pgvector) for AI Semantic Search. |
| **👩‍🏫 SaaS Mgr** | `TeacherPackage`, `TeacherSubscription` | Teacher package lifecycle management (Start/End Date, Quotas). |
| **📝 Evaluation** | `Essay`, `EssaySubmission`, `Pronunciation` | Linking learners and evaluation results (Teacher-graded or AI-graded). |

---

## 🚀 6. Tech Stack & Architecture

### 💻 6.1 Frontend (React Ecosystem)
- **Core:** Built on the latest **React 19**.
- **State Management & Caching:** **TanStack Query** for optimized caching and asynchronous data handling.
- **UI/UX:** **100% Responsive** design using **Bootstrap 5**.
- **Data Visualization:** Professional reporting charts using **Recharts**.

### ⚙️ 6.2 Backend (Structured Monolith & Clean Architecture)
The system is designed with a **Structured Monolith** architecture, combining **Domain-Driven Design (DDD)** and **SOLID** principles.
- **Domain Layer**: Core Entities, Enums, and Interfaces. Library-independent.
- **Application Layer**: Use Cases, DTOs, AutoMapper, FluentValidation. Implements **CQRS** via MediatR.
- **Infrastructure Layer**: EF Core/PostgreSQL, Memory Cache, MinIO, External APIs (PayOS, Azure Speech, Gemini).
- **Presentation Layer (Web API)**: Controllers, Custom Middleware (Rate Limiting), Dependency Injection.

### 🧠 6.3 Advanced Backend Engineering
- **Practical Design Patterns:**
  - **Strategy Pattern:** Scoring systems (`IScoringStrategy`: *Multiple choice, Fill-in-blanks, etc.*).
  - **Repository & Unit of Work:** Centralized transaction management for atomicity.
  - **CQRS Pattern:** `MediatR` for complex Command/Query flow orchestration.
- **Fault Tolerance & Background Processing:**
  - **Retry Pattern:** `WebhookRetryService` for payment webhooks.
  - **Garbage Collection (GC) Jobs:** `IHostedService` for system cleanup (OTP, MinIO temp files).
- **Security & Reliability:**
  - **Rate Limiting:** Against brute-force and API spam.
  - **Policy-based Authorization:** Dynamic permissions via Custom Authorization Handlers.

---

## 🚀 7. Deployment & DevOps

### 🔄 7.1 CI/CD Lifecycle (GitHub Actions)
- **CI Pipeline**: Automated Build, Restore, and Linting for Frontend/Backend.
- **CD Pipeline**: Self-hosted Linux Runner for deployment:
    - **Backend**: App packaging, EF Migration Bundles, Schema updates.
    - **Frontend**: Source build and Web Server synchronization.
    - **Service Management**: Automatic Systemd Service restarts.

### 🌐 7.2 Production Infrastructure (Native Linux Deployment)
- **Server:** Ubuntu VPS, managed via **Systemd Services**.
- **Web Server:** **Nginx** as Reverse Proxy with SSL (HTTPS) and Gzip.
- **Storage Strategy (MinIO):** Centralized S3-compatible media management.

---

## 🛠️ 8. Setup & Development
👉 **[View Detailed Installation Guide at SETUP.md](./SETUP.md)**

---

## 🌟 9. Key Featured Highlights

### 🤖 9.1 AI RAG System (Retrieval-Augmented Generation)
<div align="center">
  <img src="./Office/Screenshot/chatbot0.png" alt="AI RAG Chatbot 1" width="45%"/>
  <img src="./Office/Screenshot/chatbot1.png" alt="AI RAG Chatbot 2" width="45%"/>
</div>
- AI retrieves internal knowledge (Courses, Policies) using **Semantic Kernel** to reduce hallucinations.

### 📈 9.2 Smart Flashcards (Adaptive Learning - SM-2)
<div align="center">
  <img src="./Office/Screenshot/Ontaptuvung.png" alt="Adaptive Learning" width="800"/>
</div>
- **Mechanism:** Implements **SuperMemo-2 (SM-2)** algorithm to automate personalized review intervals via digital flashcards.
- **Value:** Optimizes long-term memory by calculating the "Golden Interval" for vocabulary reviews based on active recall.

### 🏆 9.3 Gamification & Learning Analytics
<div align="center">
  <img src="./Office/Screenshot/lichsulambai.png" alt="Learning Analytics" width="800"/>
</div>
- **Mechanism:** Visualizes learning data through interactive charts (Recharts).
- **Value:** Tracks detailed practice history, accuracy rates, and course completion progress, keeping learners motivated through visible growth.

### 👩‍🏫 9.3 SaaS "Teacher Empowerment" Model
<div align="center">
  <img src="./Office/Screenshot/Giaodiengiaovien.png" alt="Teacher SaaS Dashboard" width="800"/>
</div>
- Empowering teachers with private spaces and subscription quota management.

### 💳 9.4 Fintech Wallet & Auto-Payment
<div align="center">
  <img src="./Office/Screenshot/naptien.png" alt="Fintech Wallet" width="800"/>
</div>
- **PayOS (QR Code)** integration with automated updates and **Audit Trail**.

### 🎤 9.5 AI Pronunciation Assessment
<div align="center">
  <img src="./Office/Screenshot/champhatam.png" alt="AI Pronunciation Assessment" width="800"/>
</div>
- Real-time phoneme-level analysis via **Azure Speech Services**.

---

## 📸 10. UI Gallery
<details>
  <summary><b>1. Learning Space & Lectures</b></summary>
  <div align="center">
    <img src="./Office/Screenshot/Trangkhoahoc.png" alt="Course Page" width="800"/><br/>
    <img src="./Office/Screenshot/baigiang.png" alt="Lecture 1" width="400"/>
    <img src="./Office/Screenshot/baigiang2.png" alt="Lecture 2" width="400"/><br/>
    <img src="./Office/Screenshot/lambaiquiz.png" alt="Quiz Practice" width="400"/>
    <img src="./Office/Screenshot/ketthucbaiquuz.png" alt="Quiz Finish" width="400"/>
  </div>
</details>

<details>
  <summary><b>2. System Admin & SaaS Dashboard</b></summary>
  <div align="center">
    <img src="./Office/Screenshot/dashboard.png" alt="Admin Dashboard" width="800"/><br/>
    <img src="./Office/Screenshot/dashboadRBAC.png" alt="RBAC Admin" width="400"/>
    <img src="./Office/Screenshot/dashboadusser.png" alt="User Admin" width="400"/><br/>
    <img src="./Office/Screenshot/dashboardcourse.png" alt="Course Admin" width="400"/>
    <img src="./Office/Screenshot/DarshboardQLbainop.png" alt="Submission Admin" width="400"/>
  </div>
</details>

<details>
  <summary><b>3. Personalization & User Portal</b></summary>
  <div align="center">
    <img src="./Office/Screenshot/Dardboardlsgiaodich.png" alt="Transaction History" width="800"/><br/>
    <img src="./Office/Screenshot/naptien.png" alt="Top-up" width="400"/>
    <img src="./Office/Screenshot/lichsunaptien.png" alt="Top-up History" width="400"/><br/>
    <img src="./Office/Screenshot/lichsulambai.png" alt="Practice History" width="800"/>
  </div>
</details>

---

## 🚀 Performance & Optimization (Lighthouse Audit)

<div align="center">
  <h4>📱 Mobile Audit</h4>
  <img src="https://img.shields.io/badge/SEO-100%2F100-brightgreen?style=for-the-badge&logo=google" alt="SEO 100"/>
  <img src="https://img.shields.io/badge/Accessibility-96%2F100-blue?style=for-the-badge&logo=accessible-icon" alt="Accessibility 96"/>
  <img src="https://img.shields.io/badge/Best_Practices-100%2F100-brightgreen?style=for-the-badge&logo=lighthouse" alt="Best Practices 100"/>
  <img src="https://img.shields.io/badge/Performance-85%2F100-green?style=for-the-badge&logo=speedtest" alt="Performance Mobile 85"/>
  <br/><br/>
  <h4>💻 Desktop Audit</h4>
  <img src="https://img.shields.io/badge/SEO-100%2F100-brightgreen?style=for-the-badge&logo=google" alt="SEO 100"/>
  <img src="https://img.shields.io/badge/Accessibility-96%2F100-blue?style=for-the-badge&logo=accessible-icon" alt="Accessibility 96"/>
  <img src="https://img.shields.io/badge/Best_Practices-100%2F100-brightgreen?style=for-the-badge&logo=lighthouse" alt="Best Practices 100"/>
  <img src="https://img.shields.io/badge/Performance-97%2F100-brightgreen?style=for-the-badge&logo=speedtest" alt="Performance Desktop 97"/>
</div>

### 📊 Core Web Vitals
| Metric | Results (Desktop) 💻 | Results (Mobile) 📱 | Technical Meaning |
| :--- | :---: | :---: | :--- |
| **Performance Score** | **97 / 100** | **85 / 100** | Optimized loading state (Green zone). |
| **Total Blocking Time** | **0 ms** | **20 ms** | Minimal lag during JS execution. |
| **Largest Contentful Paint**| **1.0 s** | **3.6 s** | Extremely fast primary content display. |
| **SEO** | **100 / 100** | **100 / 100** | Absolute search optimization. |

### 🛠 Performance Tuning Strategies
1.  **Lazy Loading Third-party Scripts:** Custom `useScript` hook to delay Google/FB SDKs, reducing Mobile TBT by 99%.
2.  **Infrastructure Optimization:** **Nginx Gzip (Level 6)** and **Browser Caching (1 year)**.
3.  **Image & Resource Priority:** `loading="lazy"` and `fetchpriority="high"` for LCP components.
4.  **JS Code Splitting:** React `lazy` and `Suspense` for 60+ routes and heavy widgets.
5.  **Font & DNS Optimization:** `preconnect` for Google Fonts and CDN usage.

---

## 🛡 QA & Security

### 🔍 Search Engine Optimization (SEO)
- **Dynamic Metadata:** **`react-helmet-async`** for dynamic page titles and tags.
- **Structured Data (Schema.org):** **JSON-LD Schema** for Google Rich Snippets.
- **Social Branding:** Open Graph and Twitter Cards with professional `og:image`.
- **Sitemap & Indexing:** Automated `sitemap.xml` and `robots.txt` for efficient crawling.
- **User Analytics:** Integrated **Google Analytics 4 (GA4)** with a 3s Lazy-loading mechanism to track user behavior without compromising Lighthouse performance scores.

### 📈 Stress Testing
- **Scalability:** Passed **2,000 Concurrent Users** without performance degradation.
- **Throughput:** Handled **~900 Requests Per Second (RPS)**.
- **Reliability:** **0.00% Error Rate** with **252ms p95 latency** at peak load.

### 🔐 Infrastructure Security
- **Hardened Nginx:** Security headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `X-Frame-Options`).
- **Data Integrity:** Strict input validation for financial transactions.
- **Audit Trail:** Balance history tracking to prevent fraud.

### 📸 Evidence
<div align="center">
  <img src="Office/Screenshot/performanceMobile.png" width="45%" alt="Lighthouse Mobile Score">
  <img src="Office/Screenshot/PerformanceDesktop.png" width="45%" alt="Lighthouse Desktop Score">
  <img src="Office/Screenshot/K6.png" width="45%" alt="k6 Load Test Result 1">
  <img src="Office/Screenshot/k62.png" width="45%" alt="k6 Load Test Result 2">
</div>

---

## 🤝 Contact

- **Author:** Tran Nhat Minh
- **LinkedIn:** [linkedin.com/in/trannhatminh05022004](https://www.linkedin.com/in/trannhatminh05022004/)
- **Facebook:** [facebook.com/Trannhatminh05022004](https://www.facebook.com/Trannhatminh05022004/)
- **Phone:** 0862359426
- **Email:** nhatminh5224.forwork@gmail.com
- **Project URL:** [https://github.com/TranNhatMinh5224/FSELearningEnglish](https://github.com/TranNhatMinh5224/FSELearningEnglish)

---
<div align="center">
  Made with ❤️ by Tran Nhat Minh
</div>