<div align="center">

# 🎲 Titipool VTT (تیتی‌پول)
### اولین و سریع‌ترین میز بازی مجازی فارسی برای D&D 5e و بازی‌های نقش‌آفرینی رومیزی
**The First High-Performance Persian Virtual Tabletop (VTT) Platform**

[![Live Production](https://img.shields.io/badge/Live-titipoolgames.ir-f59e0b?style=for-the-badge&logo=googlechrome&logoColor=black)](https://titipoolgames.ir)
[![Java 21](https://img.shields.io/badge/Java-21%20(Virtual%20Threads)-ed8b00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot 3.3](https://img.shields.io/badge/Spring%20Boot-3.3.5-6db33f?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LiveKit SFU](https://img.shields.io/badge/Voice-LiveKit%20WebRTC-00b4d8?style=for-the-badge&logo=webrtc&logoColor=white)](https://livekit.io/)

</div>

---

## 📖 معرفی محصول (Overview)
**تیتی‌پول (Titipool)** یک پلتفرم میز مجازی تحت وب (Virtual Tabletop) است که از ریشه برای جامعه فارسی‌زبان بازی‌های نقش‌آفرینی رومیزی (**Dungeons & Dragons 5e**) مهندسی شده است. این سامانه با ترکیب بوم گرافیکی دوبعدی ۶۰ فریم بر ثانیه (**Konva**)، شبیه‌ساز فیزیکی سه‌بعدی تاس (**Three.js + Rapier WASM**)، ارتباط صوتی بلادرنگ (**LiveKit SFU**) و همگام‌سازی بدون انسداد (**STOMP WebSocket + Java 21 Virtual Threads**) تجربه‌ای روان روي دسکتاپ و موبایل فراهم می‌کند.

### ✨ ویژگی‌های کلیدی (Key Features)
* **🗺️ بوم تاکتیکال ۶۰ فریم بر ثانیه (2D Tactical Canvas):** پشتیبانی از شبکه‌های مربعی، ایزومتریک و شش‌ضلعی (افقی/عمودی)، اسنپ مغناطیسی توکن‌ها، پینگ راداری و نشانگر لیزری زنده.
* **🌫️ سیستم مه جنگ پیشرفته (Fog of War):** دارای حالت‌های پوشاندن (`Hide`)، برش (`Slice`)، آشکارساز سراسری (`Global Reveal`) و ابزارهای تطبیق خودکار (`Fit`, `Trim`, `Join`, `Overlay`).
* **🎲 موتور تاس سه‌بعدی فیزیکی (3D Rapier Dice Engine):** پشتیبانی از ۱۰ نوع تاس (`D2` تا `D1000` و `Fudge`) با ۶ بافت سنگ مرمر، صداگذاری سنتزشده برخورد، تشخیص ضربه کریتیکال (`Nat 20`) و قابلیت برداشتن و پرتاب مجدد تاس با ماوس یا لمس انگشت (`Re-throw`).
* **🎙️ چت صوتی بلادرنگ داخلی (LiveKit SFU Voice):** ارتباط صوتی کم‌تاخیر با کدک `Opus`، کلید `Space` (Push/Toggle)، نمایشگر موج صوتی گوینده و مدیریت بی‌صدا کردن (`Server-Enforced Mute`) توسط دانجن‌مستر.
* **⚔️ مدیریت جامع توکن و نبرد D&D 5e:** نوار سلامتی (`HP`) با ماشین‌حساب آسیب/شفا، کلاس زره (`AC`)، ۱۶ وضعیت استاندارد D&D، یادداشت‌های محرمانه GM و فیلتر امنیتی لایه مخفی GM در سمت سرور.
* **📱 تجربه اختصاصی موبایل (Mobile-First VTT UX):** پشتیبانی از `Pinch-to-Zoom` دو انگشتی، شیت‌های پایینی (`Bottom Sheets`) و رعایت کامل `Safe-Area`.

---

## 🏗️ معماری سیستم (System Architecture)

```mermaid
graph TD
    subgraph Client ["Client Browser (Desktop & Mobile PWA)"]
        UI["React 19 + Tailwind 4 UI (RTL)"]
        Store["Zustand 5 State Stores"]
        Konva["Konva 2D Tactical Canvas (60 FPS)"]
        Three["Three.js + Rapier WASM 3D Dice"]
        WSClient["STOMP WebSocket Client"]
        LKClient["LiveKit WebRTC Audio Client"]
    end

    subgraph Edge ["Production Server (Docker / Linux)"]
        Nginx["Nginx Reverse Proxy (TLS 1.3, GZIP/WASM, Static Cache)"]
        LKServer["LiveKit SFU Server (UDP/TCP WebRTC)"]
    end

    subgraph Backend ["Spring Boot 3.3 Backend (Java 21 Virtual Threads)"]
        Sec["Stateless JWT + OAuth2 Hybrid Security"]
        REST["REST Controllers"]
        Broker["STOMP Broker + O(1) RoomSessionManager"]
        Async["@Async Virtual-Thread Pool (wsTaskExecutor)"]
        Cache["Caffeine In-Memory Cache (W-TinyLFU)"]
        Media["In-Memory Thumbnailator + StorageService"]
    end

    subgraph Data ["Persistence"]
        PG[("PostgreSQL 16 (Flyway V1..V6)")]
    end

    UI --> Store
    Store --> Konva & Three & WSClient & LKClient
    UI -- "HTTPS REST (/api/*)" --> Nginx
    WSClient -- "WSS STOMP (/ws)" --> Nginx
    LKClient -- "WebRTC Opus Audio" --> LKServer
    Nginx --> Sec
    Sec --> REST & Broker
    Broker -- "Zero-Blocking Broadcast (<15ms)" --> WSClient
    Broker -. "Decoupled DB Write" .-> Async
    REST & Async --> Cache
    Cache --> PG
    REST --> Media
    <div align="center">

# 🎲 Titipool VTT (تیتی‌پول)
### اولین و سریع‌ترین میز بازی مجازی فارسی برای D&D 5e و بازی‌های نقش‌آفرینی رومیزی
**The First High-Performance Persian Virtual Tabletop (VTT) Platform**

[![Live Production](https://img.shields.io/badge/Live-titipoolgames.ir-f59e0b?style=for-the-badge&logo=googlechrome&logoColor=black)](https://titipoolgames.ir)
[![Java 21](https://img.shields.io/badge/Java-21%20(Virtual%20Threads)-ed8b00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot 3.3](https://img.shields.io/badge/Spring%20Boot-3.3.5-6db33f?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LiveKit SFU](https://img.shields.io/badge/Voice-LiveKit%20WebRTC-00b4d8?style=for-the-badge&logo=webrtc&logoColor=white)](https://livekit.io/)

</div>

---

## 📖 معرفی محصول (Overview)
**تیتی‌پول (Titipool)** یک پلتفرم میز مجازی تحت وب (Virtual Tabletop) است که از ریشه برای جامعه فارسی‌زبان بازی‌های نقش‌آفرینی رومیزی (**Dungeons & Dragons 5e**) مهندسی شده است. این سامانه با ترکیب بوم گرافیکی دوبعدی ۶۰ فریم بر ثانیه (**Konva**)، شبیه‌ساز فیزیکی سه‌بعدی تاس (**Three.js + Rapier WASM**)، ارتباط صوتی بلادرنگ (**LiveKit SFU**) و همگام‌سازی بدون انسداد (**STOMP WebSocket + Java 21 Virtual Threads**) تجربه‌ای روان روی دسکتاپ و موبایل فراهم می‌کند.

### ✨ ویژگی‌های کلیدی (Key Features)
* **🗺️ بوم تاکتیکال ۶۰ فریم بر ثانیه (2D Tactical Canvas):** پشتیبانی از شبکه‌های مربعی، ایزومتریک و شش‌ضلعی (افقی/عمودی)، اسنپ مغناطیسی توکن‌ها، پینگ راداری و نشانگر لیزری زنده.
* **🌫️ سیستم مه جنگ پیشرفته (Fog of War):** دارای حالت‌های پوشاندن (`Hide`)، برش (`Slice`)، آشکارساز سراسری (`Global Reveal`) و ابزارهای تطبیق خودکار (`Fit`, `Trim`, `Join`, `Overlay`).
* **🎲 موتور تاس سه‌بعدی فیزیکی (3D Rapier Dice Engine):** پشتیبانی از ۱۰ نوع تاس (`D2` تا `D1000` و `Fudge`) با ۶ بافت سنگ مرمر، صداگذاری سنتزشده برخورد، تشخیص ضربه کریتیکال (`Nat 20`) و قابلیت برداشتن و پرتاب مجدد تاس با ماوس یا لمس انگشت (`Re-throw`).
* **🎙️ چت صوتی بلادرنگ داخلی (LiveKit SFU Voice):** ارتباط صوتی کم‌تاخیر با کدک `Opus`، کلید `Space` (Push/Toggle)، نمایشگر موج صوتی گوینده و مدیریت بی‌صدا کردن (`Server-Enforced Mute`) توسط دانجن‌مستر.
* **⚔️ مدیریت جامع توکن و نبرد D&D 5e:** نوار سلامتی (`HP`) با ماشین‌حساب آسیب/شفا، کلاس زره (`AC`)، ۱۶ وضعیت استاندارد D&D، یادداشت‌های محرمانه GM و فیلتر امنیتی لایه مخفی GM در سمت سرور.
* **📱 تجربه اختصاصی موبایل (Mobile-First VTT UX):** پشتیبانی از `Pinch-to-Zoom` دو انگشتی، شیت‌های پایینی (`Bottom Sheets`) و رعایت کامل `Safe-Area`.

---

## 🏗️ معماری سیستم (System Architecture)

```mermaid
graph TD
    subgraph Client ["Client Browser (Desktop & Mobile PWA)"]
        UI["React 19 + Tailwind 4 UI (RTL)"]
        Store["Zustand 5 State Stores"]
        Konva["Konva 2D Tactical Canvas (60 FPS)"]
        Three["Three.js + Rapier WASM 3D Dice"]
        WSClient["STOMP WebSocket Client"]
        LKClient["LiveKit WebRTC Audio Client"]
    end

    subgraph Edge ["Production Server (Docker / Linux)"]
        Nginx["Nginx Reverse Proxy (TLS 1.3, GZIP/WASM, Static Cache)"]
        LKServer["LiveKit SFU Server (UDP/TCP WebRTC)"]
    end

    subgraph Backend ["Spring Boot 3.3 Backend (Java 21 Virtual Threads)"]
        Sec["Stateless JWT + OAuth2 Hybrid Security"]
        REST["REST Controllers"]
        Broker["STOMP Broker + O(1) RoomSessionManager"]
        Async["@Async Virtual-Thread Pool (wsTaskExecutor)"]
        Cache["Caffeine In-Memory Cache (W-TinyLFU)"]
        Media["In-Memory Thumbnailator + StorageService"]
    end

    subgraph Data ["Persistence"]
        PG[("PostgreSQL 16 (Flyway V1..V6)")]
    end

    UI --> Store
    Store --> Konva & Three & WSClient & LKClient
    UI -- "HTTPS REST (/api/*)" --> Nginx
    WSClient -- "WSS STOMP (/ws)" --> Nginx
    LKClient -- "WebRTC Opus Audio" --> LKServer
    Nginx --> Sec
    Sec --> REST & Broker
    Broker -- "Zero-Blocking Broadcast (<15ms)" --> WSClient
    Broker -. "DecUpB Write" .-> Async
    REST & Async --> Cache
    Cache --> PG
    REST --> Media
```

---

## 🛠️ استک فناوری (Tech Stack)

| لایه | فناوری‌های استفاده‌شده |
| :--- | :--- |
| **Backend** | Java 21 (Virtual Threads), Spring Boot 3.3.5, Spring Security 6, Spring WebSocket (STOMP), Hibernate / JPA, Caffeine Cache, Thumbnailator, JJWT (HS256), Google OAuth2, Micrometer & Logback Async |
| **Database** | PostgreSQL 16, Flyway Migrations (`V1` to `V6`), JSONB Partial & Functional B-Tree Indexes, HikariCP |
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, Zustand 5, React-Konva 19, Three.js / React-Three-Fiber / Rapier 3D Physics, LiveKit Client, React Hook Form + Zod 4 |
| **Infrastructure** | Docker & Docker Compose, Nginx (HTTP/2, TLS Session Cache, WASM Compression), LiveKit SFU Server, Let's Encrypt Wildcard SSL |

---

## 📂 ساختار مخزن (Monorepo Structure)

```text
Titipool/
├── Backend/V.1.0/                  # سرویس بک‌اند Spring Boot 3.3 (Java 21)
│   ├── Dockerfile                  # بیلد دو مرحله‌ای Maven + Eclipse Temurin 21 JRE Alpine
│   ├── pom.xml                     # وابستگی‌ها و پلاگین‌های Maven
│   └── src/main/
│       ├── java/com/VTT/V10/
│       │   ├── auth/               # احراز هویت هیبریدی JWT + Refresh Cookie + Google OAuth
│       │   ├── user/               # پروفایل، آواتار RPG، تغییر رمز و تایید ایمیل (OTP)
│       │   ├── room/               # مدیریت اتاق، صحنه، توکن، نقاشی، مه جنگ و پرمیشن‌ها
│       │   ├── websocket/          # کنترلر STOMP و رجیستری O(1) RoomSessionManager
│       │   ├── asset/              # اعتبارسنجی Magic Bytes و فشرده‌سازی تصویر در رم
│       │   ├── voice/              # امضای توکن‌های صوتی LiveKit SFU
│       │   ├── monitoring/         # فیلتر MDC، لاگ‌های امنیتی/پرفورمنس و متریک‌ها
│       │   └── config/             # تنظیمات امنیت، کش Caffeine، وب‌سوکت و تردهای مجازی
│       └── resources/
│           ├── application.yml
│           ├── logback-spring.xml
│           └── db/migration/       # اسکریپت‌های Flyway (V1 تا V6)
│
└── Frontend/                       # اپلیکیشن فرانت‌اند React 19 + Vite 6
    ├── Dockerfile                  # بیلد Node 20 Alpine + وب‌سرور Nginx
    ├── nginx.conf                  # کانفیگ پروداکشن Nginx (دامنه‌های .ir و .com)
    ├── public/
    │   └── presets/                # نقشه‌ها و توکن‌های پیش‌فرض بهینه‌شده (.webp)
    └── src/
        ├── api/                    # کلاینت Axios با تمدید خودکار Refresh Token
        ├── components/             # کامپوننت‌های بوم (Konva)، اتاق بازی، داشبورد و لندینگ
        ├── features/dice/          # موتور تاس سه‌بعدی (Three.js + Rapier WASM + WebAudio)
        ├── hooks/                  # هوک‌های وب‌سوکت، چت صوتی، دسترسی‌ها و بوم
        ├── pages/                  # صفحات اصلی (Landing, Auth, Dashboard, Profile, Room)
        └── stores/                 # استورهای Zustand (auth, room, scene, canvas, dice)
```

---

## 🚀 راه‌اندازی و استقرار (Deployment & Local Setup)

### ۱. اجرا با Docker Compose (محیط Production)
```bash
docker compose up -d --build
```

### ۲. اجرای محیط توسعه محلی (Local Development)

**اجرای بک‌اند:**
```bash
cd Backend/V.1.0
./mvnw spring-boot:run
```

**اجرای فرانت‌اند:**
```bash
cd Frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 👨‍💻 توسعه‌دهنده و معمار سیستم (Author)
* **مانی مردآزاد ناوی (Mani Mardazad Navi)** — *Creator & Lead System Architect*
* **وب‌سایت رسمی:** [https://titipoolgames.ir](https://titipoolgames.ir)
* **پشتیبانی:** `support@titipoolgames.ir`