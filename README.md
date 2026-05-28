# Daily Reflection Agent

毎日の振り返りを助けるAIエージェント。頭の中のアイデアや思考を、構造化された振り返りとして整理・外部化します。

An AI agent that helps you reflect on your day — externalizing ideas and thoughts into structured daily reflections.

---

## Two Ways to Use

### 1. Claude Code Agent (Recommended)

Inside Claude Code, simply say:

```
今日の振り返りをしたい
```

or

```
Use the daily-reflect agent
```

The agent conducts a short conversational interview (5 questions) and saves your reflection to `reflections/YYYY-MM-DD.md`.

### 2. Standalone CLI

```bash
# Set up (first time only)
uv venv
source .venv/bin/activate
uv pip install anthropic

# Set your API key
export ANTHROPIC_API_KEY="your-key-here"

# Run
python reflect.py              # today's reflection
python reflect.py --list       # show recent reflections
python reflect.py --view       # view today's reflection
python reflect.py --view 2026-05-20  # view specific date
```

---

## Reflection Format

Each reflection is saved to `reflections/YYYY-MM-DD.md`:

```markdown
# 振り返り — YYYY-MM-DD

## 今日の概要
[2-4 sentence summary]

## うまくいったこと / Wins
- [what went well]

## 難しかったこと / Challenges
- [what was hard]

## 学び・気づき / Learnings
- [what you learned]

## 明日へ / Tomorrow
- [what to carry forward]

---
記録日時: YYYY-MM-DD HH:MM
```

---

## Project Structure

```
.claude/agents/daily-reflect.md   # Claude Code agent
reflect.py                         # Standalone CLI
reflections/                       # Your daily reflections (gitignore this)
requirements.txt                   # Python deps
```

## API Key

Set `ANTHROPIC_API_KEY` in your environment or `.env` file.
The Claude Code agent uses the key from your Claude Code session automatically.
