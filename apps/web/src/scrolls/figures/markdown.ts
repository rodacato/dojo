export function markdownToInnerHtml(text: string): string {
  return text
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-bg/50 rounded p-3 my-3 overflow-x-auto"><code class="text-xs font-mono text-secondary">$2</code></pre>',
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-bg/50 px-1.5 py-0.5 rounded text-accent text-xs font-mono">$1</code>',
    )
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-mono text-primary mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-mono text-primary mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-mono text-primary mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-muted ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-sm text-muted mb-3">')
}
