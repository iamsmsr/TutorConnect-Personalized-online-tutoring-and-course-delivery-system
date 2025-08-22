from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.vector_store import VectorStore
from app.rag import answer_question, USER_PROMPT, settings, groq_client
from nomic import embed
from fastapi.middleware.cors import CORSMiddleware
import os
from app.plagiarism_ai_config import PLAGIARISM_CHECKER_URL, AI_CONTENT_DETECTION_URL, HEADERS
import requests

app = FastAPI()
vector_store = VectorStore()
# Only load if the default vector_store.json exists
if os.path.exists('data/vector_store.json'):
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
async def serve_frontend(request: Request):
    role = request.query_params.get("role", "homepage")
    if role == "student":
        return FileResponse("frontend/student.html")
    elif role == "tutor":
        return FileResponse("frontend/tutor.html")
    else:
        return FileResponse("frontend/homepage.html")

# Serve homepage.html for /homepage
@app.get("/homepage")
async def serve_homepage():
    return FileResponse("frontend/homepage.html")

# Serve student.html for /student
@app.get("/student")
async def serve_student():
    return FileResponse("frontend/student.html")

# Serve tutor.html for /tutor
@app.get("/tutor")
async def serve_tutor():
    return FileResponse("frontend/tutor.html")


class QuestionRequest(BaseModel):
    question: str


@app.post("/ask")
async def ask_question(req: QuestionRequest):
    # Student chat: normal AI chatbot, no vector store/context, only LLM
    messages=[
        {'role': 'system', 'content': "You are a helpful AI assistant for students. Answer any general question, but do not provide platform, course, or module-specific information. If asked about TutorConnect platform details, modules, or courses, reply that you cannot provide that information."},
        {'role': 'user', 'content': req.question}
    ]
    chat_completion = groq_client.chat.completions.create(
        messages=messages, model=settings.GROQ_MODEL
    )
    return {"answer": chat_completion.choices[0].message.content}


# Custom homepage system prompt
HOMEPAGE_SYSTEM_PROMPT = (
    "You are an assistant for the TutorConnect homepage. "
    "Answer questions about the platform, its features, available courses, tutors, ratings, and general site information. "
    "Use the provided context to give accurate information about courses and platform features. "
    "If the user asks about platform ownership, admin access, or claims to be the owner, refuse to answer. "
    "Reply in concise bullet points or numbered lists. "
    "Support both English and Bangla queries. "
    "If the query is in Bangla, reply in Bangla. "
    "Answer naturally without mentioning 'the context'."
)

# Homepage user prompt template
HOMEPAGE_USER_PROMPT = """Use the following information to answer the user's question about TutorConnect platform and courses:

Context:
{context}

User Question:
{question}
"""

from app.vector_store import VectorStore

# Load homepage vector store
# homepage_vector_store = VectorStore()
# homepage_vector_store.load()

class HomepageQuestionRequest(BaseModel):
    question: str

# Request model for module info
class ModuleInfoRequest(BaseModel):
    module_name: str

# Request model for tutor module tasks (assignments, questions, evaluation)
class TutorModuleTaskRequest(BaseModel):
    module_name: str
    message: str

# System prompt for tutor module info
TUTOR_MODULE_SYSTEM_PROMPT = (
    "You are a TutorConnect assistant for tutors. "
    "Help tutors create assignments, questions, and evaluate student answers using the provided module content. "
    "When creating assignments: Format the response in the following structure: "
    "1. Assignment Name\n\n"
    "2. Total Marks\n\n"
    "3. Total Questions\n\n"
    "4. Questions\n\n"
    "5. Solution (if requested)\n\n"
    "6. Rubric (if requested).\n\n"
    "Ensure the response is well-structured, uses headings, bold text, and tables where applicable. "
    "When creating questions: Provide well-structured questions with clear marking criteria. Use markdown formatting for clarity, such as bullet points or numbered lists. "
    "When evaluating answers: Give constructive feedback with specific marks allocation and improvement suggestions. Use tables to show marks allocation and provide detailed explanations. "
    "Use the module content as context to ensure relevance and accuracy. "
    "Reply professionally and be helpful for educational purposes. Ensure the response is easy to read and follows the specified structure. "
    "Support only English. If the query is in Bangla, reply in English."
)

# User prompt template for module info
MODULE_USER_PROMPT = "Tell me about the module: '{module_name}'."

# Endpoint for tutor module-specific info (loads module.json files)
@app.post("/ask-tutor-module")
async def ask_tutor_module_specific(req: TutorModuleTaskRequest):
    # Load module-specific JSON file (e.g., math.json, physics.json)
    vector_store = VectorStore()
    module_file = f"{req.module_name.lower()}.json"
    
    try:
        print(f"DEBUG - Attempting to load module file: {module_file}")
        vector_store.load(module_file)
        print(f"DEBUG - Successfully loaded {module_file}")
        print(f"DEBUG - Vector store contains {len(vector_store.store)} items")
        
        # Check if store is empty
        if not vector_store.store:
            print(f"DEBUG - Vector store is empty for {module_file}")
            return {"answer": f"The '{req.module_name}' module file is empty or contains no data. Please check the file content."}
        
        # Embed the user's message/question
        embed_res = embed.text(
            texts=[req.message],
            model='nomic-embed-text-v1.5',
            task_type='search_query',
            inference_mode=settings.NOMIC_INFERENCE_MODE
        )
        query_vector = embed_res['embeddings'][0]
        print(f"DEBUG - About to query vector store with {len(query_vector)} dimensional vector")
        chunks = vector_store.query(query_vector)[:3]
        print(f"DEBUG - Found {len(chunks)} chunks from query")
        context = '\n\n---\n\n'.join([chunk['text'] for chunk in chunks]) + '\n\n---'
        
        messages=[
            {'role': 'system', 'content': TUTOR_MODULE_SYSTEM_PROMPT},
            {'role': 'user', 'content': req.message + f"\n\nContext from {req.module_name} module:\n{context}"}
        ]
        chat_completion = groq_client.chat.completions.create(
            messages=messages, model=settings.GROQ_MODEL
        )
        return {"answer": chat_completion.choices[0].message.content}
    
    except FileNotFoundError:
        print(f"DEBUG - File not found: {module_file}")
        return {"answer": f"Sorry, I don't have specific information about the '{req.module_name}' module. The module file '{module_file}' was not found. Please check the module name or use the general module info instead."}
    except Exception as e:
        print(f"DEBUG - Exception occurred: {type(e).__name__}: {e}")
        print(f"DEBUG - Module file: {module_file}")
        return {"answer": f"Sorry, there was an error retrieving module-specific information: {str(e)}. Please try again later."}

@app.post("/ask-homepage")
async def ask_homepage_question(req: HomepageQuestionRequest):
    # Load course.json for homepage queries
    vector_store = VectorStore()
    vector_store.load('course.json')
    
    # Debug: Check if vector store loaded properly
    print(f"DEBUG - Vector store data length: {len(vector_store.data) if hasattr(vector_store, 'data') else 'No data attribute'}")
    
    # Embed the user's question
    embed_res = embed.text(
        texts=[req.question],
        model='nomic-embed-text-v1.5',
        task_type='search_query',
        inference_mode=settings.NOMIC_INFERENCE_MODE
    )
    query_vector = embed_res['embeddings'][0]
    chunks = vector_store.query(query_vector)[:3]
    
    # Debug logging with more details
    print(f"DEBUG - Question: {req.question}")
    print(f"DEBUG - Number of chunks found: {len(chunks)}")
    
    # Check if chunks have actual content
    for i, chunk in enumerate(chunks):
        print(f"DEBUG - Chunk {i}: {chunk}")
    
    context = '\n\n---\n\n'.join([chunk['text'] for chunk in chunks]) + '\n\n---'
    user_message = HOMEPAGE_USER_PROMPT.format(context=context, question=req.question)
    
    print(f"DEBUG - Context length: {len(context)}")
    print(f"DEBUG - Full context: {context}")
    print(f"DEBUG - Full user message: {user_message}")
    
    messages=[
        {'role': 'system', 'content': HOMEPAGE_SYSTEM_PROMPT},
        {'role': 'user', 'content': user_message}
    ]
    chat_completion = groq_client.chat.completions.create(
        messages=messages, model=settings.GROQ_MODEL
    )
    response = chat_completion.choices[0].message.content
    print(f"DEBUG - LLM Response: {response}")
    return {"answer": response}

@app.post("/ai-content-detection")
async def ai_content_detection(request: Request):
    body = await request.json()
    response = requests.post(AI_CONTENT_DETECTION_URL, headers=HEADERS, json=body)
    return response.json()

@app.post("/plagiarism-check")
async def plagiarism_check(request: Request):
    body = await request.json()
    response = requests.post(PLAGIARISM_CHECKER_URL, headers=HEADERS, json=body)
    return response.json()