# Smile Shot Design System

## 1. 색상 시스템 (Color System)

### 1.1 Primary Colors
```css
--primary: #10b981;        /* 에메랄드 그린 - 메인 브랜드 색상 */
--primary-dark: #059669;   /* 진한 에메랄드 - 호버/액티브 상태 */
--primary-light: #34d399;  /* 밝은 에메랄드 - 강조 표시 */
--primary-subtle: #d1fae5; /* 아주 밝은 에메랄드 - 배경 */
```

### 1.2 Neutral Colors (12-Step Gray Scale)
```css
--gray-0: #ffffff;    /* Pure white */
--gray-1: #fafafa;    /* 98% */
--gray-2: #f5f5f5;    /* 96% */
--gray-3: #eeeeee;    /* 93% */
--gray-4: #e0e0e0;    /* 88% */
--gray-5: #bdbdbd;    /* 74% */
--gray-6: #9e9e9e;    /* 62% */
--gray-7: #757575;    /* 46% */
--gray-8: #616161;    /* 38% */
--gray-9: #424242;    /* 26% */
--gray-10: #212121;   /* 13% - Primary text */
--gray-11: #111111;   /* 7% - Darkest text */

/* Legacy mapping for compatibility */
--gray-50: var(--gray-1);
--gray-100: var(--gray-2);
--gray-200: var(--gray-3);
--gray-300: var(--gray-4);
--gray-400: var(--gray-5);
--gray-500: var(--gray-6);
--gray-600: var(--gray-7);
--gray-700: var(--gray-8);
--gray-800: var(--gray-9);
--gray-900: var(--gray-10);
```

### 1.3 Semantic Colors
```css
/* Success */
--success: #10b981;
--success-light: #34d399;
--success-dark: #059669;

/* Error */
--error: #ef4444;
--error-light: #fca5a5;
--error-dark: #dc2626;

/* Warning */
--warning: #f59e0b;
--warning-light: #fbbf24;
--warning-dark: #d97706;

/* Info */
--info: #3b82f6;
--info-light: #60a5fa;
--info-dark: #2563eb;
```

### 1.4 Surface Colors
```css
--background: var(--gray-0);      /* #ffffff */
--surface: var(--gray-0);         /* #ffffff */
--surface-hover: var(--gray-1);   /* #fafafa */
--surface-active: var(--gray-2);  /* #f5f5f5 */
--border: var(--gray-3);          /* #eeeeee */
--border-focus: var(--primary);   /* #10b981 */

/* Text Colors */
--text-primary: var(--gray-10);   /* #111111 - Primary text */
--text-secondary: var(--gray-7);  /* #757575 - Secondary text */
--text-tertiary: var(--gray-6);   /* #9e9e9e - Disabled/hint text */
--text-inverse: var(--gray-0);    /* #ffffff - Text on dark backgrounds */
```

## 2. 타이포그래피 (Typography)

### 2.1 Font Family
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, "Noto Sans", sans-serif, 
             "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", 
             "Noto Color Emoji";
--font-mono: Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

### 2.2 Font Sizes
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### 2.3 Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 2.4 Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## 3. 간격 시스템 (Spacing System)

### 3.1 Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 3.2 Container Sizes
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1200px;
```

## 4. 컴포넌트 스타일 (Component Styles)

### 4.1 Buttons
```css
/* Primary Button */
.button-primary {
  background: var(--primary);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
}

.button-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.button-secondary {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
}

/* Ghost Button */
.button-ghost {
  background: transparent;
  color: var(--text-primary);
  padding: var(--space-2) var(--space-4);
}
```

### 4.2 Form Elements
```css
/* Input Fields */
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--background);
  transition: all 0.2s ease;
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:focus {
  outline: 2px solid var(--primary);
  outline-offset: 0;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.input.error {
  border-color: var(--error);
}

.input.error:focus {
  outline-color: var(--error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

### 4.3 Cards
```css
.card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

.card-hover:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

## 5. 레이아웃 시스템 (Layout System)

### 5.1 Grid System
```css
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

### 5.2 Flexbox Utilities
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
```

## 6. 애니메이션 (Animation)

### 6.1 Transitions
```css
--transition-all: all 0.2s ease;
--transition-colors: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
--transition-transform: transform 0.2s ease;
--transition-opacity: opacity 0.2s ease;
```

### 6.2 Keyframe Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 7. 접근성 (Accessibility)

### 7.1 Focus Styles
```css
/* 기본 포커스 스타일 */
*:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 다크 배경에서의 포커스 */
.dark-bg *:focus-visible {
  outline-color: var(--primary-light);
}
```

### 7.2 Skip Links
```css
.skip-link {
  position: absolute;
  top: -60px;
  left: 0;
  background: var(--primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  text-decoration: none;
  border-radius: 0 0 var(--radius-md) 0;
  z-index: 100;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 0;
}
```

### 7.3 Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## 8. 반응형 디자인 (Responsive Design)

### 8.1 Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### 8.2 Media Queries
```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast */
@media (prefers-contrast: high) {
  *:focus-visible {
    outline-width: 4px;
  }
}
```

## 9. 그림자 효과 (Shadows)

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## 10. 모서리 반경 (Border Radius)

```css
--radius-sm: 0.25rem;   /* 4px */
--radius: 0.375rem;     /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* 완전한 원 */
```

## 11. Z-Index 시스템

```css
--z-0: 0;
--z-10: 10;
--z-20: 20;
--z-30: 30;
--z-40: 40;
--z-50: 50;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-modal: 1030;
--z-popover: 1040;
--z-tooltip: 1050;
```

## 12. 특수 컴포넌트 스타일

### 12.1 Toast Notifications
```css
.toast {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
}

.toast-success {
  border-left: 4px solid var(--success);
}

.toast-error {
  border-left: 4px solid var(--error);
}

.toast-warning {
  border-left: 4px solid var(--warning);
}
```

### 12.2 Tab Navigation
```css
.tab-menu {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--gray-2);
  border-radius: var(--radius-lg);
}

.tab-button {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  transition: var(--transition-all);
}

.tab-button.active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}
```

### 12.3 Progress Indicators
```css
.progress-bar {
  height: 8px;
  background: var(--gray-3);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
```

## 13. 다크 모드 (Dark Mode) - 향후 구현

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Invert gray scale for dark mode */
    --background: var(--gray-11);     /* #111111 */
    --surface: var(--gray-10);        /* #212121 */
    --surface-hover: var(--gray-9);   /* #424242 */
    --surface-active: var(--gray-8);  /* #616161 */
    --border: var(--gray-8);          /* #616161 */
    
    /* Text colors inverted */
    --text-primary: var(--gray-0);    /* #ffffff */
    --text-secondary: var(--gray-3);  /* #eeeeee */
    --text-tertiary: var(--gray-5);   /* #bdbdbd */
    --text-inverse: var(--gray-11);   /* #111111 */
  }
}
```

## 14. 사용 가이드라인

### 14.1 색상 사용
- **Primary Color**: 주요 CTA, 활성 상태, 포커스 표시
- **Neutral Colors**: 
  - `gray-10` (#111111): 기본 텍스트, 제목
  - `gray-7` (#757575): 보조 텍스트, 레이블
  - `gray-6` (#9e9e9e): 비활성 텍스트, 힐트
  - `gray-3` (#eeeeee): 테두리, 구분선
  - `gray-1` (#fafafa): 호버 배경
  - `gray-0` (#ffffff): 기본 배경
- **Semantic Colors**: 상태 표시 (성공, 에러, 경고, 정보)

### 14.2 간격 사용
- 컴포넌트 내부: `space-2` ~ `space-4`
- 컴포넌트 간: `space-4` ~ `space-8`
- 섹션 간: `space-8` ~ `space-16`

### 14.3 타이포그래피
- 본문: `text-base`, `font-normal`, `leading-normal`, `color: var(--text-primary)`
- 제목: `text-xl` ~ `text-4xl`, `font-semibold` ~ `font-bold`, `color: var(--text-primary)`
- 보조 텍스트: `text-sm`, `color: var(--text-secondary)`
- 비활성 텍스트: `text-sm`, `color: var(--text-tertiary)`

### 14.4 접근성
- 모든 인터랙티브 요소는 명확한 포커스 표시
- 색상 대비 비율 WCAG AA 준수 (4.5:1 이상)
- 키보드 네비게이션 완벽 지원

## 15. 그레이 스케일 사용 예시

### 15.1 텍스트 계층 구조
```css
/* 제목 */
h1, h2, h3 {
  color: var(--gray-10);  /* #111111 - 가장 진한 텍스트 */
}

/* 본문 */
p, div {
  color: var(--gray-10);  /* #111111 - 기본 텍스트 */
}

/* 레이블, 설명 */
label, .description {
  color: var(--gray-7);   /* #757575 - 보조 텍스트 */
}

/* 힐트, placeholder */
.hint, ::placeholder {
  color: var(--gray-6);   /* #9e9e9e - 힐트 텍스트 */
}

/* 비활성 상태 */
.disabled {
  color: var(--gray-5);   /* #bdbdbd - 비활성 텍스트 */
}
```

### 15.2 UI 요소 계층 구조
```css
/* 카드 */
.card {
  background: var(--gray-0);      /* #ffffff */
  border: 1px solid var(--gray-3); /* #eeeeee */
}

.card:hover {
  background: var(--gray-1);      /* #fafafa */
}

/* 버튼 */
.button-secondary {
  background: var(--gray-0);      /* #ffffff */
  border: 2px solid var(--gray-4); /* #e0e0e0 */
  color: var(--gray-10);          /* #111111 */
}

.button-secondary:hover {
  background: var(--gray-1);      /* #fafafa */
  border-color: var(--gray-5);    /* #bdbdbd */
}

/* 입력 필드 */
.input {
  background: var(--gray-0);      /* #ffffff */
  border: 1px solid var(--gray-3); /* #eeeeee */
  color: var(--gray-10);          /* #111111 */
}

.input:focus {
  border-color: var(--primary);
  background: var(--gray-0);
}

.input:disabled {
  background: var(--gray-2);      /* #f5f5f5 */
  color: var(--gray-5);           /* #bdbdbd */
}
```

### 15.3 그레이 스케일 대비율
- `gray-10` on `gray-0`: 21:1 (WCAG AAA)
- `gray-7` on `gray-0`: 4.5:1 (WCAG AA)
- `gray-6` on `gray-0`: 3:1 (WCAG AA for large text)
- `gray-5` on `gray-0`: 2.3:1 (Decorative only)

---

**마지막 업데이트**: 2025-08-25
**버전**: 1.1.0