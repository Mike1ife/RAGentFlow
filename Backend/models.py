import os
from dotenv import load_dotenv
from sentence_transformers import CrossEncoder
from transformers import AutoTokenizer
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()
API_KEY = os.getenv("API_KEY")

embedding = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    encode_kwargs={"normalize_embeddings": True},
)  # 384
reranking = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
splitter = RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
    tokenizer, chunk_size=256, chunk_overlap=32
)
model = ChatOpenAI(
    base_url="https://api.longcat.chat/openai",
    api_key=API_KEY,
    model="LongCat-Flash-Chat",
    temperature=0.7,
    max_tokens=512,
)
