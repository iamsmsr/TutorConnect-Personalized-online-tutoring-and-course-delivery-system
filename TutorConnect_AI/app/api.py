from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.vector_store import VectorStore
from app.rag import answer_question
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
vector_store = VectorStore()
vector_store.load()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Mount the frontend directory to serve static files
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Serve the index.html at the root
@app.get("/")
async def serve_frontend():
    return FileResponse("frontend/index.html")


class QuestionRequest(BaseModel):
    question: str


@app.post("/ask")
async def ask_question(req: QuestionRequest):
    answer = answer_question(req.question, vector_store)
    return {"answer": answer}