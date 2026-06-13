# 🧬 OpenEvo CLI V1.0.0 — The Sovereign Exoskeleton

OpenEvo is an open-source, multi-provider AI Engine for building sovereign AI companions. Version 1.0.0 introduces the **7-Phase Sovereign Pipeline**, giving your AI long-term memory, dynamic skills, custom knowledge, and smart token budgeting.

## 🚀 Quick Start

```bash
# Create a new AI companion
npx create-openevo my-bot

cd my-bot
npm install
npm run dev
```

## ✨ What's New in V1.0.0

The engine has been entirely rewritten from V0 (4-Phase) to **V1 (7-Phase)**, adding immense capabilities while retaining zero-dependency simplicity.

### 1. 🎭 7-Layer Persona Engine (`persona/`)
Configure your model and define your AI's multi-dimensional personality using the following structure:
```text
├── persona/
│   ├── agent.md         # AI Core Config & Engine Boundaries (Provider/LLM Settings & Engine Scope)
│   ├── soul.md          # Layer 1: Core essence & inner identity
│   ├── role.md          # Layer 2: Professional role & external capabilities
│   ├── character.md     # Layer 3: Personality quirks, likes & dislikes
│   ├── user.md          # Layer 4: User context & shared relationship history
│   ├── rule.md          # Layer 5: Hard constraints & behavioral rules
│   └── pulse.md         # Layer 6: Dynamic state & situational awareness
├── memory/              # Persistent conversation memory (auto-generated)
├── src/
│   └── index.ts         # Entry point
├── config.yaml          # LLM provider & model config
└── .env                 # API keys (never commit this!)
```

### 2. 🧠 Multi-Provider AI Routing
Seamlessly switch between cloud and edge models without changing your codebase. Supported providers:
- `openrouter` (Meta, Mistral, Command, etc.)
- `openai` (GPT-4o, GPT-4o-mini)
- `anthropic` (Claude 3.5 Sonnet, Haiku)
- `gemini` (Gemini 1.5 Pro, Flash)
- `ollama` (Local Llama 3, Qwen, etc.)
- `local` (Edge device fallback)

### 3. 📚 RAG Knowledge Base (`loader_info/`)
Inject external context instantly.
- **Documents:** Place `.md`, `.txt`, `.json` inside `loader_info/docs/` and they are automatically parsed and injected into the AI's context.
- **Assets:** Place `.jpg`, `.png`, `.webp` inside `loader_info/assets/` to build vision-aware companions.

### 4. 🤹 Dynamic Skill Router (`skills/`)
Extend your bot's capabilities dynamically.
- Create folders inside `skills/` with a `SKILL.md` file.
- The Skill Router uses intelligent keyword matching to inject specific instructions *only* when the user triggers them, saving tokens.

### 5. 💸 Smart Budget Calculator
Save API costs, especially for non-Latin languages (like Thai) where tokens burn fast.
- Set a `budget_limit` in your `agent.md`.
- The engine estimates token usage and automatically routes to a cheaper model (or falls back to 100% free Local Edge AI) if the request exceeds your budget.

### 6. 💾 Vector-based Memory (`memory/`)
Conversations are still persistent. The RAG engine recalls relevant past interactions to maintain long-term relationship continuity.

## 📦 Exported Modules

You can now import individual core systems directly into your own Node projects:
```javascript
import { ExoskeletonEngine } from 'openevo/engine';
import { MemoryEngine } from 'openevo/memory';
import { SkillRouter } from 'openevo/skills';
import { KnowledgeLoader } from 'openevo/knowledge';
import { BudgetCalculator } from 'openevo/budget';
```

## 📜 License
MIT License
