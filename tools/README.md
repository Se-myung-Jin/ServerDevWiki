# tools

문서를 쓰고 고치고 점검하는 스크립트다. 모두 Node.js로 돌고, 저장소 루트에서 실행한다. 빌드 단계는 없다. 사이트는 이 스크립트 없이도 그대로 열린다.

| 스크립트 | 하는 일 |
|---|---|
| `lint.js` | 사이트 전체 점검: 깨진 링크, "먼저 읽을 것" 순서, 자리표시, marker id 중복, 깨진 엔티티, 출처 섹션, 역링크 색인 최신 여부 |
| `merge-batch.js` | 새 문서의 결과 JSON(문항·요약·개념어)을 `quiz-data.js`, `catalog.js`, `terms.json`에 합친다 |
| `autolink.js` | 본문에 나온 다른 문서의 개념어를 첫 등장 한 번만 링크로 감싼다. `--apply` 없이 돌리면 바꿀 곳만 보여 준다 |
| `build-links.js` | 문서 사이 링크를 모아 역링크 색인 `assets/links.js`를 만든다. `--check`는 최신인지만 본다 |
| `move-topic.js` | 문서 하나를 다른 분야로 옮기고 그 문서를 가리키는 링크·문항·개념어를 함께 고친다 |
| `edit.js` | 여러 문서를 정확한 문자열 기준으로 한 번에 고친다 |
| `shot.js` | headless Chrome으로 그림이나 페이지를 찍는다(모바일 폭, 테마 지정 가능) |
| `dump.js` | 검토용으로 문서 본문과 점검 문항을 글자만 뽑는다 |
| `terms.json` | 자동 링크용 개념어 → 문서 목록. `{"except": [...]}`로 뜻이 갈리는 문서나 분야를 뺀다 |

## 새 문서를 더하는 순서

1. **카탈로그 등록.** `assets/catalog.js`의 분야 `topics`에 읽는 순서대로 넣는다. 항목은 `slug`, `title`, `importance`(핵심·참고, 보통은 생략), `summary`, `tags`다.
2. **문서 작성.** `templates/topic.html` 구조로 `<분야>/<slug>.html`을 쓴다.
   - 섹션은 핵심 요약 / 동작 원리(인라인 SVG 그림) / 토픽별 섹션 / 게임 서버에서는 / 주의 사항이다. 출처 섹션은 두지 않는다.
   - "먼저 읽을 것"에는 앞 분야나 같은 분야 앞 순서 문서만 둔다.
   - 뒤에 올 문서는 본문 링크로 건다. 아직 없는 문서는 `<a data-ref="분야/slug">`로 걸어 두면 작성되는 순간 링크가 된다.
   - HTML 안의 `<`, `>`, `&`는 `&lt;`, `&gt;`, `&amp;`로 쓴다.
   - SVG marker id는 문서마다 다른 접두사를 붙인다.
3. **결과 JSON.** 문서마다 아래 모양의 `<slug>.json`을 한 폴더에 모은다.
   ```json
   { "slug": "tcp-connection", "summary": null,
     "quiz": [{ "q": "질문은 ~는?", "a": "답은 ~다." }],
     "terms": [["개념어", "network/tcp-connection"]] }
   ```
   - `summary`가 null이 아니면 카탈로그 요약을 바꾼다.
   - 문항은 "~다" 평서체로 쓴다.
   - `terms`에는 다른 분야에서 뜻이 갈리는 흔한 말을 넣지 않는다.
4. **합치기와 링크.**
   ```bash
   node tools/merge-batch.js <JSON 폴더> <분야 폴더>
   node tools/autolink.js .            # 바꿀 곳 확인. 뜻이 다른 곳은 terms.json except로 뺀다
   node tools/autolink.js . --apply    # 적용하면서 역링크 색인도 다시 만든다
   ```
5. **점검.**
   ```bash
   node tools/lint.js .                # "문제 없음"이 나와야 한다
   node tools/shot.js figures 분야/slug ...                   # 그림 겹침·잘림 확인
   node tools/shot.js page 분야/slug --width=375 --theme=dark  # 모바일·다크 확인
   ```
   PNG는 `tools/.out/`에 남는다. 이 폴더는 git에 올리지 않는다.

## 기존 문서를 고칠 때

- **셸의 `sed`로 HTML을 치환하지 않는다.** 치환 문자열의 `&`는 "찾은 문자열"로 바뀌어서 `&lt;`가 망가진다. 이렇게 망가진 엔티티는 `lint.js`가 잡는다. 대신 편집기나 `edit.js`를 쓴다.
  ```json
  [
    { "file": "server/tick-loop.html", "find": "정확히 한 번 나오는 문장", "replace": "바꿀 문장" },
    { "file": "server/aoi-broadcast.html", "after": "<strong>목록 항목의 굵은 글씨</strong>", "insert": " 그 항목 끝에 붙일 문장" },
    { "file": "server/protocol-choice.html", "beforeP": "문단 안의 문장", "insert": " 그 문단 끝에 붙일 문장" }
  ]
  ```
  ```bash
  node tools/edit.js edits.json
  ```
- **문서 사이 링크를 고친 뒤에는** `node tools/build-links.js`로 역링크 색인을 다시 만든다. 잊으면 `lint.js`가 알려 준다.
- **분야를 옮길 때는** `node tools/move-topic.js <원래 분야>/<slug> <새 분야>`를 쓴다.
- **내용을 검토할 때는** `node tools/dump.js review.txt <분야 폴더 또는 토픽 id...>`로 글만 뽑아 읽는다.
