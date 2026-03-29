# 💬 1:1 랜덤 채팅

익명으로 낯선 사람과 실시간 1:1 채팅을 나눌 수 있는 웹 애플리케이션입니다.  
Socket.IO 기반의 실시간 매칭 시스템과 Firebase 이미지 업로드, JWT 인증을 지원합니다.

---

## 주요 기능

- **랜덤 매칭** — 성별 필터를 설정하여 원하는 상대와 매칭
- **실시간 채팅** — Socket.IO를 통한 텍스트 및 이미지 전송
- **타이핑 인디케이터** — 상대방이 입력 중일 때 실시간 표시
- **친구 추가** — 채팅 중 상대방에게 친구 요청 전송 및 수락/거절
- **차단 기능** — 특정 유저를 차단하여 매칭에서 제외
- **이미지 전송** — Firebase Storage를 통한 이미지 업로드 및 전송
- **JWT 인증** — HttpOnly 쿠키 기반 무상태 인증 (유효기간 3일)

---

## 어뷰징 방지

| 항목 | 제한 |
|---|---|
| 매칭 요청 | 5초 내 5회 초과 시 차단 |
| 이미지 연속 전송 | 텍스트 없이 연속 이미지 전송 불가 |
| 이미지 도배 | 10초 내 3장 이상 전송 시 1시간 차단 |
| 친구 요청 | 한 채팅방 내 최대 3회, 2초 내 3회 초과 시 무시 |
| 친구 수 제한 | 최대 10명 |
| 메시지 길이 | 최대 1,000자 |
| 인증 API | 분당 10회 요청 제한 |

---

## 기술 스택

**Backend**
- Node.js, Express
- Socket.IO
- JSON Web Token (jsonwebtoken)
- express-rate-limit
- dotenv

**Frontend**
- Vanilla HTML / CSS / JavaScript
- Socket.IO Client

**인프라 / 외부 서비스**
- Firebase Storage (이미지 업로드)

---

## 프로젝트 구조

```
├── server.js                  # 메인 서버, Socket.IO 설정, JWT 인증
├── sockets/
│   └── randomChatHandler.js   # 랜덤 매칭 및 채팅 소켓 이벤트 핸들러
├── public/
│   ├── chat.html              # 채팅 UI
│   ├── chat.js                # 채팅 클라이언트 로직
│   ├── common.css
│   ├── chat-room.css
│   ├── particle.js
│   └── js/
│       └── firebase-client.js # Firebase 이미지 업로드 모듈
└── .env                       # 환경변수 (아래 참고)
```

---

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 입력합니다.

```env
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

> Firebase 관련 설정은 `public/js/firebase-client.js`에서 별도로 구성합니다.

### 4. 서버 실행

```bash
node server.js
```

브라우저에서 `http://localhost:3000` 접속

---

## Socket.IO 이벤트

### 클라이언트 → 서버

| 이벤트 | 설명 |
|---|---|
| `registerUser` | JWT 쿠키를 검증하여 소켓 인증 |
| `requestMatch` | 랜덤 매칭 요청 (성별, 차단목록 포함) |
| `sendMessage` | 텍스트 메시지 전송 |
| `sendImage` | 이미지 URL 전송 |
| `typing` / `stopTyping` | 타이핑 상태 전달 |
| `sendFriendRequest` | 친구 요청 전송 |
| `friendRequestAccepted` | 친구 요청 수락 |
| `friendRequestDeclined` | 친구 요청 거절 |
| `leaveRoom` | 채팅방 퇴장 |

### 서버 → 클라이언트

| 이벤트 | 설명 |
|---|---|
| `authSuccess` / `authFailed` | 인증 결과 |
| `matched` | 매칭 성공 |
| `waiting` | 매칭 대기 중 |
| `receiveMessage` | 텍스트 메시지 수신 |
| `receiveImage` | 이미지 수신 |
| `partnerTyping` / `partnerStopTyping` | 상대방 타이핑 상태 |
| `receiveFriendRequest` | 친구 요청 수신 |
| `friendRequestSuccess` / `friendRequestFailed` | 친구 요청 결과 |
| `peerDisconnected` | 상대방 연결 종료 |
| `systemMessage` | 시스템 안내 메시지 |

---

## 라이선스

MIT License
