// 사이트 전체의 목차. 분야(카테고리)와 주제 문서를 여기에만 등록하면
// 사이드바 · 홈 카드 · 카테고리 페이지 · 문서 수가 전부 자동으로 갱신된다.
//
// 새 주제 문서 추가 순서
//   1. templates/topic.html 을 <dir>/<slug>.html 로 복사
//   2. 복사한 파일의 data-topic 을 "<dir>/<slug>" 로 수정
//   3. 아래 해당 카테고리의 topics 배열에 { slug, title, importance, summary, tags } 추가
//      importance: "핵심"  면접 단골. ★ 배지가 붙고 목록에서 강조된다
//                  생략    보통. 아무 표시 없음
//                  "참고"  알아두면 좋지만 면접·실무에 지장 없는 내용.
//                          카테고리 페이지에서 목록 아래 "참고" 섹션으로 따로 모인다
//      tags: 이 토픽이 다루는 내용. 분야의 tags 목록에 있는 것만 쓴다
//
// 분야의 tags 는 그 분야에서 쓰는 태그 전체 목록이다(10개 미만으로 유지).
// 카테고리 페이지 위쪽에 이 순서대로 칩이 나오고, 누르면 그 태그의 토픽만 보인다.
window.CATALOG = [
  {
    dir: "01-computer-architecture",
    title: "컴퓨터 구조",
    desc: "CPU 파이프라인, 캐시 계층과 지역성, 메모리 정렬, 분기 예측이 서버 코드 성능에 미치는 영향",
    tags: ["데이터 표현", "캐시", "메모리 배치", "멀티코어", "CPU 실행"],
    topics: [
      {
        slug: "number-representation",
        title: "수의 표현",
        summary: "정수도 실수도 담기지 않는 값이 생긴다. 실수는 오차가 연산마다 누적되고, 정수는 감싸 돌거나 미정의 동작이 된다.",
        tags: ["데이터 표현"],
      },
      {
        slug: "endianness",
        title: "엔디안과 바이트 오더",
        summary: "여러 바이트를 묶어 읽는 값에만 있는 순서 규칙. 바이트 배열의 경계를 넘을 때 같은 바이트가 다른 값으로 읽힌다.",
        tags: ["데이터 표현"],
      },
      {
        slug: "locality",
        title: "참조 지역성",
        importance: "핵심",
        summary: "방금 쓴 데이터와 그 이웃을 곧 다시 쓰는 경향. 캐시가 통하는 이유이고, 그 경향을 만드는 것은 코드다.",
        tags: ["캐시", "메모리 배치"],
      },
      {
        slug: "memory-hierarchy",
        title: "메모리 계층과 캐시",
        importance: "핵심",
        summary: "한 단계 내려갈 때마다 지연의 자릿수가 하나씩 늘고, 캐시는 바이트가 아니라 라인 단위로 움직인다.",
        tags: ["캐시"],
      },
      {
        slug: "alignment",
        title: "정렬과 패딩",
        summary: "구조체 크기가 필드 합보다 큰 이유. 선언 순서를 바꾸면 빈틈이 줄어든다.",
        tags: ["메모리 배치"],
      },
      {
        slug: "logical-hybrid-cores",
        title: "논리 코어와 하이브리드 코어",
        summary: "물리·논리·성능이 다른 코어가 저마다 다른 수를 내놓으므로 \"코어 수만큼 스레드\"가 성립하지 않는다.",
        tags: ["멀티코어"],
      },
      {
        slug: "cache-coherence",
        title: "캐시 일관성과 false sharing",
        importance: "핵심",
        summary: "무효화의 단위가 변수가 아니라 라인이라서, 공유하지 않는 두 변수도 한 라인에 있으면 서로를 느리게 만든다.",
        tags: ["캐시", "멀티코어"],
      },
      {
        slug: "atomics-memory-order",
        title: "원자적 연산과 메모리 순서",
        importance: "핵심",
        summary: "원자성만으로는 부족하다. 다른 스레드가 보는 순서가 내가 쓴 순서와 다를 수 있다.",
        tags: ["멀티코어"],
      },
      {
        slug: "32-64-bit",
        title: "32비트와 64비트",
        importance: "참고",
        summary: "주소 공간과 레지스터는 넓어지지만, 포인터가 두 배가 되어 캐시에 들어가는 원소 수가 줄어든다.",
        tags: ["메모리 배치"],
      },
      {
        slug: "pipeline-branch-prediction",
        title: "파이프라인과 분기 예측",
        importance: "참고",
        summary: "예측이 맞으면 분기는 사실상 공짜다. 비싼 것은 예측 불가능한 분기다.",
        tags: ["CPU 실행"],
      },
      {
        slug: "isa-execution",
        title: "명령어 집합과 실행 모델",
        importance: "참고",
        summary: "CISC냐 RISC냐는 인코딩 이야기이고, 실제 실행은 둘 다 micro-op으로 나눠 순서를 바꿔 처리한다.",
        tags: ["CPU 실행"],
      },
    ],
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
