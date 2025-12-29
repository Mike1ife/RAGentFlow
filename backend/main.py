from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schema import QueryRequest, AgentNode, Edge, Prompt
from utils import model_to_camel_dict
from file import (
    file_exists,
    add_file_to_db,
    clear_file_in_db,
    delete_file_from_db,
    get_all_files_in_db,
    get_all_chunks_of_file,
    get_all_chunks_with_score,
    get_similar_chunks,
)
from graph import GraphManager
from prompt import PromptManager
from simulation import Validator, Executor

app = FastAPI()
graph_manager = GraphManager()
prompt_manager = PromptManager()

validator = Validator(graph_manager)
executor = Executor(graph_manager)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/file/upload", tags=["File"])
async def upload_file(file: UploadFile = File(...)):
    file_name = file.filename

    if file_exists(file_name):
        raise HTTPException(
            status_code=409,
            detail=f"File '{file_name}' already exists.",
        )

    try:
        file_bytes = await file.read()
        add_file_to_db(file_name=file_name, file_bytes=file_bytes)
        return {"message": "Upload File Successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@app.delete("/file/delete", tags=["File"])
async def clear_file():
    clear_file_in_db()
    return {"message": "Clear Files Successfully"}


@app.delete("/file/delete/{file_name}", tags=["File"])
async def delete_file(file_name: str):
    delete_file_from_db(file_name=file_name)
    return {"message": "Delete File Successfully"}


@app.get("/file/list", tags=["File"])
async def list_files():
    files = get_all_files_in_db()
    response = [model_to_camel_dict(file) for file in files]
    return response


@app.get("/file/{file_name}/chunks", tags=["File"])
async def list_chunks(file_name: str):
    chunks = get_all_chunks_of_file(file_name=file_name)
    response = [model_to_camel_dict(chunk) for chunk in chunks]
    return response


@app.post("/file/{file_name}/chunks", tags=["File"])
async def list_chunks_with_score(file_name: str, query_request: QueryRequest):
    chunks = get_all_chunks_with_score(file_name=file_name, query=query_request.query)
    response = [model_to_camel_dict(chunk) for chunk in chunks]
    return response


@app.get("/file/{file_name}/chunks/{chunk_index}/similar", tags=["File"])
async def list_similar_chunks(file_name: str, chunk_index: int):
    similar_chunks = get_similar_chunks(file_name=file_name, chunk_index=chunk_index)
    response = [model_to_camel_dict(chunk) for chunk in similar_chunks]
    return response


@app.put("/graph/entry/{node_name}", tags=["Graph"])
async def set_graph_entry(node_name: str):
    graph_manager.set_entry(node_name=node_name)
    return {"message": "Set Entry Successfully"}


@app.post("/graph/agent", tags=["Graph"])
async def add_graph_agent(agent: AgentNode):
    if graph_manager.node_exist(node_name=agent.name):
        raise HTTPException(
            status_code=409,
            detail=f"Agent '{agent.name}' already exists.",
        )

    try:
        graph_manager.add_node(node=agent)
        return {"message": "Add Agent Successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add agent: {str(e)}")


@app.delete("/graph/agent/{agent_name}", tags=["Graph"])
async def delete_graph_agent(agent_name: str):
    graph_manager.delete_node(node_name=agent_name)
    return {"message": "Delete Agent Successfully"}


@app.put("/graph/agent/{agent_name}", tags=["Graph"])
async def update_graph_agent(agent_name: str, agent: AgentNode):
    if agent.name != agent_name and graph_manager.node_exist(node_name=agent.name):
        raise HTTPException(
            status_code=409,
            detail=f"Agent '{agent.name}' already exists.",
        )

    graph_manager.update_node(node_name=agent_name, node=agent)
    return {"message": "Update Agent Successfully"}


@app.post("/graph/edge", tags=["Graph"])
async def add_graph_edge(edge: Edge):
    if graph_manager.edge_exist(src_node=edge.src_node, dest_node=edge.dest_node):
        raise HTTPException(
            status_code=409,
            detail=f"Edge '{edge.src_node} → {edge.dest_node}' already exists.",
        )

    if graph_manager.cause_cycle(edge=edge):
        raise HTTPException(
            status_code=409,
            detail=f"Edge '{edge.src_node} → {edge.dest_node}' creates a cycle",
        )

    try:
        graph_manager.add_edge(edge=edge)
        return {"message": "Add Edge Successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add edge: {str(e)}")


@app.delete("/graph/edge/{src_node}/{dest_node}", tags=["Graph"])
async def delete_graph_edge(src_node: str, dest_node: str):
    graph_manager.delete_edge(src_node=src_node, dest_node=dest_node)
    return {"message": "Delete Edge Successfully"}


@app.put("/graph/edge", tags=["Graph"])
async def update_graph_edge(edge: Edge):
    graph_manager.update_edge(edge=edge)
    return {"message": "Update Edge Successfully"}


@app.get("/graph/list", tags=["Graph"])
async def list_graph():
    graph = graph_manager.get_graph()
    response = {
        "entryNode": graph.entry_node,
        "nodes": {
            nodeName: model_to_camel_dict(node)
            for nodeName, node in graph.nodes.items()
        },
        "edges": {
            srcNode: [model_to_camel_dict(edge) for edge in edges]
            for srcNode, edges in graph.edges.items()
        },
    }

    return response


@app.post("/graph/reset", tags=["Graph"])
async def reset_graph_endpoint():
    graph_manager.reset_graph()
    return {"message": "Reset Graph Successfully"}


@app.get("/prompt/template/{template_name}", tags=["Prompt"])
async def get_template_endpoint(template_name: str):
    prompt = prompt_manager.get_template(template_name=template_name)
    response = model_to_camel_dict(prompt)
    return response


@app.get("/prompt/list", tags=["Prompt"])
async def list_prompts():
    prompts = prompt_manager.get_all_prompts()
    response = [model_to_camel_dict(prompt) for prompt in prompts]
    return response


@app.get("/prompt/list/name", tags=["Prompt"])
async def list_prompt_names():
    prompts = prompt_manager.get_all_prompts()
    response = [prompt.name for prompt in prompts]
    return response


@app.post("/prompt", tags=["Prompt"])
async def new_prompt_endpoint(prompt: Prompt):
    if prompt_manager.prompt_exist(prompt):
        raise HTTPException(
            status_code=409,
            detail=f"Prompt '{prompt.name}' already exists.",
        )

    prompt_manager.new_prompt(prompt=prompt)
    return {"message": "Add New Prompt Successfully"}


@app.put("/prompt", tags=["Prompt"])
async def update_prompt_endpoint(prompt: Prompt):
    prompt_manager.update_prompt(prompt=prompt)
    return {"message": "Update Prompt Successfully"}


@app.delete("/prompt/{prompt_name}", tags=["Prompt"])
async def delete_prompt_endpoint(prompt_name: str):
    prompt_manager.delete_prompt(prompt_name=prompt_name)
    return {"message": "Delete Prompt Successfully"}


@app.get("/simulation/validate", tags=["Simulation"])
async def validate_simulation_endpoint():
    validation = validator.validate_simulation()
    response = model_to_camel_dict(validation)
    return response


@app.post("/simulation/run", tags=["Simulation"])
async def run_simulation(query_request: QueryRequest):
    executor.compile_graph(query=query_request.query)
    executor.run()
    return {"message": "Run Simulation Successfully"}


@app.get("/simulation/result", tags=["Simulation"])
async def get_simulation_result():
    result = executor.get_last_result()
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No simulation result yet.",
        )
    response = model_to_camel_dict(result)
    return response
