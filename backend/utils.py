import json
import re
from pydantic import BaseModel


def model_to_camel_dict(model: BaseModel):
    return model.model_dump(by_alias=True)


def parse_json(text: str):
    """Parse JSON from an LLM reply, tolerating ```json fences or surrounding prose."""
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise
