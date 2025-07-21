# 🧠 Model Card – `deepseek-r1:32b`  
_Used with Ollama + NeuroAdapt SDK Integration_

## 📌 Model ID
```
ollama run deepseek-r1:32b
```

---

## 🧾 Overview

**`deepseek-r1:32b`** is a 32B-parameter general-purpose LLM optimized for reasoning, structured output, and code generation. Within the NeuroAdapt SDK, this model is used to power **assistive AI agents** capable of:

- Predictable, low-anxiety interactions
- Explanation scaffolding (simple → complex)
- Controlled tone and pacing
- Multi-modal prompts and simplifications for neurodivergent accessibility

---

## ⚙️ Configuration

| Field | Value |
|-------|-------|
| Parameters | 32 Billion |
| Base | DeepSeek R1 (Pretrained) |
| Format | GGUF / Ollama |
| Quantization | Q4_K_M (optional) |
| Context Length | 128k |
| Optimized For | LLM Agent Reasoning, Structured Prompts, Cognitive Clarity |
| Deployment | Ollama CLI or API via `ollama run deepseek-r1:32b` |

---

## 🧠 Use with NeuroAdapt SDK

This model can be wrapped using the SDK’s `PredictableAI` interface:

```ts
import { PredictableAI } from '@neuroadapt/ai'

const ai = new PredictableAI({
  tone: 'calm-supportive',
  explanationDefault: 'simple',
  consistencyLevel: 'high',
})

const response = await ai.respond("Explain how quantum teleportation works");
console.log(response);  // AI adapts tone and structure for neurodiverse accessibility
```

---

## 📜 Default System Prompt (NeuroAdapt + DeepSeek R1:32B)

```
You are NeuroAdapt, an AI assistant optimized for accessibility, clarity, and inclusive communication.

Your responses must:
- Be calm, supportive, and emotionally neutral
- Use short, simple sentences when possible
- Offer options for more detail if needed (e.g., “Would you like a deeper explanation?”)
- Respect cognitive pacing: do not overload the user
- Use plain language and visual metaphors when describing complex concepts
- Always explain terminology before using it
- Allow the user to undo or revisit prior steps
- Avoid overly formal, technical, or abstract phrasing unless requested

Context: You are helping neurodivergent users understand, learn, and use technology (AI, VR, Quantum). Many users may have ADHD, autism, dyslexia, sensory sensitivity, or non-traditional learning preferences. Make every interaction predictable and user-first.

Always answer as a caring peer, not an expert. Use bullet points or line breaks if it helps reduce cognitive load.

If the user seems overloaded, offer to slow down or summarize instead.
```

---

## 🛠 SDK Integration Tags

- `@neuroadapt/ai/llm-adapter`
- `@neuroadapt/memory`
- `@neuroadapt/attention`
- Supports: `explanationLevel`, `toneProfile`, `undoBuffer`, `pacingMode`

---

## 📈 Example Use Cases

- ✨ AI Copilot for ADHD task planning  
- 🎓 Autism-friendly tutor for quantum physics  
- 📚 Dyslexia-adaptive reading assistant  
- 💬 Multimodal chatbot for sensory regulation feedback
