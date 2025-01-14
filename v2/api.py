from flask_socketio import SocketIO, emit
from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import chess.engine
import chess
import chess.polyglot
import dotenv
import os

# Carrega as variáveis de ambiente do arquivo .env
dotenv.load_dotenv(dotenv.find_dotenv())

# Caminho para o executável Stockfish
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH")
BOOK_PATH = os.getenv("BOOK_PATH")  # Caminho para o arquivo de livro de aberturas (.bin)


class Stockfish:
    @property
    async def engine(self):
        return await chess.engine.popen_uci(STOCKFISH_PATH)

    @property
    def cache_position(self):
        return self._cache

    def __init__(self):
        self._cache = {}

app = Flask(__name__)
CORS(app)  # Habilita CORS

# Configurações do Flask
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["DEBUG"] = os.getenv("DEBUG") == "True"

stockfish = Stockfish()

# Função para verificar se uma posição FEN está no livro de aberturas
def is_book_move(fen):
    board = chess.Board(fen)
    try:
        with chess.polyglot.open_reader(BOOK_PATH) as reader:
            finder = reader.find_all(board)
            return any(finder)
    except FileNotFoundError:
        print("Arquivo de livro de aberturas não encontrado.")
        return False

# Função assíncrona para análise de posição usando Stockfish
@app.route('/position', methods=["POST"])
async def analyze_position():
    fen = request.json.get('fen')

    # Verifica se a posição é uma jogada de abertura
    #book_move = is_book_move(fen)
    #if book_move:
    #    return jsonify({
    #        "score": None,
    #        "best_move": None,
    #        "message": 'Book Move.'
    #    })

    # Define o tabuleiro usando a posição FEN
    board = chess.Board(fen)
    transport, engine = await stockfish.engine

    if fen not in stockfish.cache_position:
        # Executa a análise
        info = await engine.analysis(
            board=board,
            limit=chess.engine.Limit(time=30),
            multipv=5
        )
        best_move = await info.wait()
        stockfish._cache[fen] = info
        stockfish._cache[fen].info['best_move'] = best_move

    info = {
        "score": stockfish.cache_position[fen].info["score"].relative.score() / 10,
        "best_move": stockfish.cache_position[fen].info['best_move'].move,
        "moves": stockfish.cache_position[fen].info
    }
    return jsonify(info)

if __name__ == "__main__":
    app.run('0.0.0.0', os.getenv('PORT', 5000))
