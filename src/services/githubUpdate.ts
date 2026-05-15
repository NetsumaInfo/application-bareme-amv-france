import { getVersion } from '@tauri-apps/api/app'
import { GITHUB_LATEST_RELEASE_API_URL, GITHUB_RELEASES_URL } from '@/constants/projectLinks'

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/i

interface GithubLatestReleaseResponse {
  tag_name?: unknown
  html_url?: unknown
  name?: unknown
  published_at?: unknown
}

export interface GithubReleaseUpdateCheckResult {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  releaseUrl: string
  releaseName: string | null
  publishedAt: string | null
}

function normalizeVersion(raw: string): string {
  return raw.trim().replace(/^v/i, '')
}

function parseVersion(raw: string): [number, number, number] | null {
  const match = VERSION_PATTERN.exec(raw.trim())
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function compareVersions(a: string, b: string): number {
  const aParsed = parseVersion(a)
  const bParsed = parseVersion(b)
  if (!aParsed || !bParsed) return normalizeVersion(a).localeCompare(normalizeVersion(b))

  for (let index = 0; index < aParsed.length; index += 1) {
    const diff = aParsed[index] - bParsed[index]
    if (diff !== 0) return diff
  }

  return 0
}

async function fetchLatestRelease(): Promise<GithubLatestReleaseResponse> {
  const response = await fetch(GITHUB_LATEST_RELEASE_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`GitHub latest release request failed (${response.status})`)
  }

  return response.json() as Promise<GithubLatestReleaseResponse>
}

export async function checkGithubReleaseUpdate(): Promise<GithubReleaseUpdateCheckResult> {
  const [currentVersion, latestRelease] = await Promise.all([
    getVersion(),
    fetchLatestRelease(),
  ])

  const latestVersionRaw = typeof latestRelease.tag_name === 'string' && latestRelease.tag_name.trim()
    ? latestRelease.tag_name.trim()
    : ''
  if (!latestVersionRaw) {
    throw new Error('GitHub latest release missing tag_name')
  }

  const latestVersion = normalizeVersion(latestVersionRaw)
  const normalizedCurrentVersion = normalizeVersion(currentVersion)

  return {
    currentVersion: normalizedCurrentVersion,
    latestVersion,
    hasUpdate: compareVersions(latestVersion, normalizedCurrentVersion) > 0,
    releaseUrl: typeof latestRelease.html_url === 'string' && latestRelease.html_url.trim()
      ? latestRelease.html_url
      : GITHUB_RELEASES_URL,
    releaseName: typeof latestRelease.name === 'string' && latestRelease.name.trim()
      ? latestRelease.name.trim()
      : null,
    publishedAt: typeof latestRelease.published_at === 'string' && latestRelease.published_at.trim()
      ? latestRelease.published_at
      : null,
  }
}
