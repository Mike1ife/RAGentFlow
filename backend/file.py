import tempfile
import pymupdf4llm
from typing import List
from pathlib import Path
from pgvector import Vector
from datetime import datetime

from database import conn
from schema import Chunk, File
from models import splitter, embedding


def get_chunk_count() -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM doc_chunks")
        return cur.fetchone()[0]


def file_exists(file_name: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT EXISTS(SELECT 1 FROM doc_chunks WHERE file_name = %s LIMIT 1)",
            (file_name,),
        )
        return cur.fetchone()[0]


def add_file_to_db(file_name: str, file_bytes: bytes) -> None:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        tmp_path = tmp.name

    try:
        content = pymupdf4llm.to_markdown(tmp_path)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    chunks = splitter.split_text(content)
    embeddings = embedding.embed_documents(chunks)

    with conn.cursor() as cur:
        for chunk_id, (chunk_content, chunk_embedding) in enumerate(
            zip(chunks, embeddings)
        ):
            cur.execute(
                """
                INSERT INTO doc_chunks (file_name, chunk_index, content, embedding)
                VALUES (%s, %s, %s, %s);
                """,
                (file_name, chunk_id, chunk_content, chunk_embedding),
            )
    conn.commit()


def clear_file_in_db() -> None:
    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE doc_chunks;")
    conn.commit()


def delete_file_from_db(file_name: str) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM doc_chunks WHERE file_name = %s;", (file_name,))
    conn.commit()


def get_all_files_in_db() -> List[File]:
    files = []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                file_name,
                MIN(created_at) AS first_chunk_time
            FROM doc_chunks
            GROUP BY file_name
            ORDER BY first_chunk_time DESC;
            """
        )
        timezone = datetime.now().astimezone().tzinfo
        for name, dt_utc in cur.fetchall():
            dt_local = dt_utc.astimezone(timezone)
            dt_str = dt_local.strftime("%Y-%m-%d %H:%M")
            files.append(File(name=name, created_at=dt_str))
    return files


def get_all_chunks_of_file(file_name: str) -> List[Chunk]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT chunk_index, content, embedding
            FROM doc_chunks
            WHERE file_name = %s
            ORDER BY chunk_index
            """,
            (file_name,),
        )
        chunks = [
            Chunk(index=index, content=content, embedding=embedding)
            for index, content, embedding in cur.fetchall()
        ]
    return chunks


def get_all_chunks_with_score(file_name: str, query: str) -> List[Chunk]:
    query_embedding = embedding.embed_query(query)
    query_vector = Vector(query_embedding)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT chunk_index, content, embedding, 1 - (embedding <=> %s) AS score
            FROM doc_chunks
            WHERE file_name = %s
            ORDER BY score DESC
            """,
            (query_vector, file_name),
        )
        chunks = [
            Chunk(
                index=index,
                content=content,
                embedding=embedding,
                score=round(score, 2),
            )
            for index, content, embedding, score in cur.fetchall()
        ]
    return chunks


def get_similar_chunks(file_name: str, chunk_index: int) -> List[Chunk]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT embedding
            FROM doc_chunks
            WHERE file_name = %s AND chunk_index = %s
            """,
            (file_name, chunk_index),
        )
        target_embedding = cur.fetchone()[0]
        target_vector = Vector(target_embedding)

        cur.execute(
            """
            SELECT chunk_index, content, embedding, 1 - (embedding <=> %s) AS score
            FROM doc_chunks
            WHERE file_name = %s AND chunk_index != %s
            ORDER BY score DESC
            LIMIT 3
            """,
            (target_vector, file_name, chunk_index),
        )
        chunks = [
            Chunk(
                index=index,
                content=content,
                embedding=embedding,
                score=round(score, 2),
            )
            for index, content, embedding, score in cur.fetchall()
        ]
    return chunks
