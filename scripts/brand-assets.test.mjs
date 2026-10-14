import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAssets, staleAssets, themeTokens, validateSite } from './brand-assets.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('brand assets', () => {
  it('generates identical exports without system fonts, including correctly sized social PNGs', async () => {
    const first = await buildAssets(repo)
    const second = await buildAssets(repo)
    expect(await staleAssets(first, repo)).toEqual([])
    for (const [file, bytes] of first)
      expect(Buffer.from(second.get(file))).toEqual(Buffer.from(bytes))
    for (const theme of ['washi', 'sumi']) {
      const png = first.get(`site/brand/social-${theme}.png`)
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
      const social = first.get(`site/brand/social-${theme}.svg`)
      expect(social).not.toMatch(/<text|<image|\{\{/)
    }
  })

  it('reports missing and edited exports instead of accepting a broken baseline', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'dojo-brand-'))
    try {
      const assets = new Map([
        ['site/brand/mark.svg', '<svg/>'],
        ['site/brand/tokens.css', ':root{}'],
      ])
      expect(await staleAssets(assets, root)).toEqual([...assets.keys()])
      await mkdir(path.join(root, 'site/brand'), { recursive: true })
      for (const [file, bytes] of assets) await writeFile(path.join(root, file), bytes)
      expect(await staleAssets(assets, root)).toEqual([])
      await writeFile(path.join(root, 'site/brand/mark.svg'), '<svg>wrong mark</svg>')
      expect(await staleAssets(assets, root)).toEqual(['site/brand/mark.svg'])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('rejects missing theme definitions and required roles', () => {
    expect(() => themeTokens('', 'sumi')).toThrow('Missing sumi theme')
    expect(() => themeTokens("[data-theme='sumi'] { --color-page: #000000; }", 'sumi')).toThrow(
      'Missing sumi surface token',
    )
  })

  it('keeps published pages and downloads compatible with a project base path', async () => {
    expect(await validateSite(repo)).toEqual([])
    const root = await mkdtemp(path.join(os.tmpdir(), 'dojo-links-'))
    try {
      await mkdir(path.join(root, 'site'))
      await writeFile(
        path.join(root, 'site/index.html'),
        '<a href="/brand.html">Brand</a><a href="#absent">Missing</a>',
      )
      await writeFile(path.join(root, 'site/brand.html'), '<a href="missing.svg">Download</a>')
      expect(await validateSite(root)).toHaveLength(3)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('keeps the generated palette tied to app tokens', async () => {
    const css = await readFile(path.join(repo, 'apps/web/src/styles/main.css'), 'utf8')
    const assets = await buildAssets(repo)
    for (const theme of ['washi', 'sumi']) {
      for (const [role, value] of Object.entries(themeTokens(css, theme)))
        expect(assets.get('site/brand/tokens.css')).toContain(`${role}: ${value};`)
    }
  })
})
