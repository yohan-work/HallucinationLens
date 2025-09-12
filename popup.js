/**
 * HallucinationLens - Popup Script
 * 확장 프로그램 팝업 UI 제어 및 상태 관리
 */

class HallucinationLensPopup {
  constructor() {
    this.isEnabled = true;
    this.currentPlatform = null;
    this.currentTab = null;

    this.init();
  }

  /**
   * 초기화 함수
   */
  async init() {
    try {
      // DOM 요소 참조
      this.toggleSwitch = document.getElementById("toggleSwitch");
      this.statusInfo = document.getElementById("statusInfo");
      this.platformInfo = document.getElementById("platformInfo");
      this.platformIcon = document.getElementById("platformIcon");
      this.platformName = document.getElementById("platformName");
      this.messageArea = document.getElementById("messageArea");
      this.helpLink = document.getElementById("helpLink");
      this.feedbackLink = document.getElementById("feedbackLink");

      // 이벤트 리스너 등록
      this.setupEventListeners();

      // 현재 탭 정보 가져오기
      await this.getCurrentTab();

      // 상태 확인 및 UI 업데이트
      await this.checkStatus();
    } catch (error) {
      console.error("팝업 초기화 오류:", error);
      this.showError("초기화 중 오류가 발생했습니다.");
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 토글 스위치 클릭
    this.toggleSwitch.addEventListener("click", () => {
      this.toggleExtension();
    });

    // 도움말 링크
    this.helpLink.addEventListener("click", (e) => {
      e.preventDefault();
      this.showHelp();
    });

    // 피드백 링크
    this.feedbackLink.addEventListener("click", (e) => {
      e.preventDefault();
      this.showFeedback();
    });
  }

  /**
   * 현재 활성 탭 정보 가져오기
   */
  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      this.currentTab = tab;

      // 지원되는 플랫폼인지 확인
      if (tab && tab.url) {
        if (
          tab.url.includes("chat.openai.com") ||
          tab.url.includes("chatgpt.com")
        ) {
          this.currentPlatform = "chatgpt";
        } else if (tab.url.includes("claude.ai")) {
          this.currentPlatform = "claude";
        } else if (
          tab.url.includes("gemini.google.com") ||
          tab.url.includes("gemini") ||
          tab.url.includes("bard.google.com")
        ) {
          this.currentPlatform = "gemini";
        }
      }
    } catch (error) {
      console.error("탭 정보 가져오기 오류:", error);
    }
  }

  /**
   * 확장 프로그램 상태 확인
   */
  async checkStatus() {
    try {
      // 저장된 설정 불러오기
      const result = await chrome.storage.local.get(["enabled"]);
      this.isEnabled = result.enabled !== false; // 기본값은 true

      // 현재 탭이 지원되는 플랫폼인지 확인
      if (this.currentTab && this.currentPlatform) {
        // Content script에서 상태 확인
        try {
          const response = await chrome.tabs.sendMessage(this.currentTab.id, {
            action: "getStatus",
          });

          if (response) {
            this.isEnabled = response.enabled;
            this.currentPlatform = response.platform;
          }
        } catch (error) {
          // Content script가 아직 로드되지 않았거나 응답하지 않는 경우
          console.log("Content script 응답 없음:", error.message);
        }
      }

      this.updateUI();
    } catch (error) {
      console.error("상태 확인 오류:", error);
      this.showError("상태 확인 중 오류가 발생했습니다.");
    }
  }

  /**
   * UI 업데이트
   */
  updateUI() {
    // 토글 스위치 상태 업데이트
    if (this.isEnabled) {
      this.toggleSwitch.classList.add("active");
    } else {
      this.toggleSwitch.classList.remove("active");
    }

    // 상태 정보 업데이트
    this.updateStatusInfo();

    // 플랫폼 정보 업데이트
    this.updatePlatformInfo();
  }

  /**
   * 상태 정보 업데이트
   */
  updateStatusInfo() {
    let statusText = "";
    let statusClass = "";

    if (!this.currentTab) {
      statusText = "탭 정보를 가져올 수 없습니다.";
      statusClass = "error";
    } else if (!this.currentPlatform) {
      statusText =
        "지원되지 않는 웹사이트입니다.<br>ChatGPT, Claude, Gemini에서 사용하세요.";
      statusClass = "error";
    } else if (this.isEnabled) {
      statusText = "활성화됨 - AI 답변을 모니터링 중입니다.";
      statusClass = "success";
    } else {
      statusText = "비활성화됨 - 모니터링이 중지되었습니다.";
      statusClass = "error";
    }

    this.statusInfo.innerHTML = `<div class="${statusClass}">${statusText}</div>`;
  }

  /**
   * 플랫폼 정보 업데이트
   */
  updatePlatformInfo() {
    if (!this.currentPlatform) {
      this.platformInfo.style.display = "none";
      return;
    }

    const platformData = this.getPlatformData(this.currentPlatform);

    this.platformIcon.style.backgroundColor = platformData.color;
    this.platformName.textContent = platformData.name;
    this.platformInfo.style.display = "flex";
  }

  /**
   * 플랫폼 데이터 가져오기
   */
  getPlatformData(platform) {
    const platforms = {
      chatgpt: {
        name: "ChatGPT",
        color: "#10a37f",
      },
      claude: {
        name: "Claude",
        color: "#ff6b35",
      },
      gemini: {
        name: "Gemini",
        color: "#4285f4",
      },
    };

    return (
      platforms[platform] || {
        name: "알 수 없음",
        color: "#6b7280",
      }
    );
  }

  /**
   * 확장 프로그램 토글
   */
  async toggleExtension() {
    try {
      this.isEnabled = !this.isEnabled;

      // 설정 저장
      await chrome.storage.local.set({ enabled: this.isEnabled });

      // Content script에 메시지 전송
      if (this.currentTab && this.currentPlatform) {
        try {
          await chrome.tabs.sendMessage(this.currentTab.id, {
            action: "toggle",
            enabled: this.isEnabled,
          });
        } catch (error) {
          console.log("Content script 메시지 전송 실패:", error.message);
        }
      }

      // UI 업데이트
      this.updateUI();

      // 성공 메시지 표시
      this.showMessage(
        this.isEnabled
          ? "확장 프로그램이 활성화되었습니다."
          : "확장 프로그램이 비활성화되었습니다.",
        "success"
      );
    } catch (error) {
      console.error("토글 오류:", error);
      this.showError("설정 변경 중 오류가 발생했습니다.");
    }
  }

  /**
   * 메시지 표시
   */
  showMessage(message, type = "info") {
    const messageDiv = document.createElement("div");
    messageDiv.className = type;
    messageDiv.textContent = message;

    this.messageArea.innerHTML = "";
    this.messageArea.appendChild(messageDiv);

    // 3초 후 메시지 제거
    setTimeout(() => {
      if (this.messageArea.contains(messageDiv)) {
        this.messageArea.removeChild(messageDiv);
      }
    }, 3000);
  }

  /**
   * 에러 메시지 표시
   */
  showError(message) {
    this.showMessage(message, "error");
  }

  /**
   * 성공 메시지 표시
   */
  showSuccess(message) {
    this.showMessage(message, "success");
  }

  /**
   * 도움말 표시
   */
  showHelp() {
    const helpText = `
      <div class="features-card">
        <div class="features-title">사용 방법</div>
        <ul class="feature-list">
          <li class="feature-item">ChatGPT, Claude, Gemini 웹사이트에서 자동으로 작동합니다</li>
          <li class="feature-item">AI가 답변을 생성하면 자동으로 키워드를 분석합니다</li>
          <li class="feature-item">관련 검색 결과와 신뢰도를 답변 아래에 표시합니다</li>
          <li class="feature-item">토글 버튼으로 언제든지 활성화/비활성화할 수 있습니다</li>
        </ul>
        <div class="features-title" style="margin-top: 16px;">디버깅</div>
        <button id="debugBtn" style="width: 100%; padding: 8px; background: #4c51bf; color: white; border: none; border-radius: 4px; cursor: pointer;">
          콘솔 로그 확인하기
        </button>
      </div>
    `;

    this.messageArea.innerHTML = helpText;

    // 디버그 버튼 이벤트 추가
    const debugBtn = document.getElementById("debugBtn");
    if (debugBtn) {
      debugBtn.addEventListener("click", () => this.showDebugInfo());
    }
  }

  /**
   * 디버그 정보 표시
   */
  async showDebugInfo() {
    if (!this.currentTab || !this.currentPlatform) {
      this.showError("현재 탭에서 디버그 정보를 가져올 수 없습니다.");
      return;
    }

    try {
      // Content script에서 디버그 정보 요청
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: "getDebugInfo",
      });

      const debugText = `
        <div class="features-card">
          <div class="features-title">디버그 정보</div>
          <div class="status-info" style="font-family: monospace; font-size: 11px;">
            <strong>플랫폼:</strong> ${this.currentPlatform}<br>
            <strong>URL:</strong> ${this.currentTab.url}<br>
            <strong>활성화:</strong> ${this.isEnabled ? "예" : "아니오"}<br><br>
            
            <strong>콘솔 확인 방법:</strong><br>
            1. F12 키를 눌러 개발자 도구를 엽니다<br>
            2. Console 탭을 클릭합니다<br>
            3. "[HallucinationLens]"로 시작하는 로그를 확인합니다<br><br>
            
            <strong>문제 해결:</strong><br>
            • 페이지를 새로고침해보세요<br>
            • 확장 프로그램을 껐다 켜보세요<br>
            • AI 답변이 완전히 생성된 후 잠시 기다려보세요
          </div>
        </div>
      `;

      this.messageArea.innerHTML = debugText;
    } catch (error) {
      console.error("디버그 정보 가져오기 실패:", error);
      this.showError(
        "디버그 정보를 가져올 수 없습니다. 페이지를 새로고침해보세요."
      );
    }
  }

  /**
   * 피드백 표시
   */
  showFeedback() {
    const feedbackText = `
      <div class="features-card">
        <div class="features-title">피드백 및 문의</div>
        <div class="status-info">
          이 확장 프로그램은 오픈소스 프로젝트입니다.<br><br>
          버그 리포트나 기능 제안이 있으시면 GitHub 이슈를 통해 알려주세요.<br><br>
          여러분의 피드백이 프로젝트 개선에 큰 도움이 됩니다.
        </div>
      </div>
    `;

    this.messageArea.innerHTML = feedbackText;
  }

  /**
   * 정리 함수
   */
  cleanup() {
    // 이벤트 리스너 제거 등 정리 작업
    if (this.toggleSwitch) {
      this.toggleSwitch.removeEventListener("click", this.toggleExtension);
    }
  }
}

// DOM 로드 완료 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  window.hallucinationLensPopup = new HallucinationLensPopup();
});

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", () => {
  if (window.hallucinationLensPopup) {
    window.hallucinationLensPopup.cleanup();
  }
});
