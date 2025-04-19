import os
from typing import List, Dict, Any
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set Google API key
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

def initialize_components():
    """Initialize all required components for the RAG system."""
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.3, max_tokens=500)
    return embeddings, llm

def load_and_process_document(pdf_path: str):
    """Load and process the PDF document."""
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    texts = text_splitter.split_documents(documents)
    return texts

def create_rag_chain(embeddings, llm, texts):
    """Create the RAG chain with the given components."""
    # Create vector store
    vectorstore = FAISS.from_documents(documents=texts, embedding=embeddings)
    
    # Create retriever
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )
    
    # Define system prompt
    system_prompt = (
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer, say that you "
        "don't know. Use three sentences maximum and keep the "
        "answer concise.\n\n{context}"
    )
    
    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])
    
    # Create chains
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    return rag_chain

def main():
    # Initialize components
    embeddings, llm = initialize_components()
    
    # Load and process document
    pdf_path = os.path.join(os.path.dirname(__file__), "Atlas-of-the-Heart-by-by-Bren-23.pdf")
    texts = load_and_process_document(pdf_path)
    
    # Create RAG chain
    rag_chain = create_rag_chain(embeddings, llm, texts)
    
    # Example query
    response = rag_chain.invoke({"input": "What is the main topic of the document?"})
    print("\nQuestion: What is the main topic of the document?")
    print(f"Answer: {response['answer']}")
    
    # Interactive question-answering loop
    while True:
        question = input("\nEnter your question (or 'quit' to exit): ")
        if question.lower() == 'quit':
            break
        
        response = rag_chain.invoke({"input": question})
        print(f"\nAnswer: {response['answer']}")

if __name__ == "__main__":
    main()
