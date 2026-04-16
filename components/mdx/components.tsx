import type { MDXComponents } from 'mdx/types'
import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ImgHTMLAttributes,
  TableHTMLAttributes,
} from 'react'
import { KeywordLink } from '@/components/blog/KeywordLink'
import { RelatedPost } from '@/components/blog/RelatedPost'
import { Callout } from '@/components/mdx/Callout'
import { CardinalitySpectrum } from '@/components/visualizations/CardinalitySpectrum'
import { CardinalityTradeoff } from '@/components/visualizations/CardinalityTradeoff'
import { CompositeIndexLeaf } from '@/components/visualizations/CompositeIndexLeaf'
import { BTreeInsert } from '@/components/visualizations/BTreeInsert'
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
  // Wrap every MDX table in a horizontally scrollable container so wide
  // tables never force the whole page to scroll. Styling lives in
  // .prose-kr .table-wrapper / .prose-kr table in app/globals.css.
  table: ({ children, ...props }: TableHTMLAttributes<HTMLTableElement>) => (
    <div className="table-wrapper">
      <table {...props}>{children}</table>
    </div>
  ),
  // Forward th/td unchanged so authors can still add className="num" for
  // numeric-column alignment without losing other attributes.
  th: (props: HTMLAttributes<HTMLTableCellElement>) => <th {...props} />,
  td: (props: HTMLAttributes<HTMLTableCellElement>) => <td {...props} />,
  BTreeInsert,
  Callout,
  CardinalitySpectrum,
  CardinalityTradeoff,
  CompositeIndexLeaf,
  QuickSort,
  RelatedPost,
}
