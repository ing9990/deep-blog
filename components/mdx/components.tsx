import type { MDXComponents } from 'mdx/types'

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-10 mb-4 text-[26px] font-bold tracking-[-0.015em]" {...props}>
      {children}
    </h1>
  ),
  a: ({ children, ...props }) => (
    <a className="text-primary underline decoration-dotted underline-offset-4" {...props}>
      {children}
    </a>
  ),
}
