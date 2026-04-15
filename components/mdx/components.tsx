import type { MDXComponents } from 'mdx/types'
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react'
import { KeywordLink } from '@/components/blog/KeywordLink'
import { Callout } from '@/components/mdx/Callout'
import { QuickSort } from '@/components/visualizations/QuickSort'

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  'data-keyword-link'?: string
}

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-10 mb-4 text-[26px] font-bold tracking-[-0.015em]" {...props}>
      {children}
    </h1>
  ),
  a: ({ href, children, ...props }: AnchorProps) => {
    if (props['data-keyword-link'] === 'true' && typeof href === 'string') {
      return <KeywordLink href={href}>{children}</KeywordLink>
    }
    return (
      <a
        href={href}
        className="text-primary underline decoration-dotted underline-offset-4"
        {...props}
      >
        {children}
      </a>
    )
  },
  img: ({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ''}
      className="my-6 rounded-[14px] border border-border"
      {...props}
    />
  ),
  Callout,
  QuickSort,
}
