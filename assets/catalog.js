// 사이트 전체의 목차. 분야(카테고리)와 주제 문서를 여기에만 등록하면
// 사이드바 · 홈 카드 · 카테고리 페이지 · 문서 수가 전부 자동으로 갱신된다.
//
// 새 주제 문서 추가 순서
//   1. templates/topic.html 을 <dir>/<slug>.html 로 복사
//   2. 복사한 파일의 data-topic 을 "<dir>/<slug>" 로 수정
//   3. 아래 해당 카테고리의 topics 배열에 { slug, title, level, summary } 추가
//      level: "기초" | "심화"
window.CATALOG = [
  {
    dir: "01-computer-architecture",
    title: "컴퓨터 구조",
    desc: "CPU 파이프라인, 캐시 계층과 지역성, 메모리 정렬, 분기 예측이 서버 코드 성능에 미치는 영향",
    topics: [],
  },
  {
    dir: "02-operating-system",
    title: "운영체제",
    desc: "프로세스/스레드, 스케줄링, 메모리 관리, 동기화, I/O 모델(블로킹/논블로킹, 멀티플렉싱)",
    topics: [],
  },
  {
    dir: "03-system-programming",
    title: "시스템 프로그래밍",
    desc: "시스템 콜, 파일 디스크립터와 핸들, 메모리 매핑, 프로세스 간 통신, 링커와 로더",
    topics: [],
  },
  {
    dir: "04-network",
    title: "네트워크",
    desc: "TCP/IP 스택, 소켓 프로그래밍, IOCP/epoll 비동기 I/O, 패킷 프레이밍과 직렬화 설계",
    topics: [],
  },
  {
    dir: "05-server",
    title: "서버 프로그래밍",
    desc: "동시성 모델(스레드풀/이벤트 루프/액터), 락-프리 자료구조, 틱 루프, 세션 관리, Command/Strand",
    topics: [],
  },
  {
    dir: "06-database",
    title: "데이터베이스",
    desc: "관계형/NoSQL 트레이드오프, 트랜잭션과 격리 수준, 인덱싱, 샤딩/레플리케이션, 캐시 전략",
    topics: [],
  },
  {
    dir: "07-security",
    title: "보안 · 암호",
    desc: "대칭/비대칭 암호, TLS, 인증과 토큰, 패킷 위변조와 치트 대응",
    topics: [],
  },
  {
    dir: "08-csharp",
    title: "C# 언어와 런타임",
    desc: "CLR 내부(GC, JIT), async/await 메커니즘, Span/Memory 제로 할당 패턴, 소스 제너레이터",
    topics: [],
  },
  {
    dir: "09-cpp",
    title: "C++",
    desc: "객체 수명과 RAII, 이동 의미론, 템플릿, 메모리 모델과 atomic, 스마트 포인터",
    topics: [],
  },
  {
    dir: "10-unity",
    title: "Unity",
    desc: "클라이언트와 서버가 만나는 지점: 프레임 루프, 직렬화, 네트워크 동기화",
    topics: [],
  },
  {
    dir: "11-graphics",
    title: "클라이언트 · 그래픽스",
    desc: "렌더링 파이프라인, 좌표계와 변환, 보간과 예측 — 서버 개발자가 알아야 할 클라이언트 쪽 지식",
    topics: [],
  },
  {
    dir: "12-data-structure",
    title: "자료구조",
    desc: "배열/리스트/해시/트리/힙, 캐시 친화적 자료구조, 공간 분할(그리드, 쿼드트리)",
    topics: [],
  },
  {
    dir: "13-algorithm",
    title: "알고리즘",
    desc: "정렬과 탐색, 그래프와 길찾기, 복잡도 분석, 매칭/랭킹 알고리즘",
    topics: [],
  },
  {
    dir: "14-architecture",
    title: "아키텍처",
    desc: "모놀리스와 분산 서버, 메시지 큐, 서비스 간 통신, 일관성과 장애 격리",
    topics: [],
  },
  {
    dir: "15-operations",
    title: "배포와 운영",
    desc: "CI/CD, 컨테이너화, 모니터링/로깅, 장애 대응, 수평/수직 확장 전략",
    topics: [],
  },
  {
    dir: "16-game-patterns",
    title: "게임 구조와 패턴",
    desc: "게임 루프, 상태 동기화, 존/채널/인스턴스 구조, 이벤트와 명령 패턴",
    topics: [],
  },
];
