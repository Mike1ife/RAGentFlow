-- ====================== File ======================

CREATE EXTENSION vector;

CREATE TABLE doc_chunks (
    id BIGSERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384), -- dim
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (file_name, chunk_index)
);

-- ====================== Prompt ======================

CREATE TYPE valid_template AS ENUM ('guided_template', 'structured_template', 'raw_template');

CREATE TABLE prompt (
    name TEXT PRIMARY KEY,
    template VALID_TEMPLATE NOT NULL,
    variable_value JSONB NOT NULL,
    use_context BOOLEAN NOT NULL DEFAULT TRUE,
    saved_at TIMESTAMPTZ DEFAULT now()
);

CREATE FUNCTION set_saved_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.saved_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prompt_saved_at
BEFORE UPDATE ON prompt
FOR EACH ROW
EXECUTE FUNCTION set_saved_at();

-- Default Prompt

INSERT INTO prompt (name, template, variable_value)
VALUES
(
    'guided default',
    'guided_template',
    '{
        "persona": "a knowledgeable and helpful assistant",
        "goal": "provide clear, accurate, and concise answers",
        "style": "professional, friendly, and easy to understand"
    }'::jsonb
),
(
    'structured default',
    'structured_template',
    '{
        "system_header": "Follow best practices for correctness, safety, and clarity.",
        "persona_block": "You are an expert assistant with strong analytical and reasoning skills.",
        "style_block": "Use structured explanations, bullet points when helpful, and concise paragraphs."
    }'::jsonb
),
(
    'raw default',
    'raw_template',
    '{
        "raw_system_prompt": "You are a helpful AI assistant."
    }'::jsonb
);

-- ====================== Graph ======================

CREATE TYPE valid_agent_type AS ENUM ('classifier', 'gatekeeper', 'scorer', 'responder');
CREATE TYPE valid_operator AS ENUM ('eq', 'gt', 'lt', 'gte', 'lte');

CREATE TABLE agent_node (
    name TEXT PRIMARY KEY,
    agent_type valid_agent_type NOT NULL,
    is_entry BOOLEAN NOT NULL DEFAULT FALSE,
    output_field TEXT,
    decision_config JSONB,
    prompt_name TEXT,
    FOREIGN KEY (prompt_name) REFERENCES prompt(name)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE edge (
    src_node TEXT NOT NULL,
    dest_node TEXT NOT NULL,
    operator VALID_OPERATOR NOT NULL,
    value JSONB NOT NULL,
    PRIMARY KEY (src_node, dest_node),
    FOREIGN KEY (src_node) REFERENCES agent_node(name)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (dest_node) REFERENCES agent_node(name)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE PROCEDURE sp_set_entry_node(IN p_entry TEXT)
LANGUAGE sql
AS $$
    UPDATE agent_node
    SET is_entry = (name = p_entry);
$$;

CREATE PROCEDURE sp_set_default_graph()
LANGUAGE plpgsql
AS $$
BEGIN
    TRUNCATE TABLE edge;
    TRUNCATE TABLE agent_node CASCADE;

    -- Response agent (responder type)
    INSERT INTO agent_node (name, agent_type, is_entry, prompt_name)
    VALUES ('Default', 'responder', TRUE, 'guided default');

    -- Scorer agent
    INSERT INTO agent_node (name, agent_type, output_field, decision_config)
    VALUES ('Numeric', 'scorer', 'difficulty', '{"instruction": "Score difficulty from 0 to 1"}');

    -- Gatekeeper agent
    INSERT INTO agent_node (name, agent_type, output_field, decision_config)
    VALUES ('Boolean', 'gatekeeper', 'is_academic', '{"question": "Is this query about academic or research topics?"}');

    -- Classifier agent
    INSERT INTO agent_node (name, agent_type, output_field, decision_config)
    VALUES ('Classification', 'classifier', 'intent', '{"options": ["academic", "sports", "shopping"]}');
END;
$$;

CALL sp_set_default_graph();