import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Code2,
  CreditCard,
  Cpu,
  Database,
  Mail,
  Package,
  Server,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Zap,
} from 'lucide-react'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.604-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const BLOG_URL = 'https://deep.ing9990.com'
const GITHUB_URL = 'https://github.com/ing9990/deep-blog'
const LINKEDIN_URL = 'https://www.linkedin.com/in/ing9990'
const EMAIL = 'gimgau0218@naver.com'

const BLOG_TOPICS = [
  { icon: Database, label: 'Database Index' },
  { icon: Server, label: 'Distributed Systems' },
  { icon: Cpu, label: 'JVM Internals' },
  { icon: Zap, label: 'Cache & Stampede' },
  { icon: Sparkles, label: 'Coroutines' },
  { icon: BookOpen, label: 'CAP · Kafka · DDD' },
]

const SERVICES = [
  { icon: ShoppingBag, label: 'product-service', status: 'in progress' },
  { icon: ShoppingCart, label: 'order-service', status: 'planned' },
  { icon: CreditCard, label: 'payment-service', status: 'planned' },
  { icon: Package, label: 'data-ingestion', status: 'planned' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top nav */}
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-lg">DEEP</span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link
            href={GITHUB_URL}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            <GithubIcon className="h-4 w-4" />
            <span>GitHub</span>
          </Link>
          <Link
            href={BLOG_URL}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-primary-foreground transition-opacity hover:opacity-90"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>블로그</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          <span>blog · sandbox · engineering</span>
        </div>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl md:leading-[1.15]">
          블로그로 이해하고,
          <br />
          <span className="text-primary">코드로 증명한다.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          DEEP은 깊은 CS 이론을 블로그로 정리하고, 같은 지식을 재료 삼아 미니 Coupang을
          만들고 있습니다. 각 글이 답하는 문제는 이 서비스 어딘가에서 실제로 돌아갑니다.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={BLOG_URL}
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>블로그 보러가기</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <Link
            href={GITHUB_URL}
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            target="_blank"
            rel="noreferrer"
          >
            <GithubIcon className="h-4 w-4" />
            <span>GitHub에서 프로젝트 보기</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Two cards */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1 — Blog */}
          <article className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Deep Dive
                </div>
                <h2 className="text-lg font-bold">이론을 쉽게 정리합니다</h2>
              </div>
            </div>
            <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
              데이터베이스 인덱스, 트랜잭션 격리, 분산 시스템, JVM 내부, 캐시·메시지 큐 같은
              주제를 "왜 이렇게 생겼는지" 중심으로 풀어냅니다. 외우는 대신 감각적으로
              이해하는 데 초점을 맞춥니다.
            </p>
            <ul className="mb-6 flex flex-wrap gap-2">
              {BLOG_TOPICS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <Link
              href={BLOG_URL}
              className="group mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <span>deep.ing9990.com</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </article>

          {/* Card 2 — Backend Sandbox */}
          <article className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Code2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Build In Public
                </div>
                <h2 className="text-lg font-bold">이커머스 백엔드를 쌓아갑니다</h2>
              </div>
            </div>
            <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
              상품·주문·결제·데이터 수집 같은 실제 도메인을 Spring Boot + Kotlin으로
              구현합니다. 블로그가 다룬 기술 과제는 이 저장소의 어딘가에 코드와 테스트로
              남습니다.
            </p>
            <ul className="mb-5 space-y-2">
              {SERVICES.map(({ icon: Icon, label, status }) => (
                <li
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 font-mono text-xs text-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {label}
                  </span>
                  <span
                    className={
                      status === 'in progress'
                        ? 'text-[11px] font-medium text-primary'
                        : 'text-[11px] text-muted-foreground'
                    }
                  >
                    {status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mb-6 text-xs text-muted-foreground">
              현재 로컬 전용으로 성장 중. 배포는 서비스가 공개할 만큼 자라면 열 예정입니다.
            </p>
            <Link
              href={GITHUB_URL}
              className="group mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon className="h-4 w-4" />
              <span>github.com/ing9990/deep-blog</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">DEEP</span>
            <span className="text-sm text-muted-foreground">· built by @ing9990</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link
              href={GITHUB_URL}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <GithubIcon className="h-4 w-4" />
              <span>ing9990</span>
            </Link>
            <Link
              href={LINKEDIN_URL}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <LinkedinIcon className="h-4 w-4" />
              <span>ing9990</span>
            </Link>
            <Link
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>{EMAIL}</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
