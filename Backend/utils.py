from pydantic import BaseModel


def model_to_camel_dict(model: BaseModel):
    return model.model_dump(by_alias=True)
