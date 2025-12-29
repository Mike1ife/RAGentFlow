import yaml
from enum import Enum
from typing import List
from datetime import datetime
from psycopg.types.json import Json

from database import conn
from schema import (
    PromptTemplate,
    Prompt,
    GuidedTemplateValue,
    StructuredTemplateValue,
    RawTemplateValue,
)


class TemplateType(str, Enum):
    GUIDED = "guided_template"
    STRUCTURED = "structured_template"
    RAW = "raw_template"


class PromptManager:
    def __init__(self):
        with open("template.yaml", "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

    def get_template(self, template_name: str) -> PromptTemplate:
        return PromptTemplate(**self.config[template_name])

    def get_all_prompts(self) -> List[Prompt]:
        prompts = []
        timezone = datetime.now().astimezone().tzinfo
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM prompt ORDER BY saved_at DESC")
            for (
                prompt_name,
                template,
                variable_value,
                use_context,
                saved_at,
            ) in cur.fetchall():
                dt_saved_at = saved_at.astimezone(timezone).strftime("%Y-%m-%d %H:%M")

                if template == TemplateType.GUIDED:
                    variable_value_model = GuidedTemplateValue(**variable_value)
                elif template == TemplateType.STRUCTURED:
                    variable_value_model = StructuredTemplateValue(**variable_value)
                elif template == TemplateType.RAW:
                    variable_value_model = RawTemplateValue(**variable_value)

                prompts.append(
                    Prompt(
                        name=prompt_name,
                        template=template,
                        variable_value=variable_value_model,
                        use_context=use_context,
                        saved_at=dt_saved_at,
                    )
                )
        return prompts

    def prompt_exist(self, prompt: Prompt) -> bool:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT EXISTS(SELECT 1 FROM prompt WHERE name = %s LIMIT 1)",
                (prompt.name,),
            )
            return cur.fetchone()[0]

    def new_prompt(self, prompt: Prompt):
        with conn.cursor() as cur:
            cur.execute(
                """ 
                INSERT INTO prompt (name, template, variable_value, use_context)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    prompt.name,
                    prompt.template,
                    Json(prompt.variable_value.model_dump()),
                    prompt.use_context,
                ),
            )
        conn.commit()

    def update_prompt(self, prompt: Prompt):
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE prompt
                SET variable_value = %s, use_context = %s
                WHERE name = %s
                """,
                (
                    Json(prompt.variable_value.model_dump()),
                    prompt.use_context,
                    prompt.name,
                ),
            )
        conn.commit()

    def delete_prompt(self, prompt_name: str):
        with conn.cursor() as cur:
            cur.execute("DELETE FROM prompt WHERE name = %s", (prompt_name,))
        conn.commit()

    def get_formatted_prompt(self, prompt_name: str, query: str, context: str) -> str:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT template, variable_value, use_context
                FROM prompt
                WHERE name = %s
                """,
                (prompt_name,),
            )
            template_name, input_variables, use_context = cur.fetchone()

        prompt_template = (
            self.config[template_name]["context_system_prompt"] + "\n---\n"
            if use_context
            else ""
        ) + self.config[template_name]["template"]

        if use_context:
            prompt = prompt_template.format(
                context=context, **input_variables, query=query
            )
        else:
            prompt = prompt_template.format(**input_variables, query=query)
        return prompt
