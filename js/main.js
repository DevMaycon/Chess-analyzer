document.addEventListener("DOMContentLoaded", function() {

    function onDragStart(source, piece) {
        // Impede que o jogador mova as peças do oponente ou que faça movimentos após o fim do jogo
        if (chess.game_over() || 
            (chess.turn() === "w" && piece.startsWith("b")) || 
            (chess.turn() === "b" && piece.startsWith("w"))) {
            return false;
        }
        document.body.classList.add('no-scroll');
    }

    function onDrop(source, target) {
        // Tente fazer o movimento
        const move = chess.move({
            from: source,
            to: target,
            promotion: "q" // Define a promoção para rainha automaticamente
        });

        // Verifica se o movimento é válido
        if (move === null) return "snapback";

        updateStatus();    // Atualiza o status do jogo
        updateUciHistory(source, target);
        document.body.classList.remove('no-scroll');
    }

    async function onSnapEnd() {
        // Atualiza o tabuleiro para refletir a posição após o movimento
        fen = chess.fen()
        chessboard.position(fen);
        return await get_move_evaluation(fen)
    }

    function updateStatus() {
        if (chess.game_over()) {
            alert("Fim de Jogo!");
        }
    }

    function updateUciHistory(source, target) {
        chessboard.uciHistory.push(`${source}${target}`)
    }

    // Configuração do tabuleiro
    const chessboardConfig = {
        draggable: true,
        position: "start",
        sparePieces: false,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };

    function movePiece(target) {
        thisMove = chess.move(target);
        chessboard.move(`${thisMove.from}-${target}`);
    }

    async function get_move_evaluation(actualFen) {
        /*let evaluation = await fetch('http://localhost:5000/position', {
            method: 'POST',
            body: JSON.stringify({fen: actualFen}),
            headers: {
                "Content-Type": "application/json"
            }
        })*/
        let evaluationJson = {message: 'Book Move.'};//await evaluation.json();
        if (await evaluationJson.message == "Book Move.") {
            openingHtml = document.getElementsByClassName('chess-chatbot-opening')[0];
            console.log(openingHtml);

            //https://explorer.lichess.ovh/masters?play=e2e4,e7e6
            let movesString = ""
            chessboard.uciHistory.forEach((move, enumeration) => {
            if (chessboard.uciHistory.length > enumeration+1) {
                movesString += `${move},`;
            } else {
                console.log(enumeration)
                movesString += `${move}`;
            }
            });
            
            let openingUrl = `https://explorer.lichess.ovh/masters?play=${movesString}`
            let openingName = fetch(openingUrl).then((res) => {
                res.json().then((res) => {
                    openingHtml.innerHTML = `<p>${res["opening"]["name"]}</p>`
                    console.log(openingHtml);
                })
            })
            console.log(openingUrl, openingName)
        }
    }

    // Inicializa o tabuleiro e a lógica
    chessboard = Chessboard("chess-board", chessboardConfig);
    chessboard.movePiece = movePiece
    chessboard.uciHistory = []
    chessboard.resize()

    chess = new Chess();    
    chess.load(chessboardConfig.position)

    new ResizeObserver(chessboard.resize).observe(
        document.getElementById('chess-board')
    )
});

