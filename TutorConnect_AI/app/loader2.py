import os
from tqdm import tqdm
from pdfminer.high_level import extract_text
from nomic import embed
from app.config import settings
from app.splitter import TextSplitter
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB Configuration
MONGO_URI = "mongodb+srv://smsr:smsr2025@cluster0.kf0ayjp.mongodb.net/tutor_connect?retryWrites=true&w=majority&appName=Cluster0"
client = AsyncIOMotorClient(MONGO_URI)
db = client.tutor_connect
vectors_collection = db.vectors

async def process_pdf_and_save_to_db(file_path, filename):
    try:
        # Extract text from the PDF
        print(f"Extracting text from {filename}...")
        text = extract_text(file_path)

        # Split text into chunks
        print("Splitting text into chunks...")
        text_splitter = TextSplitter(chunk_size=512)
        chunks = text_splitter.split(text)
        print(f"Total chunks: {len(chunks)}")

        # Generate embeddings for the chunks
        print("Generating embeddings...")
        embed_res = embed.text(
            texts=chunks,
            model='nomic-embed-text-v1.5',
            task_type='search_document',
            inference_mode=settings.NOMIC_INFERENCE_MODE
        )
        vectors = [
            {'vector': vector, 'text': text} for vector, text in zip(embed_res['embeddings'], chunks)
        ]
        print(f"Generated {len(vectors)} embeddings.")

        # Remove file extension from filename
        filename = os.path.splitext(filename)[0]

        # Save to MongoDB
        document = {
            "filename": filename,
            "uploaded_at": datetime.now(),
            "content": vectors,
            "total_chunks": len(chunks),
            "file_type": "json_upload"
        }
        result = await vectors_collection.insert_one(document)
        print(f"Document saved to MongoDB with ID: {result.inserted_id}")

    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
