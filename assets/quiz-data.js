// 점검 문항. 모든 문항은 반드시 하나의 주제 문서(topic)에 연결된다.
// topic 은 catalog.js 에 등록된 "<dir>/<slug>" 이어야 한다.
// 연결된 문서 하단의 "점검 문항"과 quiz.html 양쪽에 자동으로 나타난다.
//
// a 에는 HTML을 쓸 수 있다(<code>, <br> 등).
//
// 예시:
//   {
//     topic: "02-operating-system/process-thread",
//     q: "스레드끼리 공유하는 것과 각자 가지는 것은?",
//     a: "코드·데이터·힙·파일 디스크립터는 공유, 스택과 레지스터 문맥은 스레드별로 가진다.",
//   },
window.QUIZ = [];
