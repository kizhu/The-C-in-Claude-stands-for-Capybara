#!/usr/bin/env node
// buddy-reroll.js — Claude Code 宠物改命工具
// 用法: bun buddy-reroll.js --species capybara --shiny --count 5
//       node buddy-reroll.js --check <userID>
//
// 兼容 Bun 和 Node.js：
//   - Bun 环境使用 Bun.hash()（与原生安装的 Claude 一致）
//   - Node.js 环境使用 FNV-1a（与 npm 安装的 Claude 一致）

const SALT = 'friend-2026-401'

const SPECIES = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl', 'penguin',
  'turtle', 'snail', 'ghost', 'axolotl', 'capybara', 'cactus', 'robot',
  'rabbit', 'mushroom', 'chonk'
]

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 }
const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }

const EYES = ['·', '✦', '×', '◉', '@', '°']
const HATS = ['none', 'crown', 'tophat', 'propeller', 'halo', 'wizard', 'beanie', 'tinyduck']

const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK']
const RARITY_FLOOR = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 }

// ─── 运行环境检测 ─────────────────────────────────────────────
const IS_BUN = typeof Bun !== 'undefined'

// ─── 哈希函数 ─────────────────────────────────────────────────
function hashFNV1a(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function hashBun(s) {
  return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
}

const hash = IS_BUN ? hashBun : hashFNV1a

// ─── Mulberry32 PRNG ──────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function rollRarity(rng) {
  let roll = rng() * 100
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHTS[r]
    if (roll < 0) return r
  }
  return 'common'
}

function rollStats(rng, rarity) {
  const floor = RARITY_FLOOR[rarity]
  const peak = pick(rng, STAT_NAMES)
  let dump = pick(rng, STAT_NAMES)
  while (dump === peak) dump = pick(rng, STAT_NAMES)
  const stats = {}
  for (const name of STAT_NAMES) {
    if (name === peak) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
    else if (name === dump) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
    else stats[name] = floor + Math.floor(rng() * 40)
  }
  return stats
}

// ─── 核心：从 ID 算出完整 buddy ──────────────────────────────
function rollBuddy(uid, salt = SALT) {
  const seed = hash(uid + salt)
  const rng = mulberry32(seed)
  const rarity = rollRarity(rng)
  const species = pick(rng, SPECIES)
  const eye = pick(rng, EYES)
  const hat = pick(rng, HATS)
  const shiny = rng() < 0.01
  const stats = rollStats(rng, rarity)
  return { species, rarity, eye, hat, shiny, stats }
}

// ─── 格式化输出 ───────────────────────────────────────────────
function formatBuddy(buddy, uid) {
  const shinyTag = buddy.shiny ? ' ✨闪光✨' : ''
  const rarityColors = {
    common: '\x1b[37m',      // 白
    uncommon: '\x1b[32m',    // 绿
    rare: '\x1b[34m',        // 蓝
    epic: '\x1b[35m',        // 紫
    legendary: '\x1b[33m',   // 金
  }
  const reset = '\x1b[0m'
  const color = rarityColors[buddy.rarity] || ''

  let out = ''
  out += `  ${color}【${buddy.rarity.toUpperCase()}】${reset}${shinyTag} ${buddy.species}\n`
  out += `  眼睛: ${buddy.eye}  帽子: ${buddy.hat}\n`
  out += `  属性: ${STAT_NAMES.map(n => `${n}=${buddy.stats[n]}`).join(' ')}\n`
  if (uid) out += `  userID: ${uid}\n`
  return out
}

// ─── 匹配判断 ─────────────────────────────────────────────────
function matchesCriteria(buddy, criteria) {
  if (criteria.species && buddy.species !== criteria.species) return false
  if (criteria.rarity && RARITY_ORDER[buddy.rarity] < RARITY_ORDER[criteria.rarity]) return false
  if (criteria.shiny && !buddy.shiny) return false
  if (criteria.eye && buddy.eye !== criteria.eye) return false
  if (criteria.hat && buddy.hat !== criteria.hat) return false
  if (criteria.minStats) {
    for (const name of STAT_NAMES) {
      if (buddy.stats[name] < criteria.minStats) return false
    }
  }
  return true
}

// ─── 随机 userID 生成 ─────────────────────────────────────────
function randomUID() {
  // 生成类 UUID 格式的随机 ID
  const chars = '0123456789abcdef'
  const sections = [8, 4, 4, 4, 12]
  return sections.map(len => {
    let s = ''
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return s
  }).join('-')
}

// ─── 参数解析 ─────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2)
  const opts = {
    check: null,
    species: null,
    rarity: null,
    shiny: false,
    eye: null,
    hat: null,
    minStats: null,
    count: 3,
    max: 50_000_000,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--check': opts.check = args[++i]; break
      case '--species': opts.species = args[++i]; break
      case '--rarity': opts.rarity = args[++i]; break
      case '--shiny': opts.shiny = true; break
      case '--eye': opts.eye = args[++i]; break
      case '--hat': opts.hat = args[++i]; break
      case '--min-stats': opts.minStats = parseInt(args[++i] || '30'); break
      case '--count': opts.count = parseInt(args[++i]); break
      case '--max': opts.max = parseInt(args[++i]); break
      case '--help': case '-h': printHelp(); process.exit(0);
      default:
        console.error(`\x1b[31m未知参数: ${args[i]}\x1b[0m`)
        printHelp()
        process.exit(1)
    }
  }
  return opts
}

function printHelp() {
  console.log(`
\x1b[33m🐾 Buddy Reroll — Claude Code 宠物改命工具\x1b[0m

运行环境: ${IS_BUN ? 'Bun (使用 Bun.hash)' : 'Node.js (使用 FNV-1a)'}

用法:
  ${IS_BUN ? 'bun' : 'node'} buddy-reroll.js [选项]

选项:
  --check <uid>       查看某个 userID 对应的宠物
  --species <name>    目标物种 (${SPECIES.join(', ')})
  --rarity <name>     最低稀有度 (${RARITIES.join(', ')})
  --shiny             要求闪光
  --eye <char>        目标眼睛 (${EYES.join(' ')})
  --hat <name>        目标帽子 (${HATS.join(', ')})
  --min-stats <n>     要求所有属性 >= n
  --count <n>         结果数量 (默认 3)
  --max <n>           最大搜索次数 (默认 5000万)
  -h, --help          显示帮助

示例:
  # 查看当前 ID 的宠物
  ${IS_BUN ? 'bun' : 'node'} buddy-reroll.js --check "your-user-id"

  # 找一只闪光水豚
  ${IS_BUN ? 'bun' : 'node'} buddy-reroll.js --species capybara --shiny

  # 找传说级龙，戴皇冠
  ${IS_BUN ? 'bun' : 'node'} buddy-reroll.js --species dragon --rarity legendary --hat crown
`)
}

// ─── 主逻辑 ───────────────────────────────────────────────────
function main() {
  const opts = parseArgs(process.argv)

  // 验证参数
  if (opts.species && !SPECIES.includes(opts.species)) {
    console.error(`\x1b[31m错误: 不存在的物种 "${opts.species}"\x1b[0m`)
    console.error(`可选物种: ${SPECIES.join(', ')}`)
    process.exit(1)
  }
  if (opts.rarity && !RARITIES.includes(opts.rarity)) {
    console.error(`\x1b[31m错误: 不存在的稀有度 "${opts.rarity}"\x1b[0m`)
    console.error(`可选稀有度: ${RARITIES.join(', ')}`)
    process.exit(1)
  }
  if (opts.hat && !HATS.includes(opts.hat)) {
    console.error(`\x1b[31m错误: 不存在的帽子 "${opts.hat}"\x1b[0m`)
    console.error(`可选帽子: ${HATS.join(', ')}`)
    process.exit(1)
  }

  // --check 模式
  if (opts.check) {
    console.log(`\n\x1b[36m🔍 查询 userID: ${opts.check}\x1b[0m`)
    console.log(`   哈希方式: ${IS_BUN ? 'Bun.hash' : 'FNV-1a'}\n`)
    const buddy = rollBuddy(opts.check)
    console.log(formatBuddy(buddy))
    return
  }

  // 搜索模式
  const hasCriteria = opts.species || opts.rarity || opts.shiny || opts.eye || opts.hat || opts.minStats
  if (!hasCriteria) {
    printHelp()
    return
  }

  const criteria = {
    species: opts.species,
    rarity: opts.rarity,
    shiny: opts.shiny,
    eye: opts.eye,
    hat: opts.hat,
    minStats: opts.minStats,
  }

  console.log(`\n\x1b[33m🎲 开始改命...\x1b[0m`)
  console.log(`   哈希方式: ${IS_BUN ? 'Bun.hash' : 'FNV-1a'}`)
  console.log(`   目标: ${[
    opts.species && `物种=${opts.species}`,
    opts.rarity && `稀有度>=${opts.rarity}`,
    opts.shiny && '✨闪光',
    opts.eye && `眼睛=${opts.eye}`,
    opts.hat && `帽子=${opts.hat}`,
    opts.minStats && `全属性>=${opts.minStats}`,
  ].filter(Boolean).join(', ')}`)
  console.log(`   搜索上限: ${(opts.max / 1_000_000).toFixed(0)}M 次\n`)

  const results = []
  const startTime = Date.now()
  let checked = 0

  for (let i = 0; i < opts.max && results.length < opts.count; i++) {
    const uid = randomUID()
    const buddy = rollBuddy(uid)
    checked++

    if (matchesCriteria(buddy, criteria)) {
      results.push({ uid, buddy })
      console.log(`\x1b[32m✅ 找到第 ${results.length} 个! (已搜索 ${checked.toLocaleString()} 次)\x1b[0m`)
      console.log(formatBuddy(buddy, uid))
    }

    // 每 100 万次报告进度
    if (checked % 1_000_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const rate = (checked / (Date.now() - startTime) * 1000).toFixed(0)
      console.log(`   ... 已搜索 ${(checked / 1_000_000).toFixed(0)}M 次, ${elapsed}s, ${rate}/s`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  if (results.length === 0) {
    console.log(`\x1b[31m😢 搜索了 ${checked.toLocaleString()} 次，没找到符合条件的。\x1b[0m`)
    console.log(`   建议: 降低条件再试，或增大 --max`)
  } else {
    console.log(`\x1b[33m─── 搜索完成 ───\x1b[0m`)
    console.log(`   共搜索 ${checked.toLocaleString()} 次，耗时 ${elapsed}s`)
    console.log(`   找到 ${results.length} 个结果\n`)

    console.log(`\x1b[36m📋 使用方法:\x1b[0m`)
    console.log(`   1. 打开 ~/.claude.json`)
    console.log(`   2. 删除 "userID" 和 "companion" 字段`)
    console.log(`   3. 添加 "userID": "${results[0].uid}"`)
    console.log(`   4. 重启 Claude Code\n`)
  }
}

main()
