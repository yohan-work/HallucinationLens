/**
 * HallucinationLens - 유틸리티 함수들
 * 키워드 추출, 검색, 결과 처리 등의 핵심 기능을 담당
 */

class HallucinationLensUtils {
  /**
   * 텍스트에서 키워드를 추출하는 함수
   * @param {string} text - 분석할 텍스트
   * @returns {string[]} - 추출된 키워드 배열
   */
  static extractKeywords(text) {
    if (!text || typeof text !== "string") return [];

    // 기본적인 전처리
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, " ") // 특수문자 제거
      .replace(/\s+/g, " ")
      .trim();

    // 불용어 목록 (한국어 + 영어)
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "그",
      "이",
      "저",
      "것",
      "수",
      "있",
      "없",
      "하",
      "되",
      "된",
      "될",
      "함",
      "임",
      "입니다",
      "습니다",
      "에서",
      "에게",
      "에",
      "를",
      "을",
      "가",
      "이",
      "은",
      "는",
      "으로",
      "로",
      "와",
      "과",
      "도",
      "만",
      "그리고",
      "또한",
      "하지만",
      "그러나",
      "따라서",
      "그래서",
      "왜냐하면",
      "때문에",
    ]);

    // 단어 분리 및 필터링
    const words = cleanText
      .split(" ")
      .filter((word) => word.length >= 2) // 2글자 이상
      .filter((word) => !stopWords.has(word))
      .filter((word) => !/^\d+$/.test(word)); // 숫자만 있는 단어 제외

    // 빈도수 계산
    const wordFreq = {};
    words.forEach((word) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // 빈도수 기준으로 정렬하고 상위 5개 선택
    const keywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return keywords;
  }

  /**
   * DuckDuckGo에서 검색을 수행하는 함수
   * @param {string[]} keywords - 검색할 키워드 배열
   * @returns {Promise<Object[]>} - 검색 결과 배열
   */
  static async searchDuckDuckGo(keywords) {
    if (!keywords || keywords.length === 0) return [];

    try {
      // 키워드를 조합하여 검색 쿼리 생성
      const query = keywords.slice(0, 3).join(" "); // 상위 3개 키워드만 사용
      const encodedQuery = encodeURIComponent(query);

      // DuckDuckGo Instant Answer API 사용 (무료)
      const searchUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;

      const response = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`검색 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      // 결과 파싱
      const results = [];

      // Abstract가 있는 경우
      if (data.Abstract && data.AbstractURL) {
        results.push({
          title: data.Heading || "관련 정보",
          url: data.AbstractURL,
          snippet: data.Abstract.substring(0, 150) + "...",
        });
      }

      // Related Topics 추가
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 2).forEach((topic) => {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(" - ")[0] || "관련 주제",
              url: topic.FirstURL,
              snippet: topic.Text.substring(0, 150) + "...",
            });
          }
        });
      }

      // 결과가 없으면 대체 검색 시도
      if (results.length === 0) {
        return await this.fallbackSearch(query);
      }

      return results.slice(0, 2); // 최대 2개 결과만 반환
    } catch (error) {
      console.error("DuckDuckGo 검색 오류:", error);
      return await this.fallbackSearch(keywords.join(" "));
    }
  }

  /**
   * 대체 검색 방법 (DuckDuckGo HTML 스크래핑)
   * @param {string} query - 검색 쿼리
   * @returns {Promise<Object[]>} - 검색 결과 배열
   */
  static async fallbackSearch(query) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://duckduckgo.com/html/?q=${encodedQuery}`;

      // CORS 문제로 인해 실제 스크래핑은 제한적
      // 대신 더미 데이터로 신뢰도 평가를 위한 기본 결과 제공
      return [
        {
          title: "검색 결과를 찾을 수 없음",
          url: "#",
          snippet: "해당 키워드에 대한 구체적인 검색 결과를 찾을 수 없습니다.",
        },
      ];
    } catch (error) {
      console.error("대체 검색 오류:", error);
      return [];
    }
  }

  /**
   * 검색 결과를 바탕으로 신뢰도를 계산하는 함수
   * @param {Object[]} searchResults - 검색 결과 배열
   * @param {string[]} keywords - 원본 키워드 배열
   * @returns {Object} - 신뢰도 정보 객체
   */
  static calculateTrustScore(searchResults, keywords) {
    if (!searchResults || searchResults.length === 0) {
      return {
        score: "low",
        label: "신뢰도: 낮음",
        reason: "관련 검색 결과를 찾을 수 없습니다.",
        color: "#ff6b6b",
      };
    }

    // 검색 결과가 있고 유효한 URL을 가지고 있는지 확인
    const validResults = searchResults.filter(
      (result) =>
        result.url &&
        result.url !== "#" &&
        result.title &&
        result.title !== "검색 결과를 찾을 수 없음"
    );

    if (validResults.length === 0) {
      return {
        score: "low",
        label: "신뢰도: 낮음",
        reason: "검증 가능한 자료를 찾을 수 없습니다.",
        color: "#ff6b6b",
      };
    }

    // 키워드와 검색 결과의 관련성 확인
    const keywordMatches = keywords.some((keyword) =>
      validResults.some(
        (result) =>
          result.title.toLowerCase().includes(keyword.toLowerCase()) ||
          result.snippet.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (keywordMatches && validResults.length >= 1) {
      return {
        score: "high",
        label: "신뢰도: 높음",
        reason: `${validResults.length}개의 관련 자료를 찾았습니다.`,
        color: "#51cf66",
      };
    }

    return {
      score: "medium",
      label: "신뢰도: 보통",
      reason: "일부 관련 자료를 찾았으나 정확성을 확인하세요.",
      color: "#ffd43b",
    };
  }

  /**
   * 디바운스 함수 - 연속된 호출을 제한
   * @param {Function} func - 실행할 함수
   * @param {number} wait - 대기 시간 (ms)
   * @returns {Function} - 디바운스된 함수
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 현재 사이트가 지원되는 AI 플랫폼인지 확인
   * @returns {string|null} - 플랫폼 이름 또는 null
   */
  static detectAIPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes("chat.openai.com")) return "chatgpt";
    if (hostname.includes("claude.ai")) return "claude";
    if (hostname.includes("gemini.google.com")) return "gemini";

    return null;
  }

  /**
   * 로컬 스토리지에 설정 저장
   * @param {string} key - 설정 키
   * @param {any} value - 설정 값
   */
  static async saveSetting(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error("설정 저장 오류:", error);
    }
  }

  /**
   * 로컬 스토리지에서 설정 불러오기
   * @param {string} key - 설정 키
   * @param {any} defaultValue - 기본값
   * @returns {Promise<any>} - 설정 값
   */
  static async loadSetting(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error("설정 불러오기 오류:", error);
      return defaultValue;
    }
  }
}

// 전역으로 사용할 수 있도록 window 객체에 추가
if (typeof window !== "undefined") {
  window.HallucinationLensUtils = HallucinationLensUtils;
}
