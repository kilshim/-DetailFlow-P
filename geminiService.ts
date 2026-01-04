
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ProductInfo, AnalysisResult, PageStructure, VisualStyle } from "./types";

const getAi = () => {
  // Enforce BYOK (Bring Your Own Key): Only use the key from sessionStorage
  const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('gemini_api_key') : null;
  
  if (!apiKey) {
    throw new Error("REQUIRE_API_KEY");
  }
  
  return new GoogleGenAI({ apiKey });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.error?.code === 429 || 
      (error?.message && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('RESOURCE_EXHAUSTED')
      )) ||
      (typeof error === 'object' && JSON.stringify(error).includes('RESOURCE_EXHAUSTED'));

    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit (429). Retrying in ${Math.round(delay)}ms... (${retries} retries left)`);
      await sleep(delay);
      // Exponential backoff: double the delay for next attempt
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const analyzeProduct = async (info: ProductInfo): Promise<AnalysisResult> => {
  const ai = getAi();
  const prompt = `다음 상품 정보를 바탕으로 10페이지 분량의 설득력 있는 상세페이지 시퀀스를 위한 분석을 수행해주세요.
  모든 응답은 반드시 한국어로 작성해야 합니다.
  
  [작성 원칙: 다중 코드 전략]
  1. 스타일(문체): 타겟 고객이 실제로 사용하는 언어, 유행어, 감성적 어휘를 적극 사용하여 정서적 유대감을 형성하세요.
  2. 메시지(내용): 문체는 가볍거나 위트 있더라도, 전달하는 핵심 정보는 브랜드의 진중한 가치를 담아야 합니다.

  상품명: ${info.name}
  설명: ${info.description}
  가격: ${info.salePrice} (정가: ${info.originalPrice})
  
  다음 항목을 포함한 상세 분석 결과를 JSON으로 제공하세요:
  1. 카테고리 분류(category): 상품을 분석하여 다음 중 가장 적합한 카테고리 하나를 선택하세요.
     - 'Fashion' (의류, 모자, 신발, 잡화)
     - 'Beauty' (화장품, 스킨케어, 뷰티 디바이스)
     - 'Living' (주방용품, 수납, 가구, 생활잡화)
     - 'Digital' (가전, IT 기기, 모바일 액세서리)
     - 'Health' (헬스, 방한용품, 보호대, 기능성 장비)
     - 'Food' (건강식품, 간편식, 음료)
     - 'General' (기타 범용 제품)
  2. 요약(summary): 상품의 핵심 경쟁력, 타겟의 니즈, 판매 전략을 포함하여 구체적이고 매력적인 문장으로 서술 (공백 포함 200자 이상)
  3. 타겟 고객(targets) 5개: 타겟의 연령대, 직업뿐만 아니라 그들이 주로 사용하는 '언어 스타일(유행어, 말투)'과 '감성'을 고려하여 정의하세요.
  4. 구매 동기(motivations) 5개
  5. 시장의 문제점(marketProblems) 5개
  6. 핵심 차별점(usps) 5개
  7. 브랜드 아이덴티티(톤앤무드, 핵심 메시지, 지양할 표현)
     - 톤(tone): 타겟 고객과 정서적 유대감을 형성할 수 있는 구체적인 어조 (예: 위트있는, 진중한, 감성적인).
     - 지양할 표현(avoidExpressions): 식상한 클리셰("최고의", "대박"), 법적 문제 소지가 있는 과장된 표현("100% 치료"), 브랜드 품격을 떨어뜨리는 저렴한 단어 등.
  8. 브랜드 컬러(colors) - 어울리는 메인/서브 컬러 HEX 코드 (예: #FF5733) 및 설명 포함 3가지`;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['Fashion', 'Beauty', 'Living', 'Digital', 'Health', 'Food', 'General'] },
            summary: { type: Type.STRING },
            targets: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketProblems: { type: Type.ARRAY, items: { type: Type.STRING } },
            usps: { type: Type.ARRAY, items: { type: Type.STRING } },
            brandIdentity: {
              type: Type.OBJECT,
              properties: {
                tone: { type: Type.STRING },
                coreMessage: { type: Type.STRING },
                avoidExpressions: { type: Type.STRING },
                colors: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["tone", "coreMessage", "avoidExpressions", "colors"]
            }
          },
          required: ["category", "summary", "targets", "motivations", "marketProblems", "usps", "brandIdentity"]
        }
      }
    });
    return JSON.parse(response.text) as AnalysisResult;
  });
};

export const generatePageStructures = async (analysis: AnalysisResult, info: ProductInfo): Promise<PageStructure[]> => {
  const ai = getAi();
  
  const parts: any[] = [];
  
  // 1. Add Reference Image (if available) for Multimodal analysis
  if (info.images && info.images.length > 0) {
    const refImage = info.images[0];
    const base64Data = refImage.split(',')[1];
    const mimeTypeMatch = refImage.match(/:(.*?);/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }
  }

  const prompt = `제시된 분석 결과를 바탕으로 실제 구매 전환율이 높은 검증된 구조의 10페이지 상세페이지 기획안을 작성하세요.
  
  [중요: 제품 이미지 반영 필수]
  제공된 제품 이미지(참조 이미지)를 정밀 분석하십시오.
  **'visualPrompt'와 'visualPromptKorean'을 작성할 때, 제품의 외형(용기 모양, 색상, 라벨 위치, 재질)을 이미지에 보이는 그대로 상세히 묘사해야 합니다.**
  제품이 변형되거나 다른 디자인으로 묘사되지 않도록 주의하십시오.

  상품: ${info.name}
  감지된 카테고리: ${analysis.category}
  USP: ${analysis.usps.join(", ")}
  톤앤무드: ${analysis.brandIdentity.tone}

  [디자인 전략 핵심 (Core Strategy)]
  1. **모바일 퍼스트 (Mobile-First)**: 작은 화면에서도 즉각적인 정보 습득이 가능하도록 간결하고 큰 텍스트 위주 구성.
  2. **3초의 법칙 (3-Second Rule)**: 첫 화면(Hero)에서 시각적 후킹과 핵심 메시지 전달 필수.
  3. **1섹션 1메시지**: 한 페이지에 하나의 명확한 정보만 전달하여 인지 부하 감소.

  [이미지 스택 구조화 (Image Stack Logic)]
  페이지 순서를 다음 논리에 맞춰 배치하십시오:
  1. **메인 컷 (Hero)**: 제품의 압도적인 첫인상. 고화질 단독 컷 (S1).
  2. **문제 제기 (Intro)**: 소비자 공감 및 상황 연출 (S2).
  3. **피처 컷 (Feature)**: 제품 핵심 기능/USP 클로즈업 (S3, S6).
  4. **인포그래픽 (Infographic)**: 복잡한 스펙, 수치, 데이터를 시각화 (S4).
  5. **라이프스타일 (Lifestyle)**: 실제 사용 환경 연출, 감성 연결 (S5).
  6. **스케일/디테일 (Scale)**: 실제 크기 가늠 또는 제형 디테일 (S7~).
  7. **CTA**: 강력한 구매 유도 (Last Page).

  [비주얼 프롬프트 작성 규칙 (매우 중요 - Gemini 3 Pro Image 최적화)]
  - **언어**: 모든 프롬프트는 **한국어(Korean)**로 작성해야 합니다.
  - **제품 일관성 유지**: 참조 이미지의 제품 특징(색상, 형태)을 모든 프롬프트에 반복적으로 포함시켜 제품이 바뀌지 않도록 하십시오.
  - **텍스트 디자인**: Gemini 3 Pro Image 모델은 텍스트 렌더링 능력이 뛰어납니다. 텍스트(헤드라인)가 이미지의 핵심 그래픽 요소로 작동하도록 요청해야 함. 텍스트가 단순히 얹혀있는 것이 아니라, 질감/조명/배경과 어우러지는 타이포그래피 아트워크로 묘사.
  - **한글 텍스트 렌더링**: 렌더링할 텍스트는 '${analysis.brandIdentity.coreMessage}'나 기획안의 헤드라인 등 **한글 텍스트**를 그대로 사용하도록 지시하세요.
  - **비주얼 프롬프트 (visualPrompt)**: 이미지 생성 모델에 입력할 고품질 **한국어** 프롬프트.
  - **설명 (visualPromptKorean)**: (visualPrompt와 동일하거나 보충 설명).

  [출력 형식]
  총 10개의 페이지(id: 1~10)에 대해 JSON 구조로 반환하세요.
  `;
  
  parts.push({ text: prompt });

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.NUMBER },
              title: { type: Type.STRING },
              purpose: { type: Type.STRING },
              headline: { type: Type.STRING, description: "Main copy. Short and impactful." },
              subHeadline: { type: Type.STRING, description: "Sub copy" },
              bodyText: { type: Type.STRING },
              contentPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              visualPrompt: { type: Type.STRING, description: "Detailed visual description in KOREAN. MUST DESCRIBE THE PRODUCT EXACTLY AS SHOWN IN REFERENCE IMAGE." },
              visualPromptKorean: { type: Type.STRING, description: "Same as visualPrompt. Detailed visual description in Korean." },
              visualStyle: { type: Type.STRING, enum: ['photorealistic', 'illustration', 'infographic'] },
              textStyleConfig: {
                type: Type.OBJECT,
                properties: {
                  fontFamily: { type: Type.STRING },
                  textAlign: { type: Type.STRING },
                  color: { type: Type.STRING },
                  textShadow: { type: Type.BOOLEAN },
                  overlayColor: { type: Type.STRING },
                  overlayOpacity: { type: Type.NUMBER }
                },
                required: ['fontFamily', 'textAlign', 'color', 'textShadow', 'overlayColor', 'overlayOpacity']
              }
            },
            required: ["id", "title", "purpose", "headline", "subHeadline", "bodyText", "contentPoints", "visualPrompt", "visualPromptKorean", "visualStyle", "textStyleConfig"]
          }
        }
      }
    });
    return JSON.parse(response.text) as PageStructure[];
  }, 3, 3000); 
};

export const regenerateVisualPrompt = async (
  page: PageStructure,
  analysis: AnalysisResult,
  userRequest?: string,
  referenceImage?: string
): Promise<{ english: string, korean: string }> => {
  const ai = getAi();
  
  const parts: any[] = [];

  // 1. Add Reference Image (if available) for Multimodal analysis
  if (referenceImage) {
    const base64Data = referenceImage.split(',')[1];
    const mimeTypeMatch = referenceImage.match(/:(.*?);/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }
  }

  // 2. Construct context prompt with STRICT adherence instructions
  const contextPrompt = `
  You are an expert prompt engineer for the "Gemini 3 Pro Image" AI model.
  Your goal is to write a highly descriptive **KOREAN** prompt that will generate a high-quality commercial image.

  [CRITICAL: STRICT PRODUCT REPLICATION]
  The user requires the generated image to contain an **EXACT REPLICA** of the product shown in the reference image.
  
  1. **Analyze First**: Look at the reference image. Identify the container shape, cap style, color hex codes, surface finish (matte/glossy), and label layout.
  2. **Mandatory Description**: Your **Korean** prompt MUST START with a detailed physical description of this product.
     (e.g., "흰색 원통형 병에 금색 펌프가 달려있고...")
  3. **No Modification**: Do NOT change the product's color, shape, or aspect ratio. Do not "improve" the design. Keep it exactly as is.
  4. **Contextualize**: Place this exact product into the scene described by the section context.

  [TEXT RENDERING IN KOREAN]
  Gemini 3 Pro Image has EXCELLENT text rendering capabilities in Korean. 
  You should explicitly instruct the model to render the Korean text: "${page.headline}" inside the image.
  
  [Product Info]
  Product: ${analysis.summary}
  Tone: ${analysis.brandIdentity.tone}
  Colors: ${analysis.brandIdentity.colors.join(", ")}

  [Page Section Context]
  Section Type: ${page.purpose}
  Headline (To Render): "${page.headline}"
  Content Focus: ${page.contentPoints.join(", ")}
  
  [Directives for Prompt]
  1. Language: **Korean (한국어)** ONLY.
  2. Format: Continuous paragraph.
  3. Content: **PRODUCT DESCRIPTION (FIXED)** + SCENE DESCRIPTION + LIGHTING + MOOD + **KOREAN TEXT RENDER INSTRUCTION**.
  4. Specificity: Be extremely specific.
  5. Text Handling: Include instructions for the model to render the Headline ("${page.headline}") clearly in Korean.
  6. Style: ${page.visualStyle}.
  ${userRequest ? `7. Modification Request: "${userRequest}" - Incorporate this feedback (BUT DO NOT CHANGE PRODUCT APPEARANCE).` : ""}

  [Output Format]
  Return a JSON object with:
  - "english": The optimized **KOREAN** prompt (mapped to this field for compatibility).
  - "korean": The same Korean description or explanation.

  Generate the optimized image prompt now.
  `;
  
  parts.push({ text: contextPrompt });

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING, description: "The optimized prompt in KOREAN." },
            korean: { type: Type.STRING }
          },
          required: ["english", "korean"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const generatePageImage = async (
  page: PageStructure, 
  analysis: AnalysisResult, 
  referenceImage?: string, 
  userMessage?: string
): Promise<string> => {
    // Legacy function support
   return ""; 
};
