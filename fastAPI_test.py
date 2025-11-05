from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Coffee(BaseModel):
    id: int
    name: str
    price: float
    size: str = "medium"
    description: str = "Delicious coffee"

# Sample coffee data
coffees = [
    {"id": 1, "name": "Espresso", "price": 3.50, "size": "small", "description": "Strong and bold"},
    {"id": 2, "name": "Latte", "price": 4.50, "size": "medium", "description": "Smooth with steamed milk"},
    {"id": 3, "name": "Cappuccino", "price": 4.00, "size": "medium", "description": "Espresso with foamy milk"},
]

@app.get("/")
def read_root():
    return {"message": "Welcome to the Coffee API!"}

@app.get("/coffees/{coffee_id}")
def get_coffee(coffee_id: int):
    """
    Get a specific coffee by ID
    """
    for coffee in coffees:
        if coffee["id"] == coffee_id:
            return coffee
    return {"error": "Coffee not found"}

@app.get("/coffees")
def get_all_coffees():
    """
    Get all available coffees
    """
    return {"coffees": coffees, "total": len(coffees)}
