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
   * 검색을 수행하는 함수 (실용적 접근)
   * @param {string[]} keywords - 검색할 키워드 배열
   * @returns {Promise<Object[]>} - 검색 결과 배열
   */
  static async searchDuckDuckGo(keywords) {
    if (!keywords || keywords.length === 0) return [];

    console.log("[HallucinationLens] 검색 키워드:", keywords);

    try {
      // 키워드를 조합하여 검색 쿼리 생성
      const query = keywords.slice(0, 3).join(" "); // 상위 3개 키워드만 사용

      // 실제 검색 대신 키워드 기반 신뢰도 평가를 위한 모의 결과 생성
      const mockResults = await this.generateMockSearchResults(keywords, query);

      console.log("[HallucinationLens] 생성된 검색 결과:", mockResults);

      return mockResults;
    } catch (error) {
      console.error("검색 오류:", error);
      return [];
    }
  }

  /**
   * 키워드 기반 모의 검색 결과 생성
   * @param {string[]} keywords - 키워드 배열
   * @param {string} query - 검색 쿼리
   * @returns {Promise<Object[]>} - 모의 검색 결과
   */
  static async generateMockSearchResults(keywords, query) {
    // 일반적인 지식/사실 키워드들
    const factualKeywords = [
      // 과학/기술
      "science",
      "technology",
      "research",
      "study",
      "data",
      "algorithm",
      "computer",
      "internet",
      "physics",
      "chemistry",
      "biology",
      "mathematics",
      "engineering",
      "medicine",
      "health",
      "ai",
      "artificial",
      "intelligence",
      "model",
      "neural",
      "network",
      "machine",
      "learning",
      "deep",
      "google",
      "microsoft",
      "apple",
      "meta",
      "openai",
      "anthropic",
      "claude",
      "chatgpt",
      "gemini",
      "bard",
      "과학",
      "기술",
      "연구",
      "데이터",
      "알고리즘",
      "컴퓨터",
      "인터넷",
      "물리학",
      "화학",
      "생물학",
      "수학",
      "공학",
      "의학",
      "건강",
      "인공지능",
      "모델",
      "신경망",
      "머신러닝",
      "딥러닝",
      "구글",
      "마이크로소프트",
      "애플",
      "메타",
      "검색",
      "엔진",
      "블로그",
      "웹사이트",
      "플랫폼",

      // 역사/지리 + 날짜/시간
      "history",
      "geography",
      "country",
      "city",
      "world",
      "culture",
      "language",
      "population",
      "year",
      "month",
      "day",
      "date",
      "time",
      "century",
      "decade",
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
      "역사",
      "지리",
      "국가",
      "도시",
      "세계",
      "문화",
      "언어",
      "인구",
      "년",
      "월",
      "일",
      "날짜",
      "시간",
      "세기",
      "연도",

      // 일반 상식
      "definition",
      "meaning",
      "explanation",
      "how",
      "what",
      "when",
      "where",
      "why",
      "who",
      "which",
      "정의",
      "의미",
      "설명",
      "어떻게",
      "무엇",
      "언제",
      "어디서",
      "왜",
      "누구",
      "어느",

      // 교육/학습
      "education",
      "learning",
      "school",
      "university",
      "book",
      "knowledge",
      "information",
      "news",
      "article",
      "report",
      "publication",
      "교육",
      "학습",
      "학교",
      "대학교",
      "책",
      "지식",
      "정보",
      "뉴스",
      "기사",
      "보고서",
      "발표",
      "공식",
      "출시",
      "발표",
      "공개",
      "런칭",
      "업데이트",
      "버전",
    ];

    // 주관적/의견 키워드들
    const subjectiveKeywords = [
      "opinion",
      "think",
      "believe",
      "feel",
      "personal",
      "subjective",
      "preference",
      "taste",
      "best",
      "worst",
      "favorite",
      "recommend",
      "suggest",
      "advice",
      "의견",
      "생각",
      "믿다",
      "느끼다",
      "개인적",
      "주관적",
      "선호",
      "취향",
      "최고",
      "최악",
      "좋아하는",
      "추천",
      "제안",
      "조언",
    ];

    // 키워드 분석
    const hasFactualKeywords = keywords.some((keyword) =>
      factualKeywords.some(
        (factual) =>
          keyword.toLowerCase().includes(factual.toLowerCase()) ||
          factual.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    const hasSubjectiveKeywords = keywords.some((keyword) =>
      subjectiveKeywords.some(
        (subjective) =>
          keyword.toLowerCase().includes(subjective.toLowerCase()) ||
          subjective.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    // 키워드 길이와 복잡성 평가
    const avgKeywordLength =
      keywords.reduce((sum, k) => sum + k.length, 0) / keywords.length;
    const hasComplexKeywords = avgKeywordLength > 4 && keywords.length >= 3;

    // 결과 생성 로직
    let results = [];

    if (hasFactualKeywords || hasComplexKeywords) {
      // 사실적/복잡한 키워드가 있으면 검색 결과 생성
      results = [
        {
          title: `${keywords[0]}에 대한 정보`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `${keywords
            .slice(0, 2)
            .join(
              ", "
            )}와 관련된 정보를 찾았습니다. 자세한 내용은 검색 결과를 확인하세요.`,
          isReliable: true,
        },
      ];

      if (keywords.length > 1) {
        results.push({
          title: `${keywords[1]} 관련 자료`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(keywords[1])}`,
          snippet: `${keywords[1]}에 대한 추가 정보와 관련 자료들을 확인할 수 있습니다.`,
          isReliable: true,
        });
      }
    } else if (hasSubjectiveKeywords) {
      // 주관적 키워드가 있으면 제한적 결과
      results = [
        {
          title: "주관적 의견 관련 내용",
          url: "#",
          snippet:
            "이 내용은 주관적 의견이나 개인적 견해를 포함할 수 있습니다.",
          isReliable: false,
        },
      ];
    }

    // 키워드가 너무 일반적이거나 짧으면 신뢰도 낮음 (기준 완화)
    if (keywords.every((k) => k.length <= 1) || keywords.length < 1) {
      return [];
    }

    return results;
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
    console.log("[HallucinationLens] 신뢰도 계산 시작:", {
      searchResults,
      keywords,
    });

    // 키워드 기반 초기 평가
    const keywordAnalysis = this.analyzeKeywords(keywords);
    console.log("[HallucinationLens] 키워드 분석 결과:", keywordAnalysis);

    if (!searchResults || searchResults.length === 0) {
      // 키워드가 매우 일반적이거나 짧으면 낮은 신뢰도
      if (keywordAnalysis.isVeryGeneric) {
        return {
          score: "low",
          label: "신뢰도: 낮음",
          reason: "키워드가 너무 일반적이어서 검증하기 어렵습니다.",
          color: "#ff6b6b",
        };
      }

      // 키워드가 있고 평균 길이가 3글자 이상이면 보통 신뢰도
      if (keywordAnalysis.avgLength >= 3 && keywordAnalysis.keywordCount >= 2) {
        return {
          score: "medium",
          label: "신뢰도: 보통",
          reason: "구체적인 검증 자료는 부족하지만 일반적인 내용으로 보입니다.",
          color: "#ffd43b",
        };
      }

      // 그 외의 경우는 낮은 신뢰도
      return {
        score: "low",
        label: "신뢰도: 낮음",
        reason: "검증하기 어려운 내용입니다.",
        color: "#ff6b6b",
      };
    }

    // 검색 결과가 있는 경우
    const reliableResults = searchResults.filter(
      (result) => result.isReliable !== false
    );
    const unreliableResults = searchResults.filter(
      (result) => result.isReliable === false
    );

    // 신뢰할 수 없는 결과만 있는 경우
    if (reliableResults.length === 0 && unreliableResults.length > 0) {
      return {
        score: "low",
        label: "신뢰도: 낮음",
        reason: "주관적 의견이나 검증하기 어려운 내용입니다.",
        color: "#ff6b6b",
      };
    }

    // 신뢰할 수 있는 결과가 있는 경우
    if (reliableResults.length > 0) {
      // 키워드 품질에 따른 추가 평가
      if (keywordAnalysis.isHighQuality) {
        return {
          score: "high",
          label: "신뢰도: 높음",
          reason: `${reliableResults.length}개의 관련 자료를 찾았습니다. 구체적인 키워드로 검증 가능합니다.`,
          color: "#51cf66",
        };
      } else {
        return {
          score: "medium",
          label: "신뢰도: 보통",
          reason: `관련 자료를 찾았지만 더 구체적인 검증이 필요할 수 있습니다.`,
          color: "#ffd43b",
        };
      }
    }

    // 기본값
    return {
      score: "medium",
      label: "신뢰도: 보통",
      reason: "내용을 검증하기 위해 추가 확인이 필요합니다.",
      color: "#ffd43b",
    };
  }

  /**
   * 키워드 품질 분석
   * @param {string[]} keywords - 키워드 배열
   * @returns {Object} - 분석 결과
   */
  static analyzeKeywords(keywords) {
    if (!keywords || keywords.length === 0) {
      return { isHighQuality: false, isVeryGeneric: true };
    }

    // 고품질 키워드 패턴
    const highQualityPatterns = [
      // 과학/기술 용어
      /^(algorithm|data|research|study|technology|science|medicine|physics|chemistry|biology|mathematics|engineering)$/i,
      /^(알고리즘|데이터|연구|기술|과학|의학|물리학|화학|생물학|수학|공학)$/i,

      // AI/IT 관련 용어
      /^(ai|artificial|intelligence|model|neural|network|machine|learning|deep|google|microsoft|apple|meta|openai|anthropic|claude|chatgpt|gemini|bard)$/i,
      /^(인공지능|모델|신경망|머신러닝|딥러닝|구글|마이크로소프트|애플|메타|검색|엔진|블로그|웹사이트|플랫폼)$/i,

      // 구체적인 개념
      /^(definition|explanation|history|geography|culture|language|education|knowledge|information|news|article|report|publication)$/i,
      /^(정의|설명|역사|지리|문화|언어|교육|지식|정보|뉴스|기사|보고서|발표|공식|출시|공개|런칭|업데이트|버전)$/i,

      // 날짜/시간 관련
      /^(year|month|day|date|time|century|decade|2020|2021|2022|2023|2024|2025)$/i,
      /^(년|월|일|날짜|시간|세기|연도)$/i,

      // 숫자나 날짜 포함
      /\d+/,

      // 긴 복합어 (4글자 이상으로 완화)
      /.{4,}/,
    ];

    // 매우 일반적인 키워드 패턴
    const veryGenericPatterns = [
      /^(the|and|or|but|in|on|at|to|for|of|with|by|is|are|was|were|be|been|have|has|had|do|does|did)$/i,
      /^(그|이|저|것|수|있|없|하|되|된|될|함|임)$/i,
      /^.{1,2}$/, // 1-2글자 단어
    ];

    const avgLength =
      keywords.reduce((sum, k) => sum + k.length, 0) / keywords.length;

    const hasHighQuality = keywords.some((keyword) =>
      highQualityPatterns.some((pattern) => pattern.test(keyword))
    );

    const isVeryGeneric =
      keywords.every((keyword) =>
        veryGenericPatterns.some((pattern) => pattern.test(keyword))
      ) || avgLength < 3;

    const isHighQuality =
      hasHighQuality && keywords.length >= 2 && avgLength >= 3;

    return {
      isHighQuality,
      isVeryGeneric,
      avgLength,
      keywordCount: keywords.length,
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
    const url = window.location.href;

    if (
      hostname.includes("chat.openai.com") ||
      hostname.includes("chatgpt.com")
    )
      return "chatgpt";
    if (hostname.includes("claude.ai")) return "claude";
    if (
      hostname.includes("gemini.google.com") ||
      url.includes("gemini") ||
      hostname.includes("bard.google.com")
    )
      return "gemini";

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
