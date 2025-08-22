from fastapi import FastAPI, Request, File, UploadFile, HTTPException, WebSocket
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.vector_store import VectorStore
from app.rag import answer_question, USER_PROMPT, settings, groq_client
from nomic import embed
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
import json
from app.plagiarism_ai_config import PLAGIARISM_CHECKER_URL, AI_CONTENT_DETECTION_URL, HEADERS
import requests
from bson import ObjectId
from app.loader2 import process_pdf_and_save_to_db
import asyncio

app = FastAPI()
vector_store = VectorStore()

# MongoDB Configuration
MONGO_URI = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/tutor_connect?retryWrites=true&w=majority&appName=Cluster0"
client = AsyncIOMotorClient(MONGO_URI)
db = client.tutor_connect
vectors_collection = db.vectors

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

# Serve module.html for /module
@app.get("/module")
async def serve_module():
    return FileResponse("frontend/module.html")


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

# Upload endpoint for JSON files
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Only JSON files are allowed.")
        
        # Read and parse the uploaded file
        content = await file.read()
        data = json.loads(content)

        # Accept both single objects and arrays
        if not isinstance(data, (list, dict)):
            raise HTTPException(status_code=400, detail="Uploaded file must contain valid JSON data.")
        
        if isinstance(data, list) and len(data) == 0:
            raise HTTPException(status_code=400, detail="JSON file is empty.")

        # Create a single document containing the entire JSON file
        document = {
            "filename": file.filename,
            "uploaded_at": datetime.now(),
            "content": data,  # Store the entire JSON content as-is
            "total_items": len(data) if isinstance(data, list) else 1,
            "file_type": "json_upload"
        }

        # Insert as one single document into MongoDB vectors collection
        result = await vectors_collection.insert_one(document)
        
        return {
            "message": f"File '{file.filename}' uploaded successfully as a single document!",
            "filename": file.filename,
            "document_id": str(result.inserted_id),
            "total_items": document["total_items"],
            "collection": "vectors",
            "database": "tutor_connect"
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file. Please check the file format.")
    except Exception as e:
        # Log the error for debugging
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred while uploading: {str(e)}")

@app.get("/get-modules")
async def get_modules():
    try:
        # Fetch all documents from the vectors collection for both JSON and PDF uploads
        modules = await vectors_collection.find({"file_type": {"$in": ["json_upload", "pdf_upload"]}}).to_list(length=None)

        # Transform ObjectId to string for JSON serialization
        for module in modules:
            module["_id"] = str(module["_id"])

        return modules
    except Exception as e:
        print(f"Error fetching modules: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching modules.")

@app.get("/get-module/{module_id}")
async def get_module(module_id: str):
    try:
        # Fetch the module by its ID
        module = await vectors_collection.find_one({"_id": ObjectId(module_id)})

        if not module:
            raise HTTPException(status_code=404, detail="Module not found.")

        # Return only the original content, not the MongoDB document wrapper
        return module["content"]
    except Exception as e:
        print(f"Error fetching module: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching the module.")

# Endpoint to handle PDF uploads
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Save the uploaded file temporarily
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(await file.read())

        # Trigger the PDF processing function
        await process_pdf_and_save_to_db(temp_file_path, file.filename)

        # Remove the temporary file
        os.remove(temp_file_path)

        return {"message": "PDF processed and saved successfully."}

    except Exception as e:
        return HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# WebSocket endpoint for real-time progress updates
@app.websocket("/progress")
async def progress_updates(websocket: WebSocket):
    await websocket.accept()
    try:
        for progress_message in ["Extracting text...", "Splitting text into chunks...", "Generating embeddings...", "Saving to database..."]:
            await websocket.send_text(progress_message)
            await asyncio.sleep(1)  # Simulate processing time
        await websocket.send_text("Processing complete.")
    except Exception as e:
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        await websocket.close()

from typing import Optional, Union, List, Dict, Any

class ProcessModuleRequest(BaseModel):
    module_name: Optional[str] = None
    json_content: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
    query: Optional[str] = None

@app.post("/process-module")
async def process_module(req: ProcessModuleRequest):
    try:
        # If JSON content is provided directly, use it
        if req.json_content:
            json_content = req.json_content
            print("DEBUG - Using provided JSON content directly.")
        elif req.module_name:
            # Otherwise, fetch the JSON content from the database using the module name
            module = await vectors_collection.find_one({"filename": req.module_name})
            if not module:
                raise HTTPException(status_code=404, detail="Module not found.")
            json_content = module["content"]
            print("DEBUG - Fetched JSON content from the database.")
        else:
            raise HTTPException(status_code=400, detail="Either module_name or json_content must be provided.")

        # Load the JSON content into the vector store
        vector_store = VectorStore()
        
        # Check if the JSON content is already embedded (has 'vector' field) or raw content
        if isinstance(json_content, list) and len(json_content) > 0:
            # Check if first item has 'vector' field (pre-embedded data like local files)
            if 'vector' in json_content[0]:
                print("DEBUG - Loading pre-embedded content into vector store")
                vector_store.load_from_json(json_content)
            else:
                # Raw content from database - need to create embeddings
                print("DEBUG - Converting raw JSON content to embedded format")
                embedded_items = []
                for item in json_content:
                    # Convert item to text for embedding
                    text_content = json.dumps(item, ensure_ascii=False)
                    
                    # Generate embedding
                    embed_res = embed.text(
                        texts=[text_content],
                        model='nomic-embed-text-v1.5',
                        task_type='search_document',
                        inference_mode=settings.NOMIC_INFERENCE_MODE
                    )
                    
                    # Create embedded item
                    embedded_item = {
                        'vector': embed_res['embeddings'][0],
                        'text': text_content
                    }
                    embedded_items.append(embedded_item)
                
                vector_store.load_from_json(embedded_items)
        elif isinstance(json_content, dict):
            # Single object - convert to embedded format
            print("DEBUG - Converting single JSON object to embedded format")
            text_content = json.dumps(json_content, ensure_ascii=False)
            
            # Generate embedding
            embed_res = embed.text(
                texts=[text_content],
                model='nomic-embed-text-v1.5',
                task_type='search_document',
                inference_mode=settings.NOMIC_INFERENCE_MODE
            )
            
            # Create embedded item
            embedded_item = {
                'vector': embed_res['embeddings'][0],
                'text': text_content
            }
            vector_store.load_from_json([embedded_item])
        
        print("DEBUG - Loaded JSON content into vector store.")

        # Use the provided query or default example query
        query = req.query if req.query else "Example query for RAG process"
        embed_res = embed.text(
            texts=[query],
            model='nomic-embed-text-v1.5',
            task_type='search_query',
            inference_mode=settings.NOMIC_INFERENCE_MODE
        )
        query_vector = embed_res['embeddings'][0]
        chunks = vector_store.query(query_vector)[:3]
        context = '\n\n---\n\n'.join([chunk['text'] for chunk in chunks]) + '\n\n---'

        # Generate a response using the context
        messages = [
            {'role': 'system', 'content': TUTOR_MODULE_SYSTEM_PROMPT},
            {'role': 'user', 'content': f"{query}\n\nContext:\n{context}"}
        ]
        chat_completion = groq_client.chat.completions.create(
            messages=messages, model=settings.GROQ_MODEL
        )
        response = chat_completion.choices[0].message.content

        return {"answer": response}

    except Exception as e:
        print(f"Error processing module: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the module: {str(e)}")