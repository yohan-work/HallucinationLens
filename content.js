/**
 * HallucinationLens - Content Script
 * AI 플랫폼에서 답변을 감지하고 신뢰도 검증 오버레이를 표시
 */

class HallucinationLensContent {
  constructor() {
    this.platform = HallucinationLensUtils.detectAIPlatform();
    this.processedElements = new WeakSet();
    this.isEnabled = true;
    this.observer = null;

    // 디바운스된 처리 함수
    this.debouncedProcessNewContent = HallucinationLensUtils.debounce(
      this.processNewContent.bind(this),
      1000
    );

    this.init();
  }

  /**
   * 초기화 함수
   */
  async init() {
    console.log(`[HallucinationLens] 초기화 시작 - 플랫폼: ${this.platform}`);
    console.log(`[HallucinationLens] 현재 URL: ${window.location.href}`);
    console.log(`[HallucinationLens] 현재 도메인: ${window.location.hostname}`);

    if (!this.platform) {
      console.log("[HallucinationLens] 지원되지 않는 플랫폼입니다.");
      return;
    }

    // 설정 불러오기
    this.isEnabled = await HallucinationLensUtils.loadSetting("enabled", true);

    if (!this.isEnabled) {
      console.log(
        "[HallucinationLens] HallucinationLens가 비활성화되어 있습니다."
      );
      return;
    }

    console.log("[HallucinationLens] 확장 프로그램 활성화됨");

    // DOM 감시 시작
    this.startObserving();

    // 페이지 로드 시 기존 콘텐츠 처리
    setTimeout(() => {
      console.log("[HallucinationLens] 기존 콘텐츠 처리 시작");
      this.processExistingContent();
    }, 2000);

    // 주기적으로 새 콘텐츠 확인 (백업용)
    setInterval(() => {
      this.processNewContent();
    }, 5000);
  }

  /**
   * DOM 변화 감시 시작
   */
  startObserving() {
    // 기존 observer가 있다면 정리
    if (this.observer) {
      this.observer.disconnect();
    }

    console.log("[HallucinationLens] DOM 감시 시작");

    this.observer = new MutationObserver((mutations) => {
      let hasNewContent = false;
      let addedTextNodes = 0;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              hasNewContent = true;
              // 텍스트가 있는 노드인지 확인
              if (node.textContent && node.textContent.trim().length > 20) {
                addedTextNodes++;
              }
            }
          });
        }
      });

      if (hasNewContent) {
        console.log(
          `[HallucinationLens] DOM 변화 감지 - 텍스트 노드 ${addedTextNodes}개 추가`
        );
        this.debouncedProcessNewContent();
      }
    });

    // 관찰 시작
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    console.log("[HallucinationLens] DOM 감시 활성화 완료");
  }

  /**
   * 기존 콘텐츠 처리
   */
  processExistingContent() {
    const responseElements = this.findResponseElements();
    responseElements.forEach((element) => this.processResponseElement(element));
  }

  /**
   * 새로운 콘텐츠 처리
   */
  processNewContent() {
    const responseElements = this.findResponseElements();
    const newElements = responseElements.filter(
      (el) => !this.processedElements.has(el)
    );

    newElements.forEach((element) => this.processResponseElement(element));
  }

  /**
   * 플랫폼별 응답 요소 찾기
   * @returns {Element[]} - 응답 요소 배열
   */
  findResponseElements() {
    let selectors = [];

    switch (this.platform) {
      case "chatgpt":
        selectors = [
          // 최신 ChatGPT 선택자들
          '[data-message-author-role="assistant"]',
          '[data-message-author-role="assistant"] .markdown',
          '[data-message-author-role="assistant"] div',
          ".group\\/conversation-turn .markdown",
          '[data-testid="conversation-turn-3"] .markdown',
          '[data-testid*="conversation-turn"] [data-message-author-role="assistant"]',

          // 추가 선택자들
          ".prose",
          ".markdown.prose",
          ".message-content",
          '[class*="ConversationItem"] [data-message-author-role="assistant"]',
          '[class*="Message"][class*="assistant"]',

          // 더 일반적인 선택자들
          "div[data-message-id]",
          ".conversation-content div",
          '[role="presentation"] div',
        ];
        break;

      case "claude":
        selectors = [
          '[data-is-streaming="false"] .font-claude-message',
          ".message-content .prose",
          '[data-testid="user-message"] + div .prose',
        ];
        break;

      case "gemini":
        selectors = [
          ".model-response-text",
          ".response-container .markdown",
          '[data-test-id="model-response"] .markdown',
          '[data-testid="model-response"]',
          ".markdown.prose",
          ".response-content",
          '[role="presentation"] .markdown',
          ".conversation-container .markdown",
          ".message-content",
          ".model-response",
          ".response-text",
          // 더 일반적인 선택자들 추가
          "div[data-response-id]",
          ".response",
          '[class*="response"]',
          '[class*="message"][class*="assistant"]',
          '[class*="model"]',
        ];
        break;
    }

    console.log(
      `[HallucinationLens] ${this.platform} 플랫폼에서 요소 검색 중...`
    );

    const elements = [];
    selectors.forEach((selector) => {
      try {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          console.log(
            `[HallucinationLens] 선택자 "${selector}"로 ${found.length}개 요소 발견`
          );
        }
        elements.push(...Array.from(found));
      } catch (error) {
        console.warn(`선택자 오류: ${selector}`, error);
      }
    });

    // 중복 제거 및 필터링
    const filteredElements = elements.filter(
      (el, index, arr) =>
        arr.indexOf(el) === index &&
        el.textContent &&
        el.textContent.trim().length > 50 // 최소 50자 이상
    );

    console.log(
      `[HallucinationLens] 총 ${filteredElements.length}개의 유효한 응답 요소 발견`
    );

    // 디버깅을 위해 발견된 요소들의 정보 출력
    if (filteredElements.length === 0) {
      console.log(
        `[HallucinationLens] 요소를 찾을 수 없습니다. 페이지의 모든 텍스트 요소를 확인합니다...`
      );
      const allTextElements = document.querySelectorAll("div, p, span");
      const longTextElements = Array.from(allTextElements).filter(
        (el) => el.textContent && el.textContent.trim().length > 100
      );
      console.log(
        `[HallucinationLens] 100자 이상의 텍스트를 가진 요소 ${longTextElements.length}개 발견`
      );
      longTextElements.slice(0, 3).forEach((el, i) => {
        console.log(
          `[HallucinationLens] 요소 ${i + 1}: ${el.tagName}.${
            el.className
          } - "${el.textContent.substring(0, 100)}..."`
        );
      });

      // 범용 감지 시도
      const fallbackElements = this.findElementsWithFallback();
      if (fallbackElements.length > 0) {
        console.log(
          `[HallucinationLens] 범용 감지로 ${fallbackElements.length}개 요소 발견`
        );
        return fallbackElements;
      }
    }

    return filteredElements;
  }

  /**
   * 범용 요소 감지 (플랫폼별 선택자가 실패했을 때 사용)
   * @returns {Element[]} - 감지된 요소 배열
   */
  findElementsWithFallback() {
    console.log("[HallucinationLens] 범용 감지 시작");

    const fallbackSelectors = [
      // ChatGPT 특화 선택자들
      "div[data-message-id]",
      "div[data-message-author-role]",
      'div[data-testid*="conversation"]',

      // 일반적인 메시지/응답 패턴
      '[class*="message"]:not([class*="user"]):not([class*="human"])',
      '[class*="response"]',
      '[class*="assistant"]',
      '[class*="bot"]',
      '[class*="ai"]',
      '[class*="model"]',
      '[class*="generated"]',
      '[class*="output"]',

      // 구조적 패턴
      'div[role="presentation"] div',
      "div[data-testid] div",
      "div[data-test-id] div",

      // 텍스트가 많은 div 요소들
      'div:not([class*="input"]):not([class*="user"]):not([class*="human"])',
    ];

    const elements = [];

    fallbackSelectors.forEach((selector) => {
      try {
        const found = document.querySelectorAll(selector);
        console.log(
          `[HallucinationLens] 범용 선택자 "${selector}": ${found.length}개 발견`
        );

        Array.from(found).forEach((el) => {
          // 텍스트가 충분히 길고, 사용자 입력이 아닌 것으로 보이는 요소만 선택
          if (
            el.textContent &&
            el.textContent.trim().length > 100 &&
            !el.querySelector("input, textarea") &&
            !this.isUserInput(el)
          ) {
            elements.push(el);
            console.log(
              `[HallucinationLens] 유효한 요소 발견: ${el.tagName}.${
                el.className
              } - "${el.textContent.substring(0, 50)}..."`
            );
          }
        });
      } catch (error) {
        console.warn(`범용 선택자 오류: ${selector}`, error);
      }
    });

    // 중복 제거 및 최근 추가된 요소 우선
    const uniqueElements = elements.filter(
      (el, index, arr) => arr.indexOf(el) === index
    );

    console.log(
      `[HallucinationLens] 범용 감지 완료: ${uniqueElements.length}개 요소`
    );

    // 최대 5개까지 반환 (ChatGPT는 더 많은 요소가 필요할 수 있음)
    return uniqueElements.slice(-5);
  }

  /**
   * 사용자 입력 요소인지 확인
   * @param {Element} element - 확인할 요소
   * @returns {boolean} - 사용자 입력 요소 여부
   */
  isUserInput(element) {
    const text = element.textContent.toLowerCase();
    const className = element.className.toLowerCase();

    // 사용자 입력을 나타내는 패턴들
    const userPatterns = [
      "user",
      "human",
      "you",
      "input",
      "prompt",
      "question",
      "사용자",
      "질문",
      "입력",
    ];

    // ChatGPT 특화 사용자 메시지 감지
    const messageAuthorRole = element.getAttribute("data-message-author-role");
    if (messageAuthorRole === "user") {
      return true;
    }

    // 부모 요소에서 사용자 메시지 확인
    let parent = element.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      if (parent.getAttribute("data-message-author-role") === "user") {
        return true;
      }
      parent = parent.parentElement;
    }

    return userPatterns.some(
      (pattern) =>
        className.includes(pattern) ||
        element.getAttribute("data-testid")?.includes(pattern) ||
        element.getAttribute("data-test-id")?.includes(pattern)
    );
  }

  /**
   * 응답 요소 처리
   * @param {Element} element - 처리할 응답 요소
   */
  async processResponseElement(element) {
    if (this.processedElements.has(element)) {
      return;
    }

    this.processedElements.add(element);

    try {
      const text = this.extractTextContent(element);
      if (!text || text.length < 50) {
        return;
      }

      console.log("응답 텍스트 처리 중...", text.substring(0, 100) + "...");

      // 키워드 추출
      const keywords = HallucinationLensUtils.extractKeywords(text);
      if (keywords.length === 0) {
        return;
      }

      console.log("추출된 키워드:", keywords);

      // 검색 실행
      const searchResults = await HallucinationLensUtils.searchDuckDuckGo(
        keywords
      );

      // 신뢰도 계산
      const trustInfo = HallucinationLensUtils.calculateTrustScore(
        searchResults,
        keywords
      );

      // 오버레이 생성
      this.createOverlay(element, trustInfo, searchResults, keywords);
    } catch (error) {
      console.error("응답 요소 처리 오류:", error);
    }
  }

  /**
   * 요소에서 텍스트 내용 추출
   * @param {Element} element - 텍스트를 추출할 요소
   * @returns {string} - 추출된 텍스트
   */
  extractTextContent(element) {
    // 코드 블록 제외하고 텍스트 추출
    const clone = element.cloneNode(true);

    // 코드 블록 제거
    const codeBlocks = clone.querySelectorAll("pre, code");
    codeBlocks.forEach((block) => block.remove());

    return clone.textContent || clone.innerText || "";
  }

  /**
   * 신뢰도 오버레이 생성
   * @param {Element} targetElement - 대상 요소
   * @param {Object} trustInfo - 신뢰도 정보
   * @param {Object[]} searchResults - 검색 결과
   * @param {string[]} keywords - 키워드 배열
   */
  createOverlay(targetElement, trustInfo, searchResults, keywords) {
    // 기존 오버레이 제거
    const existingOverlay = targetElement.parentNode.querySelector(
      ".hallucination-lens-overlay"
    );
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // 오버레이 컨테이너 생성
    const overlay = document.createElement("div");
    overlay.className = "hallucination-lens-overlay";
    overlay.setAttribute("data-platform", this.platform);

    // 헤더 생성
    const header = document.createElement("div");
    header.className = "hl-header";
    header.innerHTML = `
      <div class="hl-trust-indicator" style="background-color: ${trustInfo.color}">
        <span class="hl-trust-label">${trustInfo.label}</span>
        <span class="hl-trust-reason">${trustInfo.reason}</span>
      </div>
      <button class="hl-toggle-btn" title="검색 결과 토글">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M6 9L1.5 4.5L2.5 3.5L6 7L9.5 3.5L10.5 4.5L6 9Z" fill="currentColor"/>
        </svg>
      </button>
    `;

    // 콘텐츠 영역 생성
    const content = document.createElement("div");
    content.className = "hl-content";
    content.style.display = "none"; // 기본적으로 숨김

    // 키워드 표시
    const keywordSection = document.createElement("div");
    keywordSection.className = "hl-keywords";
    keywordSection.innerHTML = `
      <div class="hl-section-title">분석된 키워드</div>
      <div class="hl-keyword-tags">
        ${keywords
          .map((keyword) => `<span class="hl-keyword-tag">${keyword}</span>`)
          .join("")}
      </div>
    `;

    // 검색 결과 표시
    const resultsSection = document.createElement("div");
    resultsSection.className = "hl-results";

    if (searchResults && searchResults.length > 0) {
      const validResults = searchResults.filter((result) => result.url !== "#");

      if (validResults.length > 0) {
        resultsSection.innerHTML = `
          <div class="hl-section-title">관련 검색 결과</div>
          <div class="hl-result-list">
            ${validResults
              .map(
                (result) => `
              <div class="hl-result-item">
                <a href="${result.url}" target="_blank" rel="noopener noreferrer" class="hl-result-link">
                  <div class="hl-result-title">${result.title}</div>
                  <div class="hl-result-snippet">${result.snippet}</div>
                </a>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      } else {
        resultsSection.innerHTML = `
          <div class="hl-section-title">검색 결과</div>
          <div class="hl-no-results">관련 검색 결과를 찾을 수 없습니다.</div>
        `;
      }
    } else {
      resultsSection.innerHTML = `
        <div class="hl-section-title">검색 결과</div>
        <div class="hl-no-results">검색을 수행할 수 없습니다.</div>
      `;
    }

    // 요소 조립
    content.appendChild(keywordSection);
    content.appendChild(resultsSection);
    overlay.appendChild(header);
    overlay.appendChild(content);

    // 토글 기능 추가
    const toggleBtn = header.querySelector(".hl-toggle-btn");
    toggleBtn.addEventListener("click", () => {
      const isVisible = content.style.display !== "none";
      content.style.display = isVisible ? "none" : "block";
      toggleBtn.style.transform = isVisible ? "rotate(0deg)" : "rotate(180deg)";
    });

    // DOM에 삽입
    this.insertOverlay(targetElement, overlay);
  }

  /**
   * 오버레이를 적절한 위치에 삽입
   * @param {Element} targetElement - 대상 요소
   * @param {Element} overlay - 오버레이 요소
   */
  insertOverlay(targetElement, overlay) {
    // 플랫폼별 삽입 위치 조정
    let insertTarget = targetElement.parentNode;

    // 더 적절한 부모 요소 찾기
    let current = targetElement;
    for (let i = 0; i < 3; i++) {
      if (current.parentNode && current.parentNode !== document.body) {
        current = current.parentNode;
        if (
          current.classList.contains("group") ||
          current.classList.contains("message") ||
          current.classList.contains("conversation-turn")
        ) {
          insertTarget = current;
          break;
        }
      }
    }

    // 오버레이 삽입
    if (insertTarget.nextSibling) {
      insertTarget.parentNode.insertBefore(overlay, insertTarget.nextSibling);
    } else {
      insertTarget.parentNode.appendChild(overlay);
    }
  }

  /**
   * 확장 프로그램 활성화/비활성화
   * @param {boolean} enabled - 활성화 여부
   */
  async setEnabled(enabled) {
    this.isEnabled = enabled;
    await HallucinationLensUtils.saveSetting("enabled", enabled);

    if (enabled) {
      this.startObserving();
      this.processExistingContent();
    } else {
      if (this.observer) {
        this.observer.disconnect();
      }
      // 기존 오버레이 제거
      document
        .querySelectorAll(".hallucination-lens-overlay")
        .forEach((el) => el.remove());
    }
  }

  /**
   * 정리 함수
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    document
      .querySelectorAll(".hallucination-lens-overlay")
      .forEach((el) => el.remove());
  }
}

// 페이지 로드 완료 후 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.hallucinationLens = new HallucinationLensContent();
  });
} else {
  window.hallucinationLens = new HallucinationLensContent();
}

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", () => {
  if (window.hallucinationLens) {
    window.hallucinationLens.cleanup();
  }
});

// 메시지 리스너 (popup에서 제어용)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    if (window.hallucinationLens) {
      window.hallucinationLens.setEnabled(request.enabled);
      sendResponse({ success: true });
    }
  } else if (request.action === "getStatus") {
    sendResponse({
      enabled: window.hallucinationLens
        ? window.hallucinationLens.isEnabled
        : false,
      platform: window.hallucinationLens
        ? window.hallucinationLens.platform
        : null,
    });
  } else if (request.action === "getDebugInfo") {
    const debugInfo = {
      platform: window.hallucinationLens
        ? window.hallucinationLens.platform
        : null,
      isEnabled: window.hallucinationLens
        ? window.hallucinationLens.isEnabled
        : false,
      processedCount: window.hallucinationLens
        ? window.hallucinationLens.processedElements.size
        : 0,
      url: window.location.href,
      hostname: window.location.hostname,
    };

    console.log("[HallucinationLens] 디버그 정보 요청됨:", debugInfo);
    sendResponse(debugInfo);
  }
});
