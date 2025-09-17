/**
 * HallucinationLens - Background Script
 * CSP 제한을 우회하여 외부 API 호출을 처리
 */

// 검색 API 호출을 처리하는 함수
async function performSearchRequest(query) {
  console.log("[HallucinationLens Background] 검색 요청:", query);

  try {
    // DuckDuckGo API 시도
    const duckDuckGoResults = await searchDuckDuckGo(query);
    if (duckDuckGoResults.length > 0) {
      return duckDuckGoResults;
    }

    // Wikipedia API 시도
    const wikipediaResults = await searchWikipedia(query);
    if (wikipediaResults.length > 0) {
      return wikipediaResults;
    }

    return [];
  } catch (error) {
    console.error("[HallucinationLens Background] 검색 오류:", error);
    return [];
  }
}

// DuckDuckGo API 검색
async function searchDuckDuckGo(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    const results = [];

    // Abstract (요약 정보)
    if (data.Abstract && data.Abstract.trim()) {
      results.push({
        title: data.Heading || "정보 요약",
        url: data.AbstractURL || "#",
        snippet: data.Abstract,
        isReliable: true,
        source: "DuckDuckGo",
      });
    }

    // Related Topics (관련 주제)
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 2).forEach((topic) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || "관련 주제",
            url: topic.FirstURL,
            snippet: topic.Text,
            isReliable: true,
            source: "DuckDuckGo",
          });
        }
      });
    }

    // Answer (직접 답변)
    if (data.Answer && data.Answer.trim()) {
      results.push({
        title: "직접 답변",
        url: data.AnswerURL || "#",
        snippet: data.Answer,
        isReliable: true,
        source: "DuckDuckGo",
      });
    }

    console.log("[HallucinationLens Background] DuckDuckGo 결과:", results);
    return results;
  } catch (error) {
    console.error("[HallucinationLens Background] DuckDuckGo 오류:", error);
    return [];
  }
}

// Wikipedia API 검색
async function searchWikipedia(query) {
  try {
    const encodedQuery = encodeURIComponent(query);

    // 검색으로 관련 페이지 찾기
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/search/${encodedQuery}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.pages || searchData.pages.length === 0) {
      return [];
    }

    const results = [];

    // 상위 2개 결과에 대해 요약 정보 가져오기
    for (let i = 0; i < Math.min(2, searchData.pages.length); i++) {
      const page = searchData.pages[i];
      try {
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          page.key
        )}`;
        const summaryResponse = await fetch(summaryUrl);
        const summaryData = await summaryResponse.json();

        if (summaryData.extract) {
          results.push({
            title: summaryData.title,
            url:
              summaryData.content_urls?.desktop?.page ||
              `https://en.wikipedia.org/wiki/${page.key}`,
            snippet: summaryData.extract,
            isReliable: true,
            source: "Wikipedia",
          });
        }
      } catch (summaryError) {
        console.warn(
          "[HallucinationLens Background] Wikipedia 요약 실패:",
          summaryError
        );
      }
    }

    console.log("[HallucinationLens Background] Wikipedia 결과:", results);
    return results;
  } catch (error) {
    console.error("[HallucinationLens Background] Wikipedia 오류:", error);
    return [];
  }
}

// Content Script에서 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "search") {
    console.log(
      "[HallucinationLens Background] 검색 메시지 수신:",
      request.query
    );

    performSearchRequest(request.query)
      .then((results) => {
        console.log("[HallucinationLens Background] 검색 완료:", results);
        sendResponse({ success: true, results: results });
      })
      .catch((error) => {
        console.error("[HallucinationLens Background] 검색 실패:", error);
        sendResponse({ success: false, error: error.message, results: [] });
      });

    // 비동기 응답을 위해 true 반환
    return true;
  }
});

console.log("[HallucinationLens Background] Background script 로드됨");
