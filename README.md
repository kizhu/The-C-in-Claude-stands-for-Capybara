# Buddy Reroll — Claude Code 宠物改命工具

Claude Code 的 `/buddy` 功能会根据你的账号 ID 确定性地分配一只宠物。物种、稀有度、是否闪光，全部由 `hash(你的ID + SALT)` 一锤定音。

**这个工具让你改命。**

## 原理

```
hash(userId + SALT) → Mulberry32 PRNG → 依次掷骰: 稀有度 → 物种 → 眼睛 → 帽子 → 闪光 → 属性
```

- **SALT**: `friend-2026-401`（硬编码在二进制里，15 个字符）
- **哈希**: 原生安装用 `Bun.hash()`，npm 安装用 FNV-1a
- **ID 优先级**: `oauthAccount.accountUuid` > `userID` > `"anon"`

### 宠物池

| 类别 | 内容 |
|------|------|
| 18 种物种 | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk |
| 5 级稀有度 | common(60%), uncommon(25%), rare(10%), epic(4%), legendary(1%) |
| 闪光 | 1% 概率 |
| 6 种眼睛 | · ✦ × ◉ @ ° |
| 8 种帽子 | none, crown, tophat, propeller, halo, wizard, beanie, tinyduck |

## 两种改命方法

### 方法一: 换 userID（API/非 OAuth 用户）

如果你没有绑 OAuth（比如用 API key），Claude 用 `userID` 来算宠物。换一个能算出你想要宠物的 ID 就行。

```bash
# 用 bun（与原生 Claude 一致的哈希）
bun buddy-reroll.js --species capybara --shiny

# 用 node（与 npm 安装的 Claude 一致的哈希）
node buddy-reroll.js --species capybara --shiny
```

找到后:
1. 打开 `~/.claude.json`
2. 删除 `"userID"` 和 `"companion"` 字段
3. 写入新的 `"userID": "找到的ID"`
4. 重启 Claude Code

### 方法二: 改 SALT（OAuth/Max 用户）← 核心创新

OAuth 用户的 `accountUuid` 从服务器获取，你改不了。但你可以改 SALT。

**原理**: 把二进制里的 `friend-2026-401` 换成一个新的 15 字符字符串，使 `hash(你的uuid + 新SALT)` 算出你想要的宠物。

```bash
# 第一步: 找到合适的 SALT（必须用 bun）
bun find-salt.js --uuid "你的accountUuid" --species capybara --shiny

# 第二步: 一键 patch
./patch.sh --salt "找到的SALT"

# 或者一步到位（自动搜索 + patch）
./patch.sh --uuid "你的accountUuid" --species capybara --shiny
```

## 快速开始

```bash
git clone https://github.com/user/buddy-reroll.git
cd buddy-reroll
chmod +x patch.sh

# 查看当前宠物
bun buddy-reroll.js --check "你的userID"

# 找一只传说级闪光龙
bun buddy-reroll.js --species dragon --rarity legendary --shiny

# OAuth 用户一键改命
./patch.sh --uuid "你的uuid" --species dragon --rarity legendary
```

## 详细用法

### buddy-reroll.js — 搜索工具

```
选项:
  --check <uid>       查看某个 userID 对应的宠物
  --species <name>    目标物种
  --rarity <name>     最低稀有度 (common/uncommon/rare/epic/legendary)
  --shiny             要求闪光
  --eye <char>        目标眼睛 (· ✦ × ◉ @ °)
  --hat <name>        目标帽子 (none/crown/tophat/propeller/halo/wizard/beanie/tinyduck)
  --min-stats <n>     要求所有属性 >= n
  --count <n>         结果数量 (默认 3)
  --max <n>           最大搜索次数 (默认 5000万)
```

### find-salt.js — SALT 搜索（OAuth 用户专用）

```
必须参数:
  --uuid <id>         你的 oauthAccount.accountUuid

选项同上，但搜索的是 SALT 而非 userID
⚠️ 必须用 bun 运行
```

### patch.sh — 一键修改二进制

```
用法:
  ./patch.sh --salt <15字符SALT>
  ./patch.sh --uuid <accountUuid> --species capybara [--shiny]
```

patch.sh 会自动:
- 找到 Claude 二进制
- 备份原文件
- 替换 SALT
- 重新签名（macOS 要求）
- 清理 companion 缓存

## 常见问题

**Q: 会不会搞坏我的 Claude?**
A: 不会。改的只是一个 15 字符的字符串，而且会自动备份。最坏情况恢复备份就行。

**Q: 自动更新后宠物会重置吗?**
A: 会。Claude 更新会替换二进制，SALT 恢复原始值。重新跑一次 patch.sh 就行。

**Q: 怎么找到我的 accountUuid?**
A: 在 Claude Code 中可以通过认证信息查看，或者检查 `~/.claude.json` 中的相关字段。

**Q: bun 和 node 跑出来的结果不一样?**
A: 对，因为哈希函数不同。原生安装的 Claude 用 Bun.hash，npm 安装用 FNV-1a。用哪个取决于你的 Claude 安装方式。

**Q: 闪光太难找了怎么办?**
A: 闪光概率 1%，再加上其他条件筛选，确实需要搜很多次。建议先不加 --shiny 找到基础满意的，再单独搜闪光。或者把 --max 调大。

**Q: 方法一和方法二怎么选?**
A: 看你的 Claude 登录方式。`/buddy` 显示的信息里如果有 OAuth 相关字段，说明你是 OAuth 用户，用方法二。API key 用户用方法一。

## 致谢

感谢 linux.do 社区的逆向研究和分享。

## License

MIT
