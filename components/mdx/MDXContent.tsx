import type { ComponentType } from 'react'
import type { MDXComponents } from 'mdx/types'
import * as runtime from 'react/jsx-runtime'
import { mdxComponents } from './index'
import { TabsGroupProvider } from '@/components/mdx/TabsGroupProvider'

// The runtime module shape expected by Velite's compiled body strings.
// Each body string begins with: const{Fragment,jsx,jsxs}=arguments[0];
// and ends with: return{default:function(props={}){...}};
type RuntimeModule = typeof runtime

// The module object returned by evaluating the compiled body.
type MDXModule = {
  default: ComponentType<{ components?: MDXComponents }>
}

/**
 * useMDXComponent — Velite's canonical "Use in React" helper.
 *
 * Velite compiles each MDX file into a self-contained function-body string.
 * The string is wrapped via new Function(code) which, when called with the
 * react/jsx-runtime object, executes the compiled source and returns an
 * { default: Component } module. We then render Component with our shared
 * component map so MDX authors can use <Callout />, <Diagram />, etc.
 *
 * Security note (spec §7.2): the code string is Velite's deterministic
 * compiler output from version-controlled MDX files, never user input.
 */
const useMDXComponent = (code: string): ComponentType<{ components?: MDXComponents }> => {
  const fn = new Function(code) as (rt: RuntimeModule) => MDXModule
  return fn(runtime).default
}

interface MDXContentProps {
  code: string
}

/**
 * MDXContent — server-side RSC wrapper that evaluates a Velite-compiled MDX
 * body and renders it with the shared component map.
 *
 * Must remain a Server Component (no 'use client').
 */
export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return (
    <TabsGroupProvider>
      <Component components={mdxComponents} />
    </TabsGroupProvider>
  )
}
