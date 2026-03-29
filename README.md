1:1 랜덤 채팅 웹 애플리케이션
익명으로 실시간 대화를 나눌 수 있는 1:1 랜덤 채팅 웹 서비스입니다. 웹소켓을 활용한 빠른 매칭과 쾌적한 채팅 환경을 위한 다양한 제한 및 보호 기능을 제공합니다.

주요 기능
실시간 1:1 매칭: 대기열 기반의 빠른 상대방 매칭 기능 및 본인/상대방 성별(Gender) 설정에 따른 맞춤형 매칭 지원

텍스트 및 이미지 전송: 실시간 텍스트 채팅과 이미지 첨부 기능. 수신된 이미지는 주의를 위해 기본적으로 블러 처리되며 확인 버튼을 눌러야 원본을 볼 수 있음

채팅 편의성: 상대방의 타이핑 상태 표시("상대방이 입력 중입니다...") 기능 지원

친구 및 차단 시스템: 마음에 드는 상대에게 친구 요청(최대 10명)을 보내거나, 원치 않는 상대를 차단하여 다시 매칭되지 않도록 설정 가능

어뷰징 및 도배 방지:

메시지 및 이미지 연속 전송 제한 (도배 시 쿨타임 적용)

너무 빠른 재매칭 요청 제한

인증 API 무차별 대입 방지 (Express Rate Limit)

자리비움(AFK) 감지: 매칭 후 20초 동안 양측의 첫 메시지가 오가지 않으면 자동으로 방을 종료하여 유령 사용자 방지

보안 및 인증: JWT를 활용한 익명 사용자 ID 발급 및 쿠키 기반 세션 유지

기술 스택
Backend: Node.js, Express, Socket.io

Frontend: HTML, CSS, Vanilla JavaScript

Auth: JSON Web Token (JWT), Cookie-parser

Security: express-rate-limit, dotenv


설치 및 실행 방법
Bash
npm install express socket.io cookie-parser jsonwebtoken express-rate-limit dotenv
프로젝트 루트 경로에 .env 파일을 생성하고 아래와 같이 작성합니다.

코드 스니펫
JWT_SECRET=여기에_원하는_비밀키_입력
PORT=3000
Bash
node server.js
이후 브라우저에서 http://localhost:3000으로 접속하여 사용할 수 있습니다.
