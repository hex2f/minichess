const {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} = require('discord-interactions');

const minichess = require('./minichess')

module.exports = async (request, response) => {
  if (request.method === 'POST') {
    const signature = request.headers['x-signature-ed25519'];
    const timestamp = request.headers['x-signature-timestamp'];
    const rawBody = JSON.stringify(request.body);

    const isValidRequest = verifyKey(
      rawBody,
      signature,
      timestamp,
      process.env.PUBLIC_KEY
    );

    if (!isValidRequest) {
      console.error('Invalid Request');
      return response.status(401).send({ error: 'Bad request signature' });
    }

    const message = request.body;

    switch (message.type) {
      case 1:
        response.send({
          type: InteractionResponseType.PONG
        })
        return
      case 2:
        const id = Math.random().toString(36).substr(4)
        response.status(200).send({
          type: 4,
          data: {
            embeds: [
              {
                title: `${message.member.nick || message.member.user.username} wants to play MiniChess` + `\n[Get this app at minichess.leah.chat](https://minichess.leah.chat/)`,
                color: 0xffffff
              }
            ],
            components: [
              {
                "type": 1,
                "components": [
                  {
                    "type": 2,
                    "label": "Join",
                    "style": 3,
                    "custom_id": `join:${message.member.user.id}`
                  }
                ]
              }
            ]
          },
        })
        return
      case 3:
        return response.send(await minichess(message))
    }
  } else {
    response.status(400).send({ error: 'Only POST is supported' })
  }
}