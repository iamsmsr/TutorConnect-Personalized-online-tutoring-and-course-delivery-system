import json
import numpy as np

VECTOR_STORE_FILEPATH = 'data/vector_store.json'

def cosine_similarity(query_vector, vectors):
    """Calculates the cosine similarity between a query vector and a list of vectors."""
    query_vector = np.array(query_vector)
    vectors = np.array(vectors)
    return np.dot(vectors, query_vector) / (np.linalg.norm(vectors, axis=1) * np.linalg.norm(query_vector))

class VectorStore:
    def __init__(self):
        self.store = []
    
    def add(self, items):
        self.store.extend(items)
    
    def save(self, file_path=VECTOR_STORE_FILEPATH):
        with open(file_path, 'w') as f:
            json.dump(self.store, f)

    def load(self, file_path=VECTOR_STORE_FILEPATH):
        """
        Load vector store from a given file path (default: VECTOR_STORE_FILEPATH).
        If only a filename is provided, search in the data/ directory.
        Usage: vector_store.load() or vector_store.load('courses.json')
        """
        import os
        if not os.path.isabs(file_path) and not file_path.startswith('data/'):
            file_path = os.path.join('data', file_path)
        with open(file_path, 'r') as f:
            self.store = json.load(f)
    
    def load_from_json(self, json_content):
        """
        Load vector store directly from JSON content (dict or list).
        This is used when the JSON content comes from the database or API.
        """
        if isinstance(json_content, (dict, list)):
            self.store = json_content if isinstance(json_content, list) else [json_content]
        else:
            raise ValueError("json_content must be a dict or list")
    
    def query(self, vector, top_k=10):
        vectors = [item['vector'] for item in self.store]
        similarities = cosine_similarity(vector, vectors)
        top_k_indices = np.argsort(similarities)[-top_k:][::-1]
        return [{**self.store[i], 'score': similarities[i]} for i in top_k_indices]
