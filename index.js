const chess = require('./pages/api/minichess/leahchess')
const board = new chess.Board(5)
board.turn = 'black'
console.log(board.toString())
const recon = chess.from(board.fenish())
console.log(recon.moves())
console.log(board.toString())