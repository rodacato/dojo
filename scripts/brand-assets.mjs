import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function themeTokens(css, theme) {
  const block = css.match(new RegExp(`\\[data-theme='${theme}'\\] \\{([^}]+)`))?.[1]
  if (!block) throw new Error(`Missing ${theme} theme`)
  const tokens = Object.fromEntries(
    [...block.matchAll(/(--color-[\w-]+):\s*(#[\da-fA-F]{6})/g)].map((match) => [
      match[1],
      match[2],
    ]),
  )
  for (const role of ['page', 'surface', 'primary', 'secondary', 'accent', 'border']) {
    if (!tokens[`--color-${role}`]) throw new Error(`Missing ${theme} ${role} token`)
  }
  return tokens
}

const svg = (content, viewBox = '0 0 100 100') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${content}</svg>\n`

function icoFromPngs(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = header.length
  pngs.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index
    header.writeUInt8(size, entry)
    header.writeUInt8(size, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(data.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...pngs.map(({ data }) => data)])
}

export async function buildAssets(root = repo) {
  const css = await readFile(path.join(root, 'apps/web/src/styles/main.css'), 'utf8')
  const logo = JSON.parse(await readFile(path.join(root, 'apps/web/src/brand/logo.json'), 'utf8'))
  const wordmark = await readFile(path.join(root, 'design/brand/wordmark.svg'), 'utf8')
  const social = await readFile(path.join(root, 'design/brand/social-template.svg'), 'utf8')
  const { Resvg } = createRequire(path.join(root, 'apps/api/package.json'))('@resvg/resvg-js')
  const mark = `<path d="${logo.path}" fill="none" stroke="currentColor" stroke-width="${logo.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
  const words = wordmark.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const themes = Object.fromEntries(['washi', 'sumi'].map((name) => [name, themeTokens(css, name)]))
  const declarations = (tokens) =>
    Object.entries(tokens)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')
  const assets = new Map([
    [
      'site/brand/tokens.css',
      `:root,\n[data-theme='washi'] {\n${declarations(themes.washi)}\n}\n[data-theme='sumi'] {\n${declarations(themes.sumi)}\n}\n`,
    ],
    ['site/brand/mark.svg', svg(`<g id="open-gate">${mark}</g>`, logo.viewBox)],
  ])
  const lockup = (primary, accent) =>
    `<g color="${accent}">${mark}</g><g transform="translate(110 16) scale(.6)" fill="${primary}">${words.replace('data-role="cursor"', `data-role="cursor" fill="${accent}"`)}</g>`
  assets.set('site/brand/logo-mono.svg', svg(lockup('currentColor', 'currentColor'), '0 0 300 100'))
  for (const [theme, tokens] of Object.entries(themes)) {
    const color = (role) => tokens[`--color-${role}`]
    const body = lockup(color('primary'), color('accent'))
    assets.set(`site/brand/logo-${theme}.svg`, svg(body, '0 0 300 100'))
    const icon = svg(
      `<rect width="100" height="100" rx="8" fill="${color('page')}"/><g color="${color('accent')}">${mark}</g>`,
    )
    assets.set(`site/brand/icon-${theme}.svg`, icon)
    const card = social.replace(/\{\{([\w]+)\}\}/g, (_, role) => {
      if (role === 'mark') return mark
      if (role === 'lockup') return body
      const value = color(role)
      if (!value) throw new Error(`Unknown social template role: ${role}`)
      return value
    })
    assets.set(`site/brand/social-${theme}.svg`, card)
    assets.set(
      `site/brand/social-${theme}.png`,
      new Resvg(card, { font: { loadSystemFonts: false } }).render().asPng(),
    )
  }
  const png = (source, size) =>
    new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng()
  const sumi = themes.sumi
  const square = (inset, rounded) =>
    svg(
      `<rect width="100" height="100"${rounded ? ' rx="8"' : ''} fill="${sumi['--color-page']}"/><g color="${sumi['--color-accent']}" transform="translate(50 50) scale(${inset}) translate(-50 -50)">${mark}</g>`,
    )
  const opaque = square(1, false)
  const touch = png(opaque, 180)
  const favicons = [16, 32, 48].map((size) => ({
    size,
    data: png(assets.get('site/brand/icon-sumi.svg'), size),
  }))
  const ico = icoFromPngs(favicons)
  assets.set('apps/web/public/og-image.png', assets.get('site/brand/social-sumi.png'))
  assets.set('apps/web/public/apple-touch-icon.png', touch)
  assets.set('apps/web/public/icon-192.png', png(assets.get('site/brand/icon-sumi.svg'), 192))
  assets.set('apps/web/public/icon-512.png', png(assets.get('site/brand/icon-sumi.svg'), 512))
  assets.set('apps/web/public/icon-maskable-512.png', png(square(0.8, false), 512))
  assets.set('apps/web/public/favicon.ico', ico)
  assets.set(
    'apps/web/public/manifest.webmanifest',
    `${JSON.stringify(
      {
        name: 'dojo_',
        short_name: 'dojo_',
        start_url: '/',
        display: 'browser',
        theme_color: sumi['--color-page'],
        background_color: sumi['--color-page'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      null,
      2,
    )}\n`,
  )
  assets.set('site/favicon.ico', ico)
  assets.set('site/apple-touch-icon.png', touch)
  assets.set('site/favicon.svg', assets.get('site/brand/icon-washi.svg'))
  assets.set('apps/web/public/favicon.svg', assets.get('site/brand/icon-washi.svg'))
  return assets
}

export async function staleAssets(assets, root = repo) {
  const stale = []
  for (const [file, expected] of assets) {
    try {
      const actual = await readFile(path.join(root, file))
      if (!actual.equals(Buffer.from(expected))) stale.push(file)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      stale.push(file)
    }
  }
  return stale
}

export async function validateSite(root = repo) {
  const problems = []
  for (const file of ['index.html', 'brand.html']) {
    const html = await readFile(path.join(root, 'site', file), 'utf8')
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const value = match[1]
      if (/^(https?:|mailto:|data:)/.test(value)) continue
      if (value.startsWith('/')) {
        problems.push(`${file}: absolute project-path URL ${value}`)
        continue
      }
      const [resource, anchor] = value.split('#')
      try {
        const body = await readFile(path.join(root, 'site', resource || file))
        if (anchor && !body.toString().includes(`id="${anchor}"`))
          problems.push(`${file}: missing anchor ${value}`)
      } catch {
        problems.push(`${file}: missing resource ${value}`)
      }
    }
  }
  return problems
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const assets = await buildAssets()
  if (process.argv.includes('--check')) {
    const problems = [...(await staleAssets(assets)), ...(await validateSite())]
    if (problems.length) {
      console.error(`Brand verification failed:\n${problems.join('\n')}`)
      process.exitCode = 1
    } else console.log('Brand assets are up to date')
  } else {
    for (const [file, content] of assets) {
      await mkdir(path.dirname(path.join(repo, file)), { recursive: true })
      await writeFile(path.join(repo, file), content)
    }
    console.log(`Generated ${assets.size} brand assets`)
  }
}
