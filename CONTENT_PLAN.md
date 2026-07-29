# AgentLab 内容大纲作战图（重建版）

> 用途：本次补全 + 扩写的总清单。你过目确认后，我按此并行派 Agent 批量写。
> 深度标准：**核心 = 350–500 行**，**次要 = 150–250 行**（原理 / 对比 / 可运行代码 / 踩坑 / 延伸阅读写足）。
> 状态图例：🆕 新写 ｜ 🔁 扩写（沿用原 slug 重写，加深内容）｜ ✅ 已达标保留（暂不重写）。

## 现状盘点
- 已写 12 篇：`m0 m1 m2 m3 m4 m5 m6 m7 m8`（AI Agent）+ `python-core python-engineering python-fastapi`（Python）。
- 其余 **12 个分类 0 篇**。
- 总任务：🆕 约 84 篇新写 + 🔁 9 篇扩写（合计 ~93 篇）。

---

## 1. Python（category: `Python`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| python-core | Python 核心与现代语法 | 核心 | 🔁 扩写 | 类型注解/typing、虚拟环境(venv/uv)、pyproject、模块与包、常用标准库 |
| python-engineering | Python 工程化 | 核心 | 🔁 扩写 | pytest 测试、ruff/mypy、打包发布、日志、配置管理 |
| python-fastapi | FastAPI 实战 | 核心 | 🔁 扩写 | 路由/依赖注入、Pydantic 校验、异步视图、中间件、OpenAPI |
| python-async | 异步编程 asyncio | 核心 | 🆕 新写 | 事件循环、async/await、Task/协程、并发原语、与同步库互操作、常见坑 |
| python-data | 数据处理 pandas/numpy | 次要 | 🆕 新写 | Series/DataFrame、向量化、与 LLM 数据管线、缺失值处理 |

## 2. 前端工程（category: `前端工程`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| fe-vue3 | Vue3 组合式 API | 核心 | 🆕 新写 | setup/ref/reactive、响应式原理、Pinia、组合式函数 |
| fe-react | React Hooks 实战 | 核心 | 🆕 新写 | useState/useEffect/自定义 hook、并发特性、状态管理、性能 |
| fe-nextjs | Next.js App Router | 核心 | 🆕 新写 | RSC、Server/Client 组件、路由与流式、缓存、部署 |
| fe-nuxtjs | Nuxt3 全栈 | 次要 | 🆕 新写 | 文件路由、服务端、状态、模块生态 |
| fe-electron | Electron 桌面应用 | 次要 | 🆕 新写 | 主进程/渲染进程、IPC、打包、与 Node 集成 |
| fe-uniapp | uni-app 跨端 | 次要 | 🆕 新写 | 跨端编译、条件编译、组件与 API、发布 |

## 3. 开发工具（category: `开发工具`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| tool-codebuddy | CodeBuddy 编程助手实战 | 核心 | 🆕 新写 | 对话/补全/多文件编辑、 @引用、Agent 模式、提效工作流 |
| tool-codebuddy-skill | 编写 CodeBuddy Skill | 核心 | 🆕 新写 | SKILL.md 结构、触发词、工具权限、示例、调试发布 |
| tool-git | Git 高级工作流 | 次要 | 🆕 新写 | rebase/cherry-pick、worktree、submodule、钩子、冲突解决 |
| tool-docker-cli | Docker 命令行与镜像优化 | 次要 | 🆕 新写 | 镜像分层、.dockerignore、多阶段构建、常用命令 |
| tool-terminal | 终端与 Shell 效率 | 次要 | 🆕 新写 | zsh/fish、tmux、别名、fzf、任务调度 |
| tool-ci | CI/CD 基础 | 次要 | 🆕 新写 | GitHub Actions 流水线、缓存、矩阵、制品、门禁 |

## 4. AI Agent（category: `AI Agent`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| m0-what-is-agent | 什么是 AI Agent | 核心 | 🔁 扩写 | 定义/与 chatbot 区别、能力边界、典型架构、应用场景、局限 |
| agent-architecture | Agent 系统架构设计 | 核心 | 🆕 新写 | 模块划分(感知/决策/执行/记忆)、接口契约、状态机、可观测性内建 |
| agent-planning | 规划与推理 | 核心 | 🆕 新写 | ReAct、Plan-and-Execute、反思/自我批评、思维树、与 LLM 推理关系 |
| agent-loop | Agent 主循环与控制流 | 次要 | 🆕 新写 | 事件驱动循环、步骤上限、超时/中断、并发执行、错误恢复 |
| agent-multimodal | 多模态 Agent | 核心 | 🆕 新写 | 视觉/语音/文档理解、模态路由、工具协同、典型管线 |
| agent-spec | Agent 规格定义 | 次要 | 🆕 新写 | 需求拆解、能力清单、输入输出契约、评测口径 |
| m2-architecture-patterns | 架构设计模式 | 核心 | ✅ 保留 | 反思/工具调用/规划/多 Agent 等模式（已 363 行） |
| m4-memory-rag | 记忆系统 | 核心 | 🔁 扩写 | 短期/长期记忆、向量记忆、摘要记忆、读写策略（RAG 归独立分类） |
| m5-multi-agent | 多 Agent 协作 | 核心 | ✅ 保留 | 角色分工、通信协议、编排（已 387 行） |
| m8-capstone | 综合实战 | 核心 | 🔁 扩写 | 端到端搭建一个 Agent，串起工具/记忆/规划 |

## 5. LLM大模型（category: `LLM大模型`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| llm-models | 主流模型选型 | 核心 | 🆕 新写 | GPT/Claude/Llama/通义/文心/GLM 对比、能力矩阵、选型决策树 |
| llm-transformer | Transformer 原理 | 核心 | 🆕 新写 | 注意力机制、位置编码、Decoder-only、KV Cache、与推理关系 |
| llm-tokenizer | 分词器 | 次要 | 🆕 新写 | BPE/WordPiece、token 计费、跨语言、截断处理 |
| llm-pretrain | 预训练基础 | 次要 | 🆕 新写 | 数据/目标函数/规模定律、与微调关系（概念为主） |
| llm-finetune | 微调实战 SFT/LoRA | 核心 | 🆕 新写 | 数据准备、LoRA/QLoRA、PEFT、训练脚本、评估、成本 |
| llm-inference | 推理部署与量化 | 核心 | 🆕 新写 | vLLM/TGI、量化(INT4/8)、批处理、吞吐优化、本地部署 |
| llm-embedding | Embedding 模型 | 次要 | 🆕 新写 | 原理、选型、维度、重训、与 RAG 关系 |
| llm-function-calling | 函数调用机制 | 核心 | 🆕 新写 | 工具 schema、并行调用、纠错、与 Agent 关系 |
| llm-context | 长上下文 | 次要 | 🆕 新写 | 窗口/RoPE 扩展、缓存、压缩、长文摘要策略 |
| llm-multimodal | 多模态大模型 | 核心 | 🆕 新写 | VLM 原理、图文/视频理解、编码（概念+调用） |
| llm-cost | 成本与计费优化 | 次要 | 🆕 新写 | token 计费、缓存命中、模型分级、批处理省钱 |
| llm-safety | 安全与对齐 | 次要 | 🆕 新写 | 提示注入、越狱、对齐、内容审核、红队 |

## 6. Prompt工程（category: `Prompt工程`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| prompt-basics | 基础技巧 | 次要 | 🆕 新写 | 零样本/少样本、指令清晰化、分隔符、格式约束 |
| prompt-role | 角色与系统提示 | 次要 | 🆕 新写 | 系统提示设计、角色设定、边界约束 |
| prompt-cot | 思维链 CoT | 核心 | 🆕 新写 | Zero/Auto CoT、Few-shot CoT、原理、何时有效 |
| prompt-chain | 提示链与结构化输出 | 核心 | 🆕 新写 | 多步提示、JSON 约束、函数式拆解、可调试 |
| prompt-advanced | 高级推理技巧 | 次要 | 🆕 新写 | 自我一致性、ToT、Reflexion、元提示 |

## 7. RAG（category: `RAG`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| rag-overview | RAG 总览 | 核心 | 🆕 新写 | 为什么需要、端到端流程、质量瓶颈、选型 |
| rag-chunking | 文档切分 | 核心 | 🆕 新写 | 固定/语义/递归切分、重叠、表格/代码特殊处理 |
| rag-embedding | 向量化 | 次要 | 🆕 新写 | 模型选型、维度、归一化、领域适配 |
| rag-vector-db | 向量数据库 | 核心 | 🆕 新写 | Milvus/Qdrant/PGVector/Chroma 对比、索引(HNSW)、部署 |
| rag-hybrid | 混合检索 | 核心 | 🆕 新写 | BM25+向量、RRF、元数据过滤、查询改写 |
| rag-rerank | 重排序 | 次要 | 🆕 新写 | Cross-Encoder、重排模型、Top-K 策略 |
| rag-generation | 生成与引用 | 次要 | 🆕 新写 | 上下文压缩、引用溯源、抗幻觉、答案组织 |
| rag-graph | GraphRAG | 核心 | 🆕 新写 | 知识图谱抽取、社区摘要、全局问答、适用场景 |
| rag-agentic | Agentic RAG | 核心 | 🆕 新写 | 检索 Agent、自省检索、路由、与多 Agent 结合 |
| rag-eval | RAG 评估 | 核心 | 🆕 新写 | 检索/生成指标、Ragas、人工标注、回归测试 |
| rag-production | 生产化 | 次要 | 🆕 新写 | 增量更新、缓存、监控、成本控制 |

## 8. 工具开发（category: `工具开发`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| m1-tool-calling | Function Calling 实战 | 核心 | 🔁 扩写 | OpenAI 工具调用骨架、Zod 校验、并行/嵌套、错误重试 |
| tool-cli | CLI 工具开发 | 次要 | 🆕 新写 | commander/ink、交互式、彩色输出、发布 |
| tool-mcp | MCP 协议与开发 | 核心 | 🆕 新写 | MCP 概念、Transport、Server/Client 实现、与 Agent 集成 |
| tool-openapi | 基于 OpenAPI 封装工具 | 次要 | 🆕 新写 | 从 OpenAPI 生成工具、鉴权、限流 |
| tool-sandbox | 工具沙箱与安全执行 | 核心 | 🆕 新写 | 代码执行沙箱、权限最小化、资源限额、审计 |
| tool-skill | Agent 插件/Skill 开发 | 次要 | 🆕 新写 | 插件契约、注册发现、上下文注入 |

## 9. 框架（category: `框架`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| m3-frameworks | 主流框架选型 | 核心 | ✅ 保留 | LangChain/LlamaIndex/AutoGen/CrewAI 对比（已 420 行） |
| framework-langchain | LangChain 实战 | 核心 | 🆕 新写 | Chain/Runnable、LCEL、Retriever、Callback、踩坑 |
| framework-langgraph | LangGraph 编排 | 核心 | 🆕 新写 | 状态图、节点/边、检查点、Human-in-loop、多 Agent |
| framework-llamaindex | LlamaIndex 实战 | 核心 | 🆕 新写 | Index/Query、数据连接器、RAG 管线、Agent |
| framework-autogen | AutoGen 多 Agent | 核心 | 🆕 新写 | 会话/GroupChat、代码执行、定制 Agent |
| framework-crewai | CrewAI | 次要 | 🆕 新写 | Crew/Role/Task、流程、与 LangGraph 对比 |
| framework-native-vs-fw | 原生 vs 框架抉择 | 次要 | 🆕 新写 | 何时手写、何时用框架、抽象成本、可维护性 |

## 10. 数据处理（category: `数据处理`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| data-etl | ETL 管道 | 次要 | 🆕 新写 | 抽取/清洗/加载、增量、调度、可观测 |
| data-clean | 数据清洗与质量 | 次要 | 🆕 新写 | 去重/标准化/异常、质量门禁、数据校验 |
| data-knowledge | 知识库构建 | 核心 | 🆕 新写 | 文档解析(PDF/Word/HTML)、结构化、元数据、版本 |
| data-vector-pipeline | 向量数据管线 | 核心 | 🆕 新写 | 批量嵌入、去重、更新策略、与向量库同步 |
| data-eval-set | 评测集构建 | 次要 | 🆕 新写 | 黄金集、边界用例、标注规范、版本管理 |
| data-orchestration | 编排 Airflow/Prefect | 次要 | 🆕 新写 | DAG、重试、告警、与 ML 管线 |

## 11. 部署运维（category: `部署运维`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| m7-engineering-deploy | 工程化部署 | 核心 | 🔁 扩写 | 配置/密钥/健康检查、灰度、回滚、可观测内建 |
| deploy-docker | Docker 化 Agent 服务 | 核心 | 🆕 新写 | 多阶段、最小化镜像、健康检查、compose |
| deploy-k8s | Kubernetes 部署 | 核心 | 🆕 新写 | Deployment/Service、HPA、配置与密钥、滚动更新 |
| deploy-serverless | Serverless 部署 | 次要 | 🆕 新写 | 云函数/容器、冷启动、适配 Agent 长任务 |
| deploy-gpu | GPU 推理服务 | 核心 | 🆕 新写 | 模型服务化、批处理、显存优化、多卡 |
| deploy-monitor | 监控与日志 | 次要 | 🆕 新写 | 指标/链路/日志、告警、LLM 专属监控(质量/成本) |
| deploy-scale | 弹性伸缩 | 次要 | 🆕 新写 | 并发模型、队列、限流、成本弹性 |

## 12. 评估调优（category: `评估调优`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| m6-eval-observability | 可观测与评估 | 核心 | 🔁 扩写 | trace/span、LangSmith/Phoenix、成本追踪、dashboard |
| eval-metrics | 评估指标 | 核心 | 🆕 新写 | 自动指标、LLM-as-judge、任务完成度、人工校准 |
| eval-trace | 链路追踪实战 | 核心 | 🆕 新写 | OpenTelemetry、Span 设计、错误定位、回放 |
| eval-dataset | 评测集与回归 | 次要 | 🆕 新写 | 集构建、回归基线、CI 集成、漂移检测 |
| eval-prompt-opt | Prompt 调优 | 次要 | 🆕 新写 | 系统化迭代、A/B、版本管理、避坑 |
| eval-guardrail | 护栏与安全评估 | 核心 | 🆕 新写 | 输入/输出过滤、敏感词、合规、红队评估 |
| eval-abtest | 线上实验 | 次要 | 🆕 新写 | A/B、指标设计、显著性、灰度发布 |

## 13. 产品工程（category: `产品工程`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| product-ux | Agent 产品交互设计 | 核心 | 🆕 新写 | 对话式 UX、预期管理、可控性、失败态设计 |
| product-stream | 流式输出体验 | 次要 | 🆕 新写 | SSE/流式、打字机、取消、背压 |
| product-hitl | 人在回路 | 核心 | 🆕 新写 | 确认/编辑、审批流、人机分工、信任建设 |
| product-fallback | 降级与容错 | 次要 | 🆕 新写 | 超时/限流/兜底话术、重试、优雅降级 |
| product-multi-tenant | 多租户与权限 | 次要 | 🆕 新写 | 数据隔离、密钥隔离、配额、审计 |
| product-analytics | 产品数据分析 | 次要 | 🆕 新写 | 埋点、会话分析、质量/成本看板、迭代闭环 |

## 14. 常见面试题（category: `常见面试题`）
| slug | title | 深度 | 状态 | 要点 |
|---|---|---|---|---|
| interview-agent | Agent/LLM 工程师面试题 | 核心 | 🆕 新写 | 概念题、RAG/Agent 设计题、陷阱题、参考答案 |
| interview-system-design | 系统设计题 | 次要 | 🆕 新写 | 设计一个 RAG/Agent 系统、容量估算、权衡 |

---

## 执行备注
- 写作规范见 `AGENT_BRIEF.md`（已更新到更详尽标准）。
- 分组并行派 Agent：同类主题一个 Agent 负责 2–5 篇，保证上下文连贯。
- 红线：category 精确匹配上表；Callout title 禁 ASCII 双引号；不覆盖他人文件（各 Agent 只写分配到的 slug）。
- 全部写完后：`node scripts/build-static.mjs` 重建 `static/`，起预览核验。
