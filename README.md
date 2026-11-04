# AgentForge

AgentForge is an AI assistant built with Next.js, LangGraph, and the Model Context Protocol (MCP). It routes each request to general chat, document-based retrieval, or external tools, depending on what the user asks.

The project includes PDF ingestion, hybrid retrieval with dense and sparse search, Reciprocal Rank Fusion (RRF), reranking, MCP tools for web search, current weather, and product search, plus authentication and token-usage tracking.

## Features

- **Three-way request routing:** Classifies a message as `general`, `rag`, or `tool`.
- **Document Q&A:** Upload PDFs and ask questions grounded in their contents.
- **Hybrid retrieval:** Combines dense and sparse retrieval using Reciprocal Rank Fusion.
- **Reranking:** Reranks retrieved chunks before sending context to the answer-generation model.
- **MCP tools:** Connects to a separate MCP server that exposes web search, weather, and product-search tools.
- **Conversation persistence:** Uses LangGraph's Postgres checkpointer for graph state and thread-based conversations.
- **Authentication:** Supports email/password, Google, and GitHub sign-in through Better Auth.
- **Usage tracking:** Collects model token usage and sends usage data to Polar.
- **Retrieval evaluation:** Compares retrieval results before and after reranking using Recall@5, MRR@10, and nDCG@10.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Application | Next.js, React, TypeScript |
| Agent workflow | LangGraph, LangChain |
| Model providers | Groq; Google Gemini integration in the model registry |
| MCP | Model Context Protocol SDK, `@langchain/mcp-adapters`, Hono |
| Retrieval | Pinecone dense index, Pinecone sparse index, RRF, Pinecone reranker |
| Embeddings | `Xenova/all-MiniLM-L6-v2`, Pinecone sparse embeddings |
| Database | PostgreSQL, Drizzle ORM |
| Authentication | Better Auth |
| Usage and billing integration | Polar |
| External data tools | Tavily, WeatherAPI, SerpApi / Google Shopping |
| UI | Tailwind CSS and React components |

## Architecture

### Request flow

```text
User message
    |
    v
Next.js chat API
    |
    v
LangGraph router
    |
    +---- general ------------------------------+
    |                                           |
    +---- rag                                   |
    |      |                                    |
    |      v                                    |
    |   Query rewriter                          |
    |      |                                    |
    |      v                                    |
    |   Hybrid retrieval (dense + sparse)       |
    |      |                                    |
    |      v                                    |
    |   RRF candidate fusion                    |
    |      |                                    |
    |      v                                    |
    |   Reranker                                |
    |      |                                    |
    |      v                                    |
    |   Context-grounded answer generation      |
    |                                           |
    +---- tool                                  |
           |                                    |
           v                                    |
       Tool planner                             |
           |                                    |
           v                                    |
       MCP client                                |
           |                                    |
           v                                    |
       Local MCP server                         |
       (web, weather, product tools)             |
           |                                    |
           +------------------------------------+
                         |
                         v
                 Stream response to UI
```

### RAG ingestion and retrieval

1. The upload endpoint accepts PDF files for authenticated users, up to 10 MB.
2. The PDF text is split into chunks using a chunk size of 800 characters and an overlap of 150 characters.
3. Dense embeddings are generated with `Xenova/all-MiniLM-L6-v2`; sparse embeddings are generated using Pinecone's `pinecone-sparse-english-v0` model.
4. Chunk records are written to separate dense and sparse Pinecone indexes under a namespace derived from the authenticated user ID.
5. At question time, the query rewriter produces up to three search queries. Dense and sparse results are fused using Reciprocal Rank Fusion (RRF).
6. A Pinecone reranker ranks the candidate chunks against the user's original question. The top eight chunks are passed to the answer-generation prompt.
7. The RAG prompt asks the model to answer from the retrieved excerpts and cite them as `[1]`, `[2]`, and so on.

### MCP tools

The MCP server runs separately from the Next.js application and listens on port `8080`. It exposes the following tools over the `/services` HTTP endpoint:

| Tool | Purpose |
| --- | --- |
| `web_searchTool` | Searches the web using Tavily and returns a limited set of source details. |
| `weather_Search` | Returns current weather data for a supplied location using WeatherAPI. |
| `productTool` | Searches Google Shopping results through SerpApi. |

The application-side MCP client reads `MCP_SERVER_URL` to connect to this server. For local development, ngrok can expose the local server through a public HTTPS URL so the application can reach it using the MCP endpoint.

## Prerequisites

Install the following before running the project:

- Node.js compatible with the installed Next.js version
- pnpm
- PostgreSQL
- A Pinecone account with one dense index and one sparse index
- API credentials for the services you want to use (see Environment Variables)

You will also need ngrok for the local MCP-to-remote connection described below.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/devtanishq-tech/AgentForge-AI-Agentic-AI-SaaS-Platform.git
cd AgentForge-AI-Agentic-AI-SaaS-Platform
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. Add the credentials for the services you plan to use.

The application reads the following environment variables in the current implementation:

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection and LangGraph checkpoint persistence |
| `BETTER_AUTH_URL` | Base URL for Better Auth |
| `GROQ_API_KEY` | Groq chat models used by the router, tool planner, and answer generator |
| `GOOGLE_API_KEY` | Google Gemini model integration |
| `GOOGLE_CLIENT_ID` | Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `GITHUB_CLIENT_ID` | GitHub sign-in |
| `GITHUB_CLIENT_SECRET` | GitHub sign-in |
| `PINECONE_KEY` | Pinecone API access |
| `PINECONE_INDEX_NAME` | Dense vector index name |
| `PINECONE_SPARSE_INDEX_NAME` | Sparse vector index name |
| `TAVILY_SEARCH_API` | Tavily web search |
| `WEATHER_API_KEY` | WeatherAPI current-weather lookup |
| `SERP_API_KEY` | SerpApi Google Shopping search |
| `POLAR_ACCESS_TOKEN` | Polar usage, checkout, and customer integration |
| `MCP_SERVER_URL` | URL used by the application MCP client |

Configure `POLAR_ACCESS_TOKEN` and the Polar product settings used in `lib/auth.ts` and `lib/polar/` for the current Polar integration. Do not commit `.env` or paste API tokens into source control.

Set `MCP_SERVER_URL` to the MCP endpoint URL ending in `/services`. For local access without a tunnel, this is typically `http://localhost:8080/services`. When using ngrok, use the generated HTTPS domain with `/services` appended.

> Note: The repository does not currently include an `.env.example` file. The table above is based on the environment variables referenced in the source code; check the relevant files if you change providers or integrations.

### 4. Prepare the database

Make sure the PostgreSQL database referenced by `DATABASE_URL` exists and is reachable. Apply the repository's Drizzle migrations:

```bash
pnpm run migration:migrate
```

The chat graph also uses LangGraph's PostgreSQL checkpointer. In the current code, the `PostgresSaver.setup()` call in `app/api/chat/graph.ts` is commented out. If the checkpointer tables have not been initialized in your database, initialize them once before using chat persistence.

### 5. Start the MCP server

Open a terminal in the project directory and run:

```bash
pnpm run mcp:dev
```

This runs `lib/mcp/server.ts` on port `8080`. Keep this terminal open while using the application.

### 6. Expose the MCP server with ngrok

If your application needs to connect to the MCP server through a remote HTTPS endpoint:

1. Sign in to [ngrok](https://ngrok.com/).
2. Open the ngrok dashboard and locate your authentication token.
3. In a **new terminal**, configure the token using the command shown by ngrok. The usual command is:

   ```bash
   ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
   ```

4. Start the tunnel:

   ```bash
   ngrok http 8080
   ```

5. Copy the HTTPS forwarding URL printed by ngrok and set `MCP_SERVER_URL` in `.env` to that URL followed by `/services`. For example:

   ```env
   MCP_SERVER_URL=https://YOUR_NGROK_DOMAIN.ngrok-free.app/services
   ```

6. Restart the main application after changing `.env`, if it was already running.

Keep the ngrok terminal open as well. The forwarding URL may change between sessions, so update `MCP_SERVER_URL` when it changes.

### 7. Start the main application

Open another terminal in the project directory and run:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser, then sign in or create an account.

**Port note:** The current `pnpm run dev` script starts Next.js on its default development port, normally `3000`. The MCP server separately listens on `8080`, so open `http://localhost:3000` for the app and keep `http://localhost:8080/services` for the MCP endpoint. If you specifically need the app on port `8080`, change one service's port first so they do not conflict.

## Using AgentForge

1. Sign in or create an account.
2. Ask a general question to use the normal chat route.
3. Upload a PDF and ask questions about its contents to use document retrieval.
4. Ask for current information, weather, or product comparisons to trigger the relevant MCP tool.
5. Keep the MCP server and ngrok tunnel running for tool-based requests that depend on the exposed local MCP endpoint.

## Retrieval Evaluation

The repository includes a question set, relevance labels, metric implementations, and a script to compare hybrid retrieval before and after reranking:

- `eval/questions.json` — evaluation questions and relevant chunk IDs.
- `eval/metrics.ts` — Recall@K, MRR@K, and nDCG@K calculations.
- `eval/run-retrieval-eval.ts` — runs hybrid retrieval, reranks the same candidates, prints average metrics, and writes a per-question JSON report to `eval/results/`.

The committed report dated October 28, 2026 contains 35 questions. In that run, the average metrics were:

| Metric | Hybrid retrieval | After reranking |
| --- | ---: | ---: |
| Recall@5 | 0.90 | 0.96 |
| MRR@10 | 0.80 | 0.96 |
| nDCG@10 | 0.80 | 0.88 |

These values describe the saved benchmark run and dataset in this repository; they are not a guarantee of performance on other documents or questions.

To run the evaluation, ensure the PDF used for the evaluation has been ingested into your Pinecone indexes and that its user namespace is available. Then set `EVAL_USER_ID` to that user's ID and run the script with your TypeScript runner, for example:

```bash
pnpm exec tsx eval/run-retrieval-eval.ts
```

## Project Structure

The main implementation areas are:

```text
app/
  api/
    chat/
      nodes/          # LangGraph router, query rewriting, retrieval, reranking, tools, generator
      graph.ts        # Graph definition and Postgres checkpointer
      route.ts        # Authenticated streaming chat endpoint
      tool.ts         # Web search, weather, and product tool definitions
      toolregistry.ts # Tools exposed to the graph
    uploads/           # PDF upload and ingestion endpoint
  auth/                # Sign-in and sign-up pages
lib/
  mcp/
    client.ts          # Connects to the MCP server using MCP_SERVER_URL
    server.ts          # MCP server and tool registrations
  rag/
    ingest.ts          # PDF parsing, chunking, embedding, and indexing
    retrieve.ts        # Dense + sparse search and RRF
    reranker.ts        # Reranking implementation
    embeeding.ts       # Dense and sparse embeddings
  polar/               # Usage ingestion and token accounting
db/
  schema/              # Drizzle database schema
drizzle/               # Database migrations
eval/
  questions.json       # Evaluation set
  metrics.ts            # Retrieval metrics
  run-retrieval-eval.ts # Evaluation runner
```

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Start the Next.js development server |
| `pnpm run mcp:dev` | Start the local MCP server on port 8080 |
| `pnpm run build` | Build the Next.js application |
| `pnpm run start` | Start the production Next.js server |
| `pnpm run lint` | Run ESLint |
| `pnpm run migration:generate` | Generate Drizzle migrations |
| `pnpm run migration:migrate` | Run Drizzle migrations |

## Current Limitations and Notes

- The MCP server must be running and reachable for MCP tool calls to work.
- The main application and MCP server are separate processes; configure ports so they do not conflict.
- Pinecone indexes and third-party API credentials must be provisioned separately.
- The model registry contains provider/model entries that are not fully wired for every listed provider or subscription tier. The active chat route currently selects `openai/gpt-oss-120b`.
- The retrieval evaluation depends on known relevant chunk IDs and the matching ingested document. Results can change when the document, chunking, index data, embedding model, or ranking implementation changes.

## Security

- Keep API keys, OAuth secrets, database credentials, and ngrok tokens in local environment variables.
- Never commit `.env` files or include secrets in screenshots, logs, or issue reports.
- Do not expose the MCP endpoint publicly without understanding which tools it makes available.

## License

No license file was found in the repository at the time this README was prepared. Add a `LICENSE` file if you intend to specify how others may use, modify, or distribute this project.
