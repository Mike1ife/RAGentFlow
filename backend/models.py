import os
from dotenv import load_dotenv
from sentence_transformers import CrossEncoder
from transformers import AutoTokenizer
from google import genai
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

embedding = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    encode_kwargs={"normalize_embeddings": True},
)  # 384
reranking = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
splitter = RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
    tokenizer, chunk_size=256, chunk_overlap=32
)


class ChatResponse:
    def __init__(self, content: str):
        self.content = content


class GeminiChat:
    """Minimal wrapper keeping the `model.invoke(prompt).content` interface used in graph.py."""

    def __init__(self, model: str, temperature: float = 0.7, max_output_tokens: int = 2048):
        self._client = None
        self.model = model
        self.generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        }

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not GEMINI_API_KEY:
                raise RuntimeError("GEMINI_API_KEY is not set in backend/.env")
            self._client = genai.Client(api_key=GEMINI_API_KEY)
        return self._client

    def invoke(self, prompt: str) -> ChatResponse:
        interaction = self.client.interactions.create(
            model=self.model,
            input=prompt,
            generation_config=self.generation_config,
        )
        return ChatResponse(interaction.output_text or "")


model = GeminiChat(model=GEMINI_MODEL)
