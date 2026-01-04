
export interface ProductInfo {
  name: string;
  description: string;
  images: string[]; // base64 strings
  originalPrice: string;
  salePrice: string;
}

export interface BrandIdentity {
  tone: string;
  coreMessage: string;
  avoidExpressions: string;
  colors: string[];
}

export type ProductCategory = 'Fashion' | 'Beauty' | 'Living' | 'Digital' | 'Health' | 'Food' | 'General';

export interface AnalysisResult {
  category: ProductCategory;
  summary: string;
  targets: string[];
  motivations: string[];
  marketProblems: string[];
  usps: string[];
  brandIdentity: BrandIdentity;
}

export type VisualStyle = 'photorealistic' | 'illustration' | 'infographic';

export interface TextStyleConfig {
  fontFamily: string; // 'Pretendard Variable' | '"Nanum Myeongjo", serif'
  textAlign: 'left' | 'center' | 'right';
  color: string;
  textShadow: boolean;
  overlayColor: string;
  overlayOpacity: number;
}

export interface PageStructure {
  id: number;
  title: string;
  purpose: string;
  headline: string;     // Big Title
  subHeadline: string;  // Medium Title
  bodyText: string;     // Description
  contentPoints: string[];
  visualPrompt: string;
  visualPromptKorean: string; // Added: Initial Korean translation/description
  visualStyle: VisualStyle;
  textStyleConfig?: TextStyleConfig; // Added for per-section styling
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  textShadow: boolean;
  
  // Visibility Toggles (Create/Delete)
  showHeadline: boolean;
  showSubHeadline: boolean;
  showBodyText: boolean;

  // Background Style
  overlayColor: string;
  overlayColorEnd: string; // For gradient
  useGradient: boolean;    // Toggle gradient
  gradientDirection: string; 
  overlayOpacity: number;
  overlayBlur: number;
  
  // Independent Positioning
  headlinePosition: { x: number; y: number };
  subHeadlinePosition: { x: number; y: number };
  bodyPosition: { x: number; y: number };
}

export type Step = 'input' | 'analysis' | 'generation';
