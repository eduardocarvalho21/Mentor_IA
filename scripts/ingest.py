import os
import psycopg2
import ollama  # Importamos a biblioteca do Ollama
from pypdf import PdfReader
from dotenv import load_dotenv

# Carrega variáveis do .env.local (onde está a senha do banco)
load_dotenv(".env.local") 
# Se não achar, tenta o .env normal
load_dotenv() 

# Configuração
DB_URL = os.getenv("DATABASE_URL")

# Verifica se a URL do banco foi carregada
if not DB_URL:
    print("❌ Erro: DATABASE_URL não encontrada no arquivo .env.local")
    exit()

def get_embedding(text):
    # Remove quebras de linha para melhorar o vetor
    text = text.replace("\n", " ")
    
    # Chama o Ollama rodando localmente na porta 11434
    response = ollama.embeddings(model='nomic-embed-text', prompt=text)
    return response['embedding']

def process_pdf(pdf_path):
    print(f"📖 Lendo {pdf_path}...")
    
    if not os.path.exists(pdf_path):
        print(f"❌ Arquivo não encontrado: {pdf_path}")
        return

    reader = PdfReader(pdf_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text()
    
    print(f"📄 Total de caracteres extraídos: {len(full_text)}")

    # Chunking simples (quebra a cada 1000 caracteres para pegar mais contexto)
    chunk_size = 1000
    chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
    
    # Conexão com Banco
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
    except Exception as e:
        print(f"❌ Erro ao conectar no banco: {e}")
        return
    
    try:
        # 1. Salvar o Recurso (Documento Pai) - Tabela 'resources'
        # Se sua tabela não tiver 'resources', comente este bloco e ajuste o insert abaixo
        print("💾 Salvando referência do documento...")
        cursor.execute(
            "INSERT INTO resources (content, title, type) VALUES (%s, %s, %s) RETURNING id",
            ("Conteudo completo do PDF (resumo)...", pdf_path, "pdf")
        )
        resource_id = cursor.fetchone()[0]
        
        # 2. Gerar Embeddings e Salvar Chunks - Tabela 'embeddings'
        print(f"🧠 Gerando vetores para {len(chunks)} pedaços com Ollama...")
        
        for i, chunk in enumerate(chunks):
            # Gera o vetor usando o Ollama
            vector = get_embedding(chunk)
            
            # Salva no banco
            cursor.execute(
                "INSERT INTO embeddings (resource_id, content, embedding) VALUES (%s, %s, %s)",
                (resource_id, chunk, vector)
            )
            print(f"   Chunk {i+1}/{len(chunks)} salvo.")
        
        conn.commit()
        print("\n✅ Sucesso! PDF vetorizado e salvo no banco.")
        
    except Exception as e:
        print("\n❌ Erro durante a gravação:", e)
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # Pega o caminho absoluto da pasta onde este script (ingest.py) está
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Junta o caminho da pasta com o nome do arquivo
    arquivo_pdf = os.path.join(current_dir, "Artigo_Tcc_Controle_De_Medicamentos_2025.docx.pdf")
    
    process_pdf(arquivo_pdf)