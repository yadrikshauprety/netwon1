import os
from pdfminer.high_level import extract_text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# -------------------------
# GLOBAL STORAGE
# -------------------------
documents = []
chunks = []
sources = []
vectorizer = None
doc_vectors = None


# -------------------------
# LOAD PDFs
# -------------------------
def load_pdfs(folder="data/laws"):
    for file in os.listdir(folder):
        if file.endswith(".pdf"):
            text = extract_text(os.path.join(folder, file))
            documents.append({
                "text": text,
                "source": file
            })


# -------------------------
# CHUNK TEXT (better)
# -------------------------
def chunk_text(text, size=400, overlap=100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return chunks


# -------------------------
# BUILD VECTOR DB (TF-IDF)
# -------------------------
def build_db():
    global vectorizer, doc_vectors

    for doc in documents:
        doc_chunks = chunk_text(doc["text"])
        for chunk in doc_chunks:
            chunks.append(chunk)
            sources.append(doc["source"])

    vectorizer = TfidfVectorizer(stop_words="english")
    doc_vectors = vectorizer.fit_transform(chunks)


# -------------------------
# INTENT DETECTION
# -------------------------
def classify_input(text):
    text = text.lower().strip()
    greetings = ["hi", "hello", "hey"]

    if text in greetings:
        return "greeting"

    return "query"


# -------------------------
# SEMANTIC SEARCH
# -------------------------
def search_docs(query, top_k=3):
    global vectorizer, doc_vectors

    if vectorizer is None or doc_vectors is None:
        return []

    query_vec = vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, doc_vectors).flatten()

    top_indices = similarities.argsort()[-top_k:][::-1]

    results = []
    for idx in top_indices:
        if similarities[idx] > 0.1:  # threshold
            results.append({
                "text": chunks[idx],
                "source": sources[idx],
                "score": float(similarities[idx])
            })

    return results


# -------------------------
# MAIN HANDLER
# -------------------------
def handle_query(query, topic="Right to Mental Healthcare"):
    intent = classify_input(query)

    # Greeting
    if intent == "greeting":
        return {
            "answer": f"Hi! You're exploring {topic}. Ask me anything about it.",
            "sources": [],
            "intent": intent
        }

    # Retrieve
    docs = search_docs(query)

    # DEBUG (important for you)
    print("\nQUERY:", query)
    print("RETRIEVED DOCS:", len(docs))

    # If docs found → RAG response
    if docs:
        context = "\n\n".join([d["text"] for d in docs])

        answer = f"""
Based on the law:

{context[:500]}...

Let me know if you want a simpler explanation.
"""

        return {
            "answer": answer.strip(),
            "sources": [d["source"] for d in docs],
            "intent": intent
        }

    # Fallback (NO MORE BAD UX)
    else:
        return {
            "answer": f"I couldn't find exact legal text, but I can still help explain {topic}. Try asking more specifically.",
            "sources": [],
            "intent": intent
        }