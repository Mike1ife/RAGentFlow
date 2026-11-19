# RAGentFlow - RAG and Multi-Agent Workflow Visualization

**RAGentFlow** is a visual playground for understanding how RAG (Retrieval-Augmented Generation) and multi-agent systems work together in modern LLM applications. As these technologies become fundamental to agentic AI applications, this platform demystifies their operation by allowing users to visually build, run, and trace multi-agent workflows in real-time.

Through an intuitive interface, users can construct agent networks, upload documents for retrieval, define decision logic, and watch queries flow through the system step-by-step. This hands-on approach helps developers, researchers, and students grasp the core concepts of how intelligent agents collaborate, make decisions, and leverage document context to generate responses.

Key features include visual workflow construction, execution tracing, RAG context visualization, customizable agent behaviors, and detailed insights into each decision point—making it an ideal learning and prototyping environment for understanding LLM application architectures.

## Table of Contents

- [Models](#models)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Models

RAGentFlow uses the following models for embeddings, reranking, and chat:

| Model | Type | Purpose | Model Card |
|-------|------|---------|--------------------|
| `all-MiniLM-L6-v2` | Tokenizer | Splits text into tokens for embedding / chunking | https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 |
| `all-MiniLM-L6-v2` | Embedding | Converts text into 384-dimensional vector embeddings | https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 |
| `ms-marco-MiniLM-L-6-v2` | Reranker | Reranks candidate passages for relevance | https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2 |
| `gemini-3.5-flash-lite` | LLM | Chat / reasoning (via the Google Gen AI SDK) | https://ai.google.dev/gemini-api/docs/models |

## Installation

Follow these steps to set up RAGentFlow locally:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/Mike1ife/RAGentFlow.git
    ```
    
2. **Navigate to the project directory**:
    ```bash
    cd RAGentFlow
    ```
    
3. **Build Docker images (first-time build may take a few minutes):**
    ```bash
    docker compose build
    ```

## Usage

1. **Set up your environment:**
   - Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
   - Rename `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY`.
   - Optional: set `GEMINI_MODEL` to use a different Gemini model (default: `gemini-3.5-flash-lite`).

2. **Run the application:**
    ```bash
    docker compose up -d
    ```
    The backend takes about 30 seconds to load its embedding models on startup. Follow progress with `docker compose logs -f backend`.

3. **Access the application:**
   - API documentation: http://localhost:8000/docs
   - Frontend interface: http://localhost:5173

4. **Useful commands:**
   - Stop the app: `docker compose down`
   - Rebuild after changing `requirements.txt` or `package.json`: `docker compose up -d --build`
   - Reload after editing `backend/.env`: `docker compose up -d --force-recreate backend`

   Code changes in `backend/` and `frontend/` reload automatically.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
