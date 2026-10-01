/*
 * Focused checks for the self-hosted promotion cleanup of Red Panda Vibes.
 * Verifies the cubicle computer screen scene still loads as an interactive
 * component while the donation/social promotion links are gone, and that an
 * empty link list can never break the screen layout.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8')

let failures = 0
function check(condition, message) {
  if (condition) {
    console.log(`\u2713 ${message}`)
  } else {
    failures++
    console.error(`\u2717 ${message}`)
  }
}

function fakeElement(tag) {
  return {
    tag,
    children: [],
    style: {},
    id: '',
    href: '',
    textContent: '',
    target: '',
    classList: {
      add() {},
      remove() {},
      contains() {
        return false
      },
    },
    appendChild(child) {
      this.children.push(child)
      return child
    },
    addEventListener() {},
  }
}

const cubicleSource = read('cubicle.js')
check(
  !/buymeacoffee|x\.com\/|instagram\.com|patreon|ko-fi/i.test(cubicleSource),
  'cubicle.js carries no donation or social promotion host'
)
check(
  cubicleSource.includes('https://github.com/collidingScopes'),
  'cubicle.js keeps the source/GitHub credit link'
)
check(
  cubicleSource.includes('if (!this.socialLinks || this.socialLinks.length === 0)'),
  'cubicle.js guards the computer screen link bar against an empty list'
)

const indexHtml = read('index.html')
check(
  indexHtml.includes('src="cubicle.js"'),
  'index.html still loads the cubicle scene script'
)
check(
  indexHtml.includes('src="game.js"'),
  'index.html still loads the core game script'
)

const mobileControls = read('mobile-controls.js')
check(
  mobileControls.includes('#social-links-container'),
  'mobile controls still let touches reach the computer screen link bar'
)

globalThis.window = globalThis
globalThis.document = {
  createElement: (tag) => fakeElement(tag),
  body: fakeElement('body'),
}

let importError = null
try {
  await import(pathToFileURL(path.join(root, 'cubicle.js')).href)
} catch (error) {
  importError = error
}
check(importError === null, `cubicle scene module imports in Node (${importError || 'ok'})`)
check(
  typeof globalThis.window.Cubicle === 'function',
  'Cubicle scene class is exposed for game.js'
)

if (typeof globalThis.window.Cubicle === 'function') {
  const Cubicle = globalThis.window.Cubicle
  const cubicle = new Cubicle(null, null, null)
  check(
    Array.isArray(cubicle.socialLinks) && cubicle.socialLinks.length === 1,
    `scene keeps exactly one credit link (count: ${cubicle.socialLinks.length})`
  )
  check(
    cubicle.socialLinks.every((link) => new URL(link.url).hostname === 'github.com'),
    'scene link list only contains the GitHub credit'
  )

  const screenContainer = fakeElement('div')
  cubicle.computerScreenContainer = screenContainer
  cubicle.createSocialMediaLinks()
  check(
    screenContainer.children.length === 1,
    'computer screen appends the link bar once'
  )
  const linkBar = screenContainer.children[0]
  check(
    linkBar.id === 'social-links-container' && linkBar.children.length === 1,
    'link bar keeps its id and renders the remaining credit link'
  )
  const anchors = linkBar.children
  check(
    anchors.every((anchor) => anchor.href.startsWith('https://github.com/') && anchor.target === '_blank'),
    'rendered links stay on GitHub and open in a new tab'
  )

  const emptyCubicle = new Cubicle(null, null, null)
  emptyCubicle.socialLinks = []
  const emptyContainer = fakeElement('div')
  emptyCubicle.computerScreenContainer = emptyContainer
  let emptyThrew = null
  try {
    emptyCubicle.createSocialMediaLinks()
  } catch (error) {
    emptyThrew = error
  }
  check(emptyThrew === null, `empty link list does not throw (${emptyThrew || 'ok'})`)
  check(
    emptyContainer.children.length === 0,
    'empty link list appends no empty bar that would break the layout'
  )
}

if (failures > 0) {
  console.error(`\n\u2717 ${failures} promotion cleanup check(s) failed`)
  process.exitCode = 1
} else {
  console.log('\n\u2713 All promotion cleanup checks passed')
}
