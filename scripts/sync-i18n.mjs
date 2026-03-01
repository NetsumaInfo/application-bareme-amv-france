import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const srcDir = path.join(rootDir, 'src')
const localesDir = path.join(srcDir, 'i18n', 'locales')
const targetFiles = ['.ts', '.tsx']
const localeTargets = {
  fr: 'fr',
  en: 'en',
  ja: 'ja',
  ru: 'ru',
  zh: 'zh-CN',
  es: 'es',
}

const TRANSLATION_PATTERN = /\bt\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(fullPath)
    if (!targetFiles.includes(path.extname(entry.name))) return []
    return [fullPath]
  }))
  return files.flat()
}

function unescapeKey(raw) {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, '\'')
    .replace(/\\"/g, '"')
    .replace(/\\`/g, '`')
}

async function loadJson(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

async function saveJson(filePath, data) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b, 'fr')))
  await fs.writeFile(filePath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
}

async function translateText(text, target) {
  if (!text.trim() || target === 'fr') return text

  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'fr')
  url.searchParams.set('tl', target)
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', text)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'amv-notation-i18n-sync/1.0',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = await response.json()
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((item) => Array.isArray(item) ? item[0] : '').join('')
    : ''
  return translated || text
}

async function mapLimit(items, limit, mapper) {
  const results = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await mapper(items[current], current)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

async function main() {
  const sourceFiles = await walk(srcDir)
  const extractedKeys = new Set()

  for (const filePath of sourceFiles) {
    const content = await fs.readFile(filePath, 'utf8')
    for (const match of content.matchAll(TRANSLATION_PATTERN)) {
      extractedKeys.add(unescapeKey(match[2]))
    }
  }

  const keys = Array.from(extractedKeys).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'))
  const localeData = {}

  for (const locale of Object.keys(localeTargets)) {
    localeData[locale] = await loadJson(path.join(localesDir, `${locale}.json`))
  }

  for (const key of keys) {
    localeData.fr[key] = key
  }

  for (const [locale, target] of Object.entries(localeTargets)) {
    if (locale === 'fr') continue
    const missingKeys = keys.filter((key) => !localeData[locale][key])

    await mapLimit(missingKeys, 4, async (key) => {
      try {
        localeData[locale][key] = await translateText(key, target)
      } catch {
        localeData[locale][key] = key
      }
    })
  }

  await Promise.all(
    Object.keys(localeTargets).map((locale) =>
      saveJson(path.join(localesDir, `${locale}.json`), localeData[locale])),
  )

  console.log(`i18n sync complete: ${keys.length} source strings`)
}

main().catch((error) => {
  console.error('i18n sync failed:', error)
  process.exitCode = 1
})
