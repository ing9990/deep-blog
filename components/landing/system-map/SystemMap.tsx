import { getAllSlugs } from '@/lib/posts'

import { domains } from './data/domains'
import { features } from './data/features'
import { FeatureAccordion } from './FeatureAccordion'

export function SystemMap() {
  const existingSlugs = new Set(getAllSlugs())

  const featuresByDomain = new Map<string, typeof features>()
  for (const f of features) {
    const list = featuresByDomain.get(f.domain) ?? []
    list.push(f)
    featuresByDomain.set(f.domain, list)
  }

  const firstRenderedDomainId = domains.find(
    (d) => (featuresByDomain.get(d.id) ?? []).length > 0,
  )?.id

  return (
    <section aria-label="미니쿠팡 시스템 맵" className="w-full">
      <div className="mx-auto w-full max-w-4xl px-6">
        <header className="mb-10 border-b border-border pb-8">
          <div className="mb-2 font-mono text-[length:var(--text-2xs)] font-semibold uppercase tracking-[var(--tracking-wider)] text-muted-foreground">
            System Map · mini-coupang
          </div>
          <h2 className="text-balance text-3xl font-bold leading-[var(--leading-tight)] tracking-tight md:text-4xl">
            요구사항 & 선택사항과 근거
          </h2>
        </header>

        <div className="space-y-14">
          {domains.map((domain) => {
            const domainFeatures = featuresByDomain.get(domain.id) ?? []
            if (domainFeatures.length === 0) return null
            return (
              <div key={domain.id}>
                <div className="mb-5 flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                      {domain.label}
                    </h3>
                    <p
                      className="mt-1.5 max-w-xl text-[length:var(--text-md)] leading-[var(--leading-normal)] text-muted-foreground"
                      style={{ fontFamily: 'var(--font-reading)' }}
                    >
                      {domain.summary}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[length:var(--text-2xs)] text-muted-foreground">
                    {domainFeatures.length}{' '}
                    {domainFeatures.length === 1 ? 'feature' : 'features'}
                  </span>
                </div>
                <div className="space-y-3">
                  {domainFeatures.map((f, i) => (
                    <FeatureAccordion
                      key={f.id}
                      feature={f}
                      existingSlugs={existingSlugs}
                      defaultOpen={domain.id === firstRenderedDomainId && i === 0}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <footer
          className="mt-14 rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4 text-[length:var(--text-sm)] leading-[var(--leading-relaxed)] text-muted-foreground"
          style={{ fontFamily: 'var(--font-reading)' }}
        >
          <b className="text-foreground">계속 추가됩니다.</b> 기능별 글은 블로그 <code
            className="rounded border border-border bg-background px-1 py-[1px] font-mono text-[length:var(--text-xs)]"
            style={{ color: 'var(--code-inline-fg)' }}
          >mini-coupang-backend</code> 카테고리로 묶입니다. 선택 사항과 근거는 실제 코드·커밋에 그대로 남아 있도록 관리합니다.
        </footer>
      </div>
    </section>
  )
}
