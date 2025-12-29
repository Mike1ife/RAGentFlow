# Multi-Agent RAG Workflow Visualization — RAGentFlow

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
| `LongCat-Flash-Chat` | LLM | Chat / reasoning | https://huggingface.co/meituan-longcat/LongCat-Flash-Chat |

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
   - Acquire a LongCat API key from [https://longcat.chat/platform/api_keys](https://longcat.chat/platform/api_keys)
   - Rename `.env.example` to `.env` and set the `API_KEY` value.
  
2. **Run the application:**
    ```bash
    docker compose up
    ```

3. **Access the application:**
   - API documentation: http://localhost:8000/docs
   - Frontend interface: http://localhost:5173

## License
This project is licensed under the MIT License. See the [LICENSE](https://github.com/Mike1ife/Evolutionary-Computation-Project/blob/main/LICENSE) file for more details.
