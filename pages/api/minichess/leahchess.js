const pieces = {
  pawn:   0b00000100,
  knight: 0b00001000,
  bishop: 0b00010000,
  rook:   0b00100000,
  queen:  0b01000000,
  king:   0b10000000
}

const colors = {
  white: 0b10,
  black: 0b01
}

const Piece = (piece, color) => pieces[piece] | colors[color]

const UCI = (coords) => {
  let x = ['a', 'b', 'c', 'd', 'e'].indexOf(coords[0])
  let y = 5 - Number(coords[1])
  // console.log(coords)
  if (coords.length === 4) {
    let x2 = ['a', 'b', 'c', 'd', 'e'].indexOf(coords[2])
    let y2 = 5 - Number(coords[3])
    return [x, y, x2, y2]
  }

  return [x, y]
}

const xyToUCI = (x, y) => {
  // console.log({x})
  let a = ['a', 'b', 'c', 'd', 'e'][x]
  let b = 5 - y

  return `${a}${b}`
}


const shortPieces = {
  '.': 0,

  p: Piece("pawn", "black"),
  n: Piece("knight", "black"),
  b: Piece("bishop", "black"),
  r: Piece("rook", "black"),
  q: Piece("queen", "black"),
  k: Piece("king", "black"),

  P: Piece("pawn", "white"),
  N: Piece("knight", "white"),
  B: Piece("bishop", "white"),
  R: Piece("rook", "white"),
  Q: Piece("queen", "white"),
  K: Piece("king", "white"),
}
Object.freeze(shortPieces)

const ShortPieceName = (piece) => Object.keys(shortPieces).find(key => shortPieces[key] === piece)
const PieceName = (piece) => Object.keys(pieces).find(key => pieces[key] === (piece &~ 0b11))

const PieceColor = (piece) =>  Object.keys(colors).find(key => (piece & colors[key]) === colors[key])

const IsBlack = (piece) =>  (piece & colors['black']) === colors['black']
const IsWhite = (piece) =>  (piece & colors['white']) === colors['white']

class Board {
  #width
  #height
  #cells
  constructor(width = 5, height = 5, turn = "white") {
    this.#width = width
    this.#height = height
    this.turn = turn
    this.#cells = Array(height).fill().map(()=>Array(width).fill(0))

    this.put('a5', 'k')
    this.put('b5', 'q')
    this.put('c5', 'b')
    this.put('d5', 'n')
    this.put('e5', 'r')

    this.put('a4', 'p')
    this.put('b4', 'p')
    this.put('c4', 'p')
    this.put('d4', 'p')
    this.put('e4', 'p')

    this.put('a2', 'P')
    this.put('b2', 'P')
    this.put('c2', 'P')
    this.put('d2', 'P')
    this.put('e2', 'P')

    this.put('a1', 'R')
    this.put('b1', 'N')
    this.put('c1', 'B')
    this.put('d1', 'Q')
    this.put('e1', 'K')

    // console.log(this.#cells)
  }

  at (coords) {
    const [x,y] = UCI(coords)
    if (isNaN(x) || isNaN(y) || x < 0 || x >= this.#width || y < 0 || y >= this.#height) { return -1 }
    return this.#cells[y][x]
  }

  put (coords, piece) {
    const [x,y] = UCI(coords)

    if (typeof(piece) === 'string') {
      piece = shortPieces[piece]
    }
    
    this.#cells[y][x] = piece
  }

  play (uci) {
    if (!this.moves().includes(uci)) throw new Error(`${uci} isn't a valid move`)
    const [x1,y1,x2,y2] = UCI(uci)
    this.#cells[y2][x2] = this.#cells[y1][x1]
    this.#cells[y1][x1] = shortPieces['.']
    if ((this.#cells[y2][x2] &~ 0b11) === pieces.pawn) {
      if (y2 === 0 && IsWhite(this.#cells[y2][x2])) {
        this.#cells[y2][x2] = Piece('queen', 'white')
      } else if (y2 === this.#height - 1 && IsBlack(this.#cells[y2][x2])) {
        this.#cells[y2][x2] = Piece('queen', 'black')
      }
    }
    this.turn = this.turn === 'white' ? 'black' : 'white'
  }

  hasKing(color) {
    for (let y = 0; y < this.#height; y++) {
      for (let x = 0; x < this.#width; x++) {
        let piece = this.#cells[y][x]
        if (piece === shortPieces['.']) continue
        if (color === 'white' && IsBlack(piece)) continue
        if (color === 'black' && IsWhite(piece)) continue
        if ((piece &~ 0b11) === pieces.king) {
          return true
        }
      }
    }

    return false
  }

  moves () {
    let moves = []

    for (let y = 0; y < this.#height; y++) {
      for (let x = 0; x < this.#width; x++) {
        let piece = this.#cells[y][x]
        if (piece === shortPieces['.']) continue
        if (this.turn === 'white' && IsBlack(piece)) continue
        if (this.turn === 'black' && IsWhite(piece)) continue
        moves = [...moves, ...(this[`investigate_${PieceName(piece)}`](x, y, piece))]
      }
    }

    // lol
    return moves.filter(move => move.length === 4)
  }

  investigate_pawn(x, y, piece) {
    let sqName = xyToUCI(x, y)
    // console.log(sqName)
    let color = PieceColor(piece)
    let moves = []

    const dir = this.turn === 'white' ? -1 : 1

    if (y+dir < 0 || y+dir > this.#height) { return [] }

    if (this.at(xyToUCI(x, y+dir)) === shortPieces['.']) { moves.push(xyToUCI(x, y+dir)) }
    // console.log(x, y, xyToUCI(x, y+dir), UCI(x,y+dir), this.at(xyToUCI(x, y+dir)))
    if (x > 0 && this.at(xyToUCI(x-1, y+dir)) !== shortPieces['.'] &&
        PieceColor(this.at(xyToUCI(x-1, y+dir))) !== color) { moves.push(xyToUCI(x-1, y+dir)) }
    if (x < this.#width-1 && this.at(xyToUCI(x+1, y+dir)) !== shortPieces['.'] &&
        PieceColor(this.at(xyToUCI(x+1, y+dir))) !== color) { moves.push(xyToUCI(x+1, y+dir)) }

    return moves.map(move => sqName + move)
  }

  investigate_dirs(dirs, px, py, piece) {
    let sqName = xyToUCI(px, py)
    let color = PieceColor(piece)
    let moves = []
    for (const dir of dirs) {
      for (
        let bx = px + dir[0], by = py + dir[1];
        bx >= 0 && bx < this.#width && by >= 0 && by < this.#height;
        bx += dir[0], by += dir[1]
      ) {
        if (PieceColor(this.#cells[by][bx]) !== color) {
          moves.push(xyToUCI(bx, by))
          if (this.#cells[by][bx] !== shortPieces['.']) { break }
        } else { break }
      }
    }
    return moves.map(move => sqName + move)
  }

  investigate_rook(px, py, piece) {
    return this.investigate_dirs([[1, 0],[-1, 0], [0, 1], [0, -1]], px, py, piece)
  }
  investigate_knight(x, y, piece) {
    let sqName = xyToUCI(x, y)
    let moves = [
      ...this.investigate_at(x+1,y+2,piece),
      ...this.investigate_at(x-1,y+2,piece),
      ...this.investigate_at(x+1,y-2,piece),
      ...this.investigate_at(x-1,y-2,piece),
      ...this.investigate_at(x+2,y+1,piece),
      ...this.investigate_at(x+2,y-1,piece),
      ...this.investigate_at(x-2,y+1,piece),
      ...this.investigate_at(x-2,y-1,piece)
    ]

    return moves.map(move => sqName + move)
  }
  investigate_bishop(x, y, piece) {
    return this.investigate_dirs([[1, 1],[-1, 1], [1, -1], [-1, -1]], x, y, piece)
  }
  investigate_queen(x, y, piece) {
    return [
      ...this.investigate_dirs([[1, 0],[-1, 0], [0, 1], [0, -1]], x, y, piece),
      ...this.investigate_dirs([[1, 1],[-1, 1], [1, -1], [-1, -1]], x, y, piece)
    ]
  }
  investigate_king(x, y, piece) {
    let sqName = xyToUCI(x, y)
    let moves = [
      ...this.investigate_at(x+1,y,piece),
      ...this.investigate_at(x-1,y,piece),
      ...this.investigate_at(x,y+1,piece),
      ...this.investigate_at(x,y-1,piece),
      ...this.investigate_at(x+1,y+1,piece),
      ...this.investigate_at(x+1,y-1,piece),
      ...this.investigate_at(x-1,y+1,piece),
      ...this.investigate_at(x-1,y-1,piece)
    ]
    
    return moves.map(move => sqName + move)
  }

  investigate_at(x, y, piece) {
    let moves = []
    let color = PieceColor(piece)
    if (
      x >= 0 &&
      y >= 0 &&
      x < this.#width &&
      y < this.#height &&
      PieceColor(this.#cells[y][x]) !== color
    ) {
      moves.push(xyToUCI(x, y))
    }
    return moves
  }

  toString() {
    let str = ''
    for (let y = 0; y < this.#width; y++) {
      let line = []
      for (let x = 0; x < this.#height; x++) {
        line.push(ShortPieceName(this.#cells[y][x]))
      }
      str += `${line.join(' ')}`
      if (y < this.#width - 1) { str += '\n' }
    }
    return str
  }

  fenish () {
    let fenish = ''
    for (let y = 0; y < this.#height; y++) {
      let space = 0
      for (let x = 0; x < this.#width; x++) {
        let piece = this.#cells[y][x]
        if (space > 0 && piece > shortPieces['.']) {
          fenish += `${space}`
          space = 0
        }
        if (piece == shortPieces['.']) {
          space++
          if (space > 0 && x >= this.#width - 1) {
            fenish += `${space}`
          }
        } else {
          fenish += ShortPieceName(piece)
        }
      }
      if(y < this.#height - 1) fenish += '/'
    }
    fenish += ` ${this.turn.substr(0,1)}`
    return fenish
  }

  apply (fenish) {
    this.#cells = Array(this.#height).fill().map(()=>Array(this.#width).fill(0))
    let ranks = fenish.split(' ')[0].split('/')
    for (let y = 0; y < this.#height; y++) {
      let rank = ranks[y]
      let readIndex = 0
      for (let x = 0; x < this.#width; x++) {
        let char = rank[readIndex++]
        if (!isNaN(char)) {
          x += Number(char) - 1
          continue
        }
        this.#cells[y][x] = shortPieces[char]
      }
    }
    this.turn = fenish.split(' ')[1] === 'w' ? 'white' : 'black'
  }
}

const from = (fenish, width, height) => {
  let board = new Board(width, height)
  board.apply(fenish)
  return board
}

module.exports = {
  Board,
  from,
  pieces,
  colors,
  Piece,
  UCI,
  xyToUCI,
  shortPieces,
  ShortPieceName,
  PieceName,
  PieceColor,
  IsBlack,
  IsWhite
}