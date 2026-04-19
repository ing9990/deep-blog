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
import { Tab, Tabs } from '@/components/mdx/Tabs'
import { CacheStampedeDefenseTimeline } from '@/components/visualizations/CacheStampedeDefenseTimeline'
import { CardinalitySpectrum } from '@/components/visualizations/CardinalitySpectrum'
import { CardinalityTradeoff } from '@/components/visualizations/CardinalityTradeoff'
import { CompositeIndexLeaf } from '@/components/visualizations/CompositeIndexLeaf'
import { BTreeInsert } from '@/components/visualizations/BTreeInsert'
import { DDDAggregate } from '@/components/visualizations/DDDAggregate'
import { DDDBoundedContext } from '@/components/visualizations/DDDBoundedContext'
import { DDDTermConfusion } from '@/components/visualizations/DDDTermConfusion'
import { GCAlgorithmMatrix } from '@/components/visualizations/GCAlgorithmMatrix'
import { GCCycle } from '@/components/visualizations/GCCycle'
import { GCHeapStructure } from '@/components/visualizations/GCHeapStructure'
import { IdempotencyCausalityChain } from '@/components/visualizations/IdempotencyCausalityChain'
import { IdempotencyKeyFlow } from '@/components/visualizations/IdempotencyKeyFlow'
import { IOModelMatrix } from '@/components/visualizations/IOModelMatrix'
import { IOModelTimeline } from '@/components/visualizations/IOModelTimeline'
import { KafkaConsumerGroupScopes } from '@/components/visualizations/KafkaConsumerGroupScopes'
import { KafkaPartitionStructure } from '@/components/visualizations/KafkaPartitionStructure'
import { OptimizerPipeline } from '@/components/visualizations/OptimizerPipeline'
import { PERBetaSlider } from '@/components/visualizations/PERBetaSlider'
import { QuickSort } from '@/components/visualizations/QuickSort'
import { QuickSortPivot } from '@/components/visualizations/QuickSortPivot'
import { RedundancyFailurePatterns } from '@/components/visualizations/RedundancyFailurePatterns'
import { RemoteCallOutcomes } from '@/components/visualizations/RemoteCallOutcomes'
import { RestaurantIOSequence } from '@/components/visualizations/RestaurantIOSequence'
import { SecondaryIndexLookup } from '@/components/visualizations/SecondaryIndexLookup'
import { SequentialVsRandomIO } from '@/components/visualizations/SequentialVsRandomIO'
import { SoaVsKafkaTopology } from '@/components/visualizations/SoaVsKafkaTopology'
import { TrieBuilder } from '@/components/visualizations/TrieBuilder'
import { TrieDeleteSnapshot } from '@/components/visualizations/TrieDeleteSnapshot'
import { TwoGeneralsMessenger } from '@/components/visualizations/TwoGeneralsMessenger'

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  'data-keyword-link'?: string
}

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-10 mb-4 text-[length:var(--text-h1)] font-bold tracking-[var(--tracking-tighter)]" {...props}>
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
      className="my-6 rounded-[var(--radius-panel)] border border-border"
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
  CacheStampedeDefenseTimeline,
  Callout,
  GCAlgorithmMatrix,
  GCCycle,
  GCHeapStructure,
  CardinalitySpectrum,
  CardinalityTradeoff,
  CompositeIndexLeaf,
  DDDAggregate,
  DDDBoundedContext,
  DDDTermConfusion,
  IdempotencyCausalityChain,
  IdempotencyKeyFlow,
  IOModelMatrix,
  IOModelTimeline,
  KafkaConsumerGroupScopes,
  KafkaPartitionStructure,
  OptimizerPipeline,
  PERBetaSlider,
  QuickSort,
  QuickSortPivot,
  RedundancyFailurePatterns,
  RelatedPost,
  RemoteCallOutcomes,
  RestaurantIOSequence,
  SecondaryIndexLookup,
  SequentialVsRandomIO,
  SoaVsKafkaTopology,
  Tab,
  TrieBuilder,
  TrieDeleteSnapshot,
  TwoGeneralsMessenger,
  Tabs,
}
