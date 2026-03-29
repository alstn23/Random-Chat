# 💬 1:1 랜덤 채팅

> 익명으로 실시간 대화를 나눌 수 있는 1:1 랜덤 채팅 웹 서비스

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## 📋 목차

- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [설치 및 실행](#-설치-및-실행)
- [환경 변수](#-환경-변수)
- [프로젝트 구조](#-프로젝트-구조)

---

## 🌟 소개

웹소켓 기반의 실시간 1:1 익명 채팅 서비스입니다. 빠른 대기열 매칭 시스템과 다양한 보호 기능을 통해 쾌적한 채팅 환경을 제공합니다.

---

## ✨ 주요 기능

### 💡 실시간 1:1 매칭
- 대기열 기반의 빠른 상대방 매칭
- 본인 / 상대방 **성별(Gender) 설정**에 따른 맞춤형 매칭 지원

### 📨 텍스트 및 이미지 전송
- 실시간 텍스트 채팅
- 이미지 첨부 전송 지원
- 수신 이미지는 **기본 블러 처리** → 확인 버튼으로 원본 열람

### ⌨️ 채팅 편의 기능
- 상대방의 타이핑 상태 표시 (`"상대방이 입력 중입니다..."`)

### 👥 친구 및 차단 시스템
- 마음에 드는 상대에게 **친구 요청** 전송 (최대 10명)
- 원치 않는 상대 **차단** → 이후 매칭에서 자동 제외

### 🛡️ 어뷰징 및 도배 방지
- 메시지 / 이미지 연속 전송 제한 (도배 시 쿨타임 적용)
- 너무 빠른 재매칭 요청 제한
- 인증 API 무차별 대입 방지 (`express-rate-limit`)

### 🕐 자리비움(AFK) 감지
- 매칭 후 **20초** 동안 양측의 첫 메시지가 없으면 방 자동 종료 → 유령 사용자 방지

### 🔐 보안 및 인증
- **JWT** 기반 익명 사용자 ID 발급
- 쿠키 기반 세션 유지

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | Node.js, Express, Socket.io |
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **인증** | JSON Web Token (JWT), cookie-parser |
| **보안** | express-rate-limit, dotenv |

---

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install express socket.io cookie-parser jsonwebtoken express-rate-limit dotenv
```

### 2. 환경 변수 설정

프로젝트 루트 경로에 `.env` 파일을 생성합니다.

```env
JWT_SECRET=여기에_원하는_비밀키_입력
PORT=3000
```

### 3. 서버 실행

```bash
node server.js
```

### 4. 접속

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다.

---

## ⚙️ 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `JWT_SECRET` | JWT 서명에 사용할 비밀키 | `my_super_secret_key` |
| `PORT` | 서버 포트 번호 | `3000` |

---

## 📁 프로젝트 구조

```
📦 프로젝트 루트
├── server.js          # 메인 서버 (Express + Socket.io)
└── sockets/
|   └── randomChatHandler.js
└── public/            # 정적 파일 (HTML, CSS, JS)
    ├── index.html
    ├── style.css
    └── app.js
```

---

## ⚠️ 주의사항

- `.env` 파일은 절대 GitHub에 올리지 마세요. `.gitignore`에 반드시 포함시키세요.
- 프로덕션 환경에서는 HTTPS 및 보안 쿠키 설정을 적용하는 것을 권장합니다.

---

## 📄 라이선스

This project is licensed under the MIT License.
