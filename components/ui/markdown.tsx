'use client'

import React, { useMemo, useCallback, Suspense } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkEmoji from 'remark-emoji'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import type { PluggableList } from 'unified'
import { Download, ExternalLink, Copy, Check } from 'lucide-react'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

export interface StyleConfig {
  codeTheme?: 'light' | 'dark' | 'github' | 'monokai'
  mathTheme?: 'default' | 'colorful'
  linkTarget?: '_blank' | '_self' | '_parent' | '_top'
  showLineNumbers?: boolean
}

export interface MarkdownRendererProps {
  content: string
  className?: string
  config?: StyleConfig
  onLinkClick?: (url: string, event: React.MouseEvent) => void
  onDownloadClick?: (url: string, filename: string) => void
  enableMermaid?: boolean
  enableMath?: boolean
  enableEmoji?: boolean
  maxWidth?: string
}

// Encabezado del bloque de código con botón de copiar
const CodeBlockHeader: React.FC<{
  language: string
  onCopy: () => void
  copied: boolean
}> = ({ language, onCopy, copied }) => (
  <div className='flex items-center justify-between rounded-t-xl bg-muted/90 border-b border-border/40 px-3.5 py-1.5 text-xs font-mono select-none'>
    <span className='capitalize text-muted-foreground font-semibold'>{language || 'código'}</span>
    <button
      type='button'
      onClick={onCopy}
      className='flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer'
    >
      {copied ? <Check className='h-3.5 w-3.5 text-emerald-500' /> : <Copy className='h-3.5 w-3.5' />}
      <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
    </button>
  </div>
)

const SyntaxHighlighter = React.lazy(() =>
  import('react-syntax-highlighter').then((mod) => ({ default: mod.Prism }))
)

const CodeBlockContent: React.FC<{
  code: string
  language: string
  theme: string
  showLineNumbers: boolean
}> = ({ code, language, theme, showLineNumbers = false }) => {
  return (
    <Suspense fallback={<pre className='p-3 text-xs font-mono bg-muted/40 rounded-b-xl overflow-x-auto'>{code}</pre>}>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        wrapLines={true}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 0.75rem 0.75rem',
          padding: '0.875rem',
          fontSize: '0.8125rem',
          lineHeight: '1.5',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          fontFamily:
            "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
        lineNumberStyle={{
          minWidth: '2em',
          paddingRight: '0.75em',
          textAlign: 'right',
          color: theme === 'dark' ? '#6b7280' : '#9ca3af',
          borderRight: '1px solid',
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Suspense>
  )
}

// Bloque de Código Principal
const CodeBlock: React.FC<{
  node?: any
  inline?: boolean
  className?: string
  children: React.ReactNode
  theme: string
  showLineNumbers: boolean
}> = ({ className, children, theme, showLineNumbers = false }) => {
  const [copied, setCopied] = React.useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''

  const extractTextContent = (childNodes: React.ReactNode): string => {
    if (typeof childNodes === 'string') {
      return childNodes
    }
    if (Array.isArray(childNodes)) {
      return childNodes.map((child) => extractTextContent(child)).join('')
    }
    if (React.isValidElement(childNodes)) {
      return extractTextContent((childNodes.props as any)?.children)
    }
    return ''
  }

  const code = React.useMemo(() => {
    const content = extractTextContent(children).replace(/\n$/, '')

    if (language === 'json' || language === 'javascript') {
      try {
        const parsed = JSON.parse(content)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return content
      }
    }
    return content
  }, [children, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar código:', err)
    }
  }

  if (language.toLowerCase() === 'mermaid') {
    return <MermaidDiagram content={code} />
  }

  if (language) {
    return (
      <div className='group relative my-3 rounded-xl border border-border/70 overflow-hidden shadow-xs'>
        <CodeBlockHeader
          language={language}
          onCopy={handleCopy}
          copied={copied}
        />
        <div className='relative font-mono'>
          <CodeBlockContent
            code={code}
            language={language}
            theme={theme}
            showLineNumbers={showLineNumbers}
          />
        </div>
      </div>
    )
  }

  return (
    <code className='rounded-md bg-muted/80 px-1.5 py-0.5 text-[0.85em] font-mono font-medium text-foreground border border-border/50'>
      {children}
    </code>
  )
}

// Renderizador Inteligente de Enlaces
const LinkRenderer: React.FC<{
  href: string
  children: React.ReactNode
  target: string
  onClick?: (event: React.MouseEvent) => void
  onDownload?: (url: string, filename: string) => void
}> = ({ href, children, target, onClick }) => {
  const isDownload = href.match(/\.(pdf|doc|docx|zip|rar|tar|gz)$/i)
  const isExternal = href.startsWith('http') || href.startsWith('https')
  const isInternal = href.startsWith('#')

  return (
    <a
      href={href}
      target={target}
      rel={isExternal ? 'noreferrer noopener' : undefined}
      onClick={onClick}
      className='inline-flex items-center gap-1 text-primary font-medium underline underline-offset-3 decoration-primary/40 hover:decoration-primary transition-colors'
    >
      {children}
      {isDownload && <Download className='h-3 w-3 inline' />}
      {isExternal && !isDownload && <ExternalLink className='h-3 w-3 inline' />}
      {isInternal && <span className='text-[10px]'>🔗</span>}
    </a>
  )
}

// Renderizador de Diagramas Mermaid Integrado
const MermaidDiagram: React.FC<{ content: string }> = ({ content }) => {
  const diagramId = useMemo(
    () => `mermaid-${Math.random().toString(36).substring(2, 9)}`,
    []
  )

  const renderMermaidDiagram = useCallback(
    (mermaidContent: string) => {
      const lines = mermaidContent
        .trim()
        .split('\n')
        .filter((line) => line.trim())

      if (lines[0]?.includes('graph')) {
        const direction = lines[0].includes('TD') ? 'vertical' : 'horizontal'
        const connections: Array<{ from: string; to: string; label?: string }> = []
        const nodeLabels: Record<string, string> = {}

        lines.slice(1).forEach((line) => {
          const trimmed = line.trim()
          const connectionMatch = trimmed.match(/(\w+)-->([\|\w]*)\|?(\w+)/)
          if (connectionMatch) {
            const [, from, label, to] = connectionMatch
            connections.push({
              from,
              to: to || label,
              label: label && label !== to ? label : undefined,
            })
          }

          const labelMatch = trimmed.match(/(\w+)\[([^\]]+)\]/)
          if (labelMatch) {
            nodeLabels[labelMatch[1]] = labelMatch[2]
          }
        })

        const allNodes = [
          ...new Set(connections.flatMap((conn) => [conn.from, conn.to])),
        ]

        return (
          <div className='mermaid-flowchart my-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 overflow-x-auto shadow-xs'>
            <svg
              width='100%'
              height='220'
              viewBox='0 0 700 220'
              className='overflow-visible'
            >
              <defs>
                <marker
                  id={`arrowhead-${diagramId}`}
                  markerWidth='10'
                  markerHeight='7'
                  refX='9'
                  refY='3.5'
                  orient='auto'
                >
                  <polygon points='0 0, 10 3.5, 0 7' fill='currentColor' className='text-primary' />
                </marker>
              </defs>

              {allNodes.map((node, index) => {
                const x = direction === 'horizontal' ? 80 + index * 140 : 120 + (index % 3) * 160
                const y = direction === 'horizontal' ? 110 : 60 + Math.floor(index / 3) * 80
                const label = nodeLabels[node] || node

                return (
                  <g key={node}>
                    <rect
                      x={x - 45}
                      y={y - 18}
                      width={90}
                      height={36}
                      rx='10'
                      className='fill-primary text-primary-foreground transition-colors'
                    />
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor='middle'
                      fill='currentColor'
                      className='text-primary-foreground font-semibold text-xs'
                    >
                      {label}
                    </text>
                  </g>
                )
              })}

              {connections.map((conn, index) => {
                const fromIndex = allNodes.indexOf(conn.from)
                const toIndex = allNodes.indexOf(conn.to)

                const fromX = direction === 'horizontal' ? 80 + fromIndex * 140 : 120 + (fromIndex % 3) * 160
                const fromY = direction === 'horizontal' ? 110 : 60 + Math.floor(fromIndex / 3) * 80
                const toX = direction === 'horizontal' ? 80 + toIndex * 140 : 120 + (toIndex % 3) * 160
                const toY = direction === 'horizontal' ? 110 : 60 + Math.floor(toIndex / 3) * 80

                const startX = fromX + (toX > fromX ? 45 : -45)
                const startY = fromY
                const endX = toX + (toX > fromX ? -45 : 45)
                const endY = toY

                return (
                  <g key={`${conn.from}-${conn.to}-${index}`}>
                    <path
                      d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 20} ${endX} ${endY}`}
                      stroke='currentColor'
                      strokeWidth='1.5'
                      fill='none'
                      markerEnd={`url(#arrowhead-${diagramId})`}
                      className='text-primary'
                    />
                    {conn.label && (
                      <text
                        x={(startX + endX) / 2}
                        y={startY - 25}
                        textAnchor='middle'
                        className='text-[10px] fill-muted-foreground font-medium'
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        )
      }

      return (
        <div className='mermaid-diagram my-3 rounded-xl border border-primary/20 bg-muted/40 p-4'>
          <pre className='whitespace-pre-line font-mono text-xs text-muted-foreground'>
            {mermaidContent}
          </pre>
        </div>
      )
    },
    [diagramId]
  )

  return renderMermaidDiagram(content)
}

// Componente Principal MarkdownRenderer (Shadcn UI + React Markdown)
export function MarkdownRenderer({
  content,
  className = '',
  config = {
    codeTheme: 'dark',
    mathTheme: 'colorful',
    linkTarget: '_blank',
    showLineNumbers: false,
  },
  onLinkClick,
  onDownloadClick,
  enableMath = true,
  enableEmoji = true,
  maxWidth = '100%',
}: MarkdownRendererProps) {
  const { codeTheme = 'dark', linkTarget = '_blank', showLineNumbers = false } = config

  const remarkPlugins = useMemo<PluggableList>(() => {
    const plugins: PluggableList = [remarkGfm]
    if (enableMath) plugins.push(remarkMath)
    if (enableEmoji) plugins.push([remarkEmoji, { padSpaceAfter: true }])
    return plugins
  }, [enableMath, enableEmoji])

  const rehypePlugins = useMemo<PluggableList>(() => {
    const plugins: PluggableList = [
      rehypeRaw,
      rehypeSlug,
      [rehypeHighlight, { ignoreMissing: true }],
    ]
    if (enableMath) plugins.push(rehypeKatex)
    return plugins
  }, [enableMath])

  const components = useMemo(
    () => ({
      code: (props: any) => (
        <CodeBlock
          {...props}
          theme={codeTheme}
          showLineNumbers={showLineNumbers}
        />
      ),
      a: (props: any) => {
        const { href = '', children } = props
        const isDownload = href.match(/\.(pdf|doc|docx|zip|rar|tar|gz)$/i)
        const isExternal = href.startsWith('http') || href.startsWith('https')
        const isInternal = href.startsWith('#')

        const handleClick = (event: React.MouseEvent) => {
          if (isDownload && onDownloadClick) {
            event.preventDefault()
            onDownloadClick(href, href.split('/').pop() || 'documento')
          } else if (isInternal) {
            event.preventDefault()
            const targetElement = document.querySelector(href)
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth' })
            }
            if (onLinkClick) {
              onLinkClick(href, event)
            }
          } else if (onLinkClick) {
            onLinkClick(href, event)
          }
        }

        return (
          <LinkRenderer
            href={href}
            target={isExternal ? '_blank' : isInternal ? '_self' : linkTarget}
            onClick={handleClick}
            onDownload={onDownloadClick}
          >
            {children}
          </LinkRenderer>
        )
      },
      p: (props: any) => <p {...props} className='mb-2.5 last:mb-0 leading-relaxed font-exo' />,
      h1: (props: any) => (
        <h1 {...props} className='font-frances text-xl font-bold text-foreground mt-4 mb-2 first:mt-0 tracking-tight' />
      ),
      h2: (props: any) => (
        <h2 {...props} className='font-frances text-lg font-semibold text-foreground mt-3.5 mb-1.5 first:mt-0' />
      ),
      h3: (props: any) => (
        <h3 {...props} className='font-frances text-base font-semibold text-foreground mt-3 mb-1 first:mt-0' />
      ),
      ul: (props: any) => <ul {...props} className='my-2 list-disc list-inside space-y-1 pl-1 font-exo' />,
      ol: (props: any) => <ol {...props} className='my-2 list-decimal list-inside space-y-1 pl-1 font-exo' />,
      li: (props: any) => <li {...props} className='leading-relaxed' />,
      table: (props: any) => (
        <div className='my-3 overflow-x-auto rounded-xl border border-border/80 shadow-xs'>
          <table {...props} className='min-w-full divide-y divide-border/60 text-xs font-exo' />
        </div>
      ),
      thead: (props: any) => <thead {...props} className='bg-muted/70' />,
      tbody: (props: any) => <tbody {...props} className='divide-y divide-border/40 bg-card/40' />,
      tr: (props: any) => <tr {...props} className='hover:bg-muted/30 transition-colors' />,
      th: (props: any) => (
        <th
          {...props}
          className='px-3.5 py-2 text-left font-bold text-foreground uppercase tracking-wider text-[11px]'
        />
      ),
      td: (props: any) => <td {...props} className='px-3.5 py-2 text-muted-foreground' />,
      blockquote: (props: any) => (
        <blockquote
          {...props}
          className='my-2.5 rounded-r-xl border-l-4 border-primary bg-primary/5 px-4 py-2 text-xs italic text-muted-foreground font-exo'
        />
      ),
      hr: (props: any) => <hr {...props} className='my-3 border-border/60' />,
    }),
    [codeTheme, showLineNumbers, linkTarget, onLinkClick, onDownloadClick]
  )

  return (
    <div style={{ maxWidth }} className={cn('markdown-body font-exo text-sm text-foreground select-text', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
