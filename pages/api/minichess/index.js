const chess = require('./leahchess');
const p = require('./emojis')


module.exports = async function minichess(interaction) {
  const action = interaction.data.custom_id.split(':')[0]
  switch (action) {
    case 'join':
      return setupBoard(interaction)
    case 'select':
      return selectPiece(interaction)
  }
}

function w(emoji, piece) { return { type: 2, style: 2, custom_id: `select:${piece}`, emoji } }
function b(emoji, piece) { return { type: 2, style: 1, custom_id: `select:${piece}`, emoji } }
function iToChar(i) { return String.fromCharCode(65 + 32 + i) }
function charToI(c) { return c.charCodeAt(0) - 65 - 32 }
function row(row, i) {
  return {
    type: 1,
    components: row.split(' ').map((c, k) => (k+i)%2==0 ? w(p[c], `${iToChar(k)}${5-i}`) : b(p[c], `${iToChar(k)}${5-i}`))
  }
}
function boardToComponents(boardStr) {
  let components = boardStr.split('\n').map(row)
  return components
}

async function setupBoard(interaction) {
  const whiteUser = interaction.data.custom_id.split(':')[1]
  if (whiteUser === interaction.member.user.id) {
    return {
      type: 4,
      data: {
        content: `no friends? :(`,
        flags: 64
      }
    }
  }

  const oldTitle = interaction.message.embeds[0].title
  const whiteName = oldTitle.substr(0, oldTitle.indexOf(' wants to play MiniChess'))
  const newBoard = new chess.Board(5)
  return {
    type: 7,
    data: {
      embeds: [
        {
          title: `${whiteName} - ${interaction.member.nick || interaction.member.user.username}`,
          description: `<@${whiteUser}>, make your move` + `\n[Get this app at minichess.leah.chat](https://minichess.leah.chat/)`,
          color: 0xffffff,
          footer: {
            text: `${newBoard.fenish()} ~${whiteUser}|${interaction.member.user.id}`
          }
        }
      ],
      components: boardToComponents(newBoard.toString())
    }
  }
}

async function selectPiece(interaction) {
   // selection is only ever 2 chars long, chop off everything else to prevent abuse
  const selection = interaction.data.custom_id.split(':')[1].substr(0, 2)

  const [beginning, userStr] = interaction.message.embeds[0].footer.text.split(' ~')
  const [fen, piece] = beginning.split('!')
  const player = fen.split(' ')[1]
  const [whiteId, blackId] = userStr.split('|')

  console.log({
    selection,
    beginning,
    userStr,
    fen,
    piece,
    player,
    whiteId,
    blackId
  })

  // if interaction wasn't invoked by the current player, return without editing the message
  if (player === 'w' && interaction.member.user.id !== whiteId) return { type: 6 }; 
  if (player === 'b' && interaction.member.user.id !== blackId) return { type: 6 };
  if (interaction.message.embeds[0].description && interaction.message.embeds[0].description.includes('has won')) return { type: 6 };

  let engineBoard = chess.from(fen)

  console.log(engineBoard.toString())

  let newBoard
  let description
  let fenSuffix = ''

  // User selected their first piece
  if (!piece) {
    newBoard = boardToComponents(engineBoard.toString())
    fenSuffix = `!${selection}`

    console.log(engineBoard.moves())

    // Only allow the user to select legal moves
    if (engineBoard.moves().some(m => m.startsWith(selection))) {
      newBoard[5-Number(selection[1])].components[charToI(selection[0])].style = 3
      description = `<@${player === 'w' ? whiteId : blackId}> selected ${selection}`
    } else {
      newBoard[5-Number(selection[1])].components[charToI(selection[0])].style = 4
      description = `<@${player === 'w' ? whiteId : blackId}>, ${selection} doesn't have any legal moves.`
      fenSuffix = '' // the move was illegal, don't save it to state 
    }

    return {
      type: 7,
      data: {
        embeds: [
          {
            title: interaction.message.embeds[0].title,
            color: interaction.message.embeds[0].color,
            description: description + `\n[Get this app at minichess.leah.chat](https://minichess.leah.chat/)`,
            footer: {
              text: `${engineBoard.fenish()}${fenSuffix} ~${whiteId}|${blackId}`
            }
          }
        ],
        components: newBoard
      }
    }
  }

  newBoard = boardToComponents(engineBoard.toString())
  
  // If user clicked the same piece again, cancel selection
  // If user already selected a piece last click, move now if legal
  if (selection !== piece) {
    console.log(engineBoard.moves())
    if (engineBoard.moves().includes(`${piece}${selection}`)) {
      console.log(`push ${piece}${selection}`)
      engineBoard.play(`${piece}${selection}`)
      console.log(engineBoard.toString())
      console.log("play"+engineBoard.turn)
      
      newBoard = boardToComponents(engineBoard.toString())
      console.log({
        turn: engineBoard.turn,
        moves: engineBoard.moves(),
        wking: engineBoard.hasKing("white"),
        bking: engineBoard.hasKing("black")
      })
      description = `<@${player === 'w' ? whiteId : blackId}> played ${piece}${selection}. <@${player === 'w' ? blackId : whiteId}>, make your move`
      if (engineBoard.moves().length <= 0 || !engineBoard.hasKing(engineBoard.turn)) {
        description = engineBoard.turn ? `<@${blackId}> has won` : `<@${whiteId}> has won`
      }
    } else {
      description = `<@${player === 'w' ? whiteId : blackId}>, ${piece}${selection} isn't a legal move.`
      newBoard[5-Number(piece[1])].components[charToI(piece[0])].style = 4
      newBoard[5-Number(selection[1])].components[charToI(selection[0])].style = 4
    }
  }

  description += `\n[Get this app at minichess.leah.chat](https://minichess.leah.chat/)`

  return {
    type: 7,
    data: {
      embeds: [
        {
          title: interaction.message.embeds[0].title,
          description,
          color: engineBoard.turn ? 0xffffff : 0x000000,
          footer: {
            text: `${engineBoard.fenish()}${fenSuffix} ~${whiteId}|${blackId}`
          }
        }
      ],
      components: newBoard
    }
  }
}