import type { Language } from '@/components/providers/SettingsProvider'

export const MESSAGES = {
  // 헤더 네비 / 인터랙션
  'header.search.placeholder': { ko: '검색...',           en: 'Search...' },
  'header.open.nav':           { ko: '카테고리 열기',     en: 'Open navigation' },
  'header.open.search':        { ko: '검색 열기',         en: 'Open search' },
  'header.open.toc':           { ko: '목차 열기',         en: 'Open table of contents' },
  'toc.label':                 { ko: '목차',              en: 'Contents' },
  'header.open.github':        { ko: 'GitHub 저장소 열기', en: 'Open GitHub repository' },
  'header.open.settings':      { ko: '언어 및 테마 설정 열기', en: 'Open language and theme settings' },
  'header.site.actions':       { ko: '사이트 액션',       en: 'Site actions' },

  // 인덱스 / 필터
  'index.category.filter':     { ko: '카테고리 필터',     en: 'Category filter' },
  'index.all':                 { ko: '전체',              en: 'All' },
  'index.total.count':         { ko: '전체 {n}개 글',     en: '{n} posts total' },
  'index.empty':               { ko: '조건에 맞는 글이 없습니다. 필터를 조정해보세요.',
                                 en: 'No posts match your filter. Try adjusting filters.' },
  'tag.filter.all':            { ko: '전체',              en: 'All' },
  'tag.page.back':             { ko: '전체 글 목록',      en: 'All posts' },
  'tag.page.count':            { ko: '{n}개 글',          en: '{n} posts' },

  // 정렬
  'sort.latest':               { ko: '최신순',            en: 'Newest' },
  'sort.oldest':               { ko: '오래된순',          en: 'Oldest' },
  'sort.title':                { ko: '제목순',            en: 'Title' },

  // 포스트
  'post.recent':               { ko: '최근 글',           en: 'Recent Posts' },
  'post.reading.time':         { ko: '읽기 {n}분',        en: '{n} min read' },

  // 설정 패널
  'settings.title':            { ko: '설정',              en: 'Settings' },
  'settings.open':             { ko: '설정 열기',         en: 'Open settings' },
  'settings.close':            { ko: '설정 닫기',         en: 'Close settings' },
  'settings.theme':            { ko: '테마',              en: 'Theme' },
  'settings.layout.timeline':  { ko: 'Default',           en: 'Default' },
  'settings.layout.editorial': { ko: 'Editorial',         en: 'Editorial' },
  'settings.layout.floating':  { ko: 'Floating',          en: 'Floating' },
  'settings.language':         { ko: '언어',              en: 'Language' },
  'settings.lang.ko':          { ko: '한국어',            en: 'Korean' },
  'settings.lang.en':          { ko: '영어',              en: 'English' },
  'settings.font':             { ko: '폰트 크기',         en: 'Font size' },
  'settings.font.small':       { ko: '작게',              en: 'Small' },
  'settings.font.normal':      { ko: '보통',              en: 'Normal' },
  'settings.font.large':       { ko: '크게',              en: 'Large' },
  'settings.code':             { ko: '코드 블록 테마',    en: 'Code block theme' },
  'settings.code.flat':        { ko: 'Flat',              en: 'Flat' },
  'settings.code.floating':    { ko: 'Floating',          en: 'Floating' },
  'settings.syntax':           { ko: 'Syntax 테마',       en: 'Syntax theme' },
  'settings.syntax.atom':      { ko: 'Atom',              en: 'Atom' },
  'settings.syntax.github':    { ko: 'GitHub',            en: 'GitHub' },
  'settings.syntax.vitesse':   { ko: 'Vitesse',           en: 'Vitesse' },
} as const

export type MessageKey = keyof typeof MESSAGES

export function translate(
  key: MessageKey,
  lang: Language,
  params?: Record<string, string | number>,
): string {
  let msg: string = MESSAGES[key][lang]
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replaceAll(`{${k}}`, String(v))
    }
  }
  return msg
}
