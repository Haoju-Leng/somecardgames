/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

const Joi = require("joi");
const {
  initialState,
  shuffleCards,
  filterGameForProfile,
  filterMoveForResults,
} = require("../../solitare.cjs");

module.exports = (app) => {
  /**
   * Create a new game
   *
   * @param {req.body.game} Type of game to be played
   * @param {req.body.color} Color of cards
   * @param {req.body.draw} Number of cards to draw
   * @return {201 with { id: ID of new game }}
   */
  app.post("/v1/game", async (req, res) => {
    if (!req.session.user)
      return res.status(401).send({ error: "unauthorized" });

    // Schema for user info validation
    const schema = Joi.object({
      game: Joi.string().lowercase().required(),
      color: Joi.string().lowercase().required(),
      draw: Joi.any(),
    });
    // Validate user input
    try {
      const data = await schema.validateAsync(req.body, { stripUnknown: true });
      // Set up the new game
      let newGame = {
        owner: req.session.user._id,
        active: true,
        cards_remaining: 52,
        color: data.color,
        game: data.game,
        score: 0,
        start: Date.now(),
        winner: "",
        state: [],
      };
      console.log(newGame.start, 'game');
      switch (data.draw) {
        case "Draw 1":
          newGame.drawCount = 1;
          break;
        case "Draw 3":
          newGame.drawCount = 3;
          break;
        default:
          newGame.drawCount = 1;
      }
      console.log(newGame);
      // Generate a new initial game state
      newGame.state = initialState();
      let game = new app.models.Game(newGame);


      try {
        await game.save();
        const query = { $push: { games: game._id } };
        // Save game to user's document too
        await app.models.User.findByIdAndUpdate(req.session.user._id, query);
        res.status(201).send({ id: game._id });
      } catch (err) {
        console.log(`Game.create save failure: ${err}`);
        res.status(400).send({ error: "failure creating game" });
        // TODO: Much more error management needs to happen here
      }
    } catch (err) {
      console.log(err);
      const message = err.details[0].message;
      console.log(`Game.create validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  /**
   * Fetch game information
   *
   * @param (req.params.id} Id of game to fetch
   * @return {200} Game information
   */
  app.get("/v1/game/:id", async (req, res) => {
    try {
      let game = await app.models.Game.findById(req.params.id);
      if (!game) {
        res.status(404).send({ error: `unknown game: ${req.params.id}` });
      } else {
        const state = game.state.toJSON();
        let results = filterGameForProfile(game);
        results.start = Date.parse(results.start);
        results.drawCount = game.drawCount;
        results.cards_remaining =
          52 -
          (state.stack1.length +
            state.stack2.length +
            state.stack3.length +
            state.stack4.length);
        // Do we need to grab the moves
        //if (req.query.moves === "") {
          const moves = await app.models.Move.find({ game: req.params.id }).lean();
          state.moves = moves.map((move) => filterMoveForResults(move));
       // }
        res.status(200).send(Object.assign({}, results, state));
      }
    } catch (err) {
      console.log(`Game.get failure: ${err}`);
      res.status(404).send({ error: `unknown game: ${req.params.id}` });
    }
  });

  /**
   * Fetch moeve information
   *
   * @param (req.params.id} Id of move to fetch
   * @return {200} Game information
   */
  app.get("/v1/results/moves/:id", async  (req, res) => {
    try{
      let move = await app.models.Move.findById(req.params.id).lean();
      if (!move) {
        res.status(404).send({ error: `unknown move: ${req.params.id}` });
      }else{
        res.status(200).send(move);
      }
    }catch(err){
      console.log(`Move.get failure: ${err}`);
      res.status(404).send({ error: `unknown move: ${req.params.id}` });
    }
  });

  let validateMoveLogic = async (currentState, requestedMove) => {
    const valueMap = {
      'ace': 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      '10': 10,
      'jack': 11,
      'queen': 12,
      'king': 13
    }

    let src = requestedMove.src;
    let dst = requestedMove.dst;
    let startCards = JSON.parse(requestedMove.cards);

    //moving to the same pile
    if(src === dst){
      return new Error('moving to the same pile');
    }

    if(startCards.length === 0){
      return new Error('no cards being selected');
    }

    //from one of the seven tableau piles to another of the seven tableau piles
    let srcSuit = startCards[0].suit;
    let srcValue = valueMap[startCards[0].value];

    //move card to foundation
    if(dst === 'stack1' || dst === 'stack2' || dst === 'stack3' || dst === 'stack4'){

      if(startCards.length > 1){
        return new Error('More than one card trying to move to foundations');
      }
      if(currentState[dst].length === 0){
        if(srcValue === 1){
          return true;
        }else{
          return new Error('Not Ok to move to foundation');
        }
      }else {
        let dstSuit = currentState[dst][currentState[dst].length - 1].suit;
        let dstValue = valueMap[currentState[dst][currentState[dst].length - 1].value];
        if (srcSuit !== dstSuit || srcValue - dstValue !== 1) {
          return new Error('Not Ok to move to foundation');
        }
      }
    }else if((src === 'draw' && dst === 'discard') || (src === 'discard' && dst === 'draw')){
      return true;

    //from one of the seven tableau piles to another of the seven tableau piles
    }else {
      //if not from pile 1-7 to pile 1-7, length > 1 return false
      if (!((src === 'pile1' || src === 'pile2' || src === 'pile3' || src === 'pile4' || src === 'pile5' || src === 'pile6' || src === 'pile7')
          && (dst === 'pile1' || dst === 'pile2' || dst === 'pile3' || dst === 'pile4' || dst === 'pile5' || dst === 'pile6' || dst === 'pile7'))) {
        if (startCards.length > 1) {
          return new Error('number of cards greater than 1');
        }
      }
      if (currentState[dst].length === 0){
        if(srcValue === 13){
          return true;
        }else{
          return new Error('Only King can move to an empty pile');
        }

      }


      let dstSuit = currentState[dst][currentState[dst].length - 1].suit;
      let dstValue = valueMap[currentState[dst][currentState[dst].length - 1].value];

      if(dstValue - srcValue !== 1){
        return new Error('Value of card is wrong');
      }

      if(((srcSuit === 'spades' || srcSuit === 'clubs') && (dstSuit === 'spades' || dstSuit === 'clubs'))
      || ((srcSuit === 'hearts' || srcSuit === 'diamonds') && (dstSuit === 'hearts' || dstSuit === 'diamonds'))){
        return new Error('suit of cards is wrong');
      }
    }
    return true;
  };

  let validateMove = async (currentState, requestedMove) => {
    let validation = await validateMoveLogic(currentState, requestedMove);
    if(validation === true){
      let cardsToMove = JSON.parse(requestedMove.cards);
      let src = requestedMove.src;
      let dst = requestedMove.dst;
      let newState ={
        ...currentState
      };
      for (let i = 0;i < cardsToMove.length;i++){
        newState[src].pop();
        cardsToMove[i].up = true;
        newState[dst].push(cardsToMove[i]);
      }
      if(newState[src].length > 0 && src !== 'draw'){
        newState[src][newState[src].length - 1].up = true;
      }
      if(src === 'discard' && dst === 'draw'){
        newState[dst].forEach(card => card.up = false);
        newState[dst].reverse();
      }

      return newState;
    }
    return validation;
  };

  app.put("/v1/game/:id", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).send({error: "unauthorized"});
    }

    try {
      let game = await app.models.Game.findById(req.params.id);
      if (!game) {
        res.status(404).send({ error: `unknown game: ${req.params.id}` });
      } else {
        if(game.owner.toString() !== req.session.user._id){
          return res.status(401).send({error: "unauthorized"});
        }
        const state = game.state.toJSON();
        let valid = await validateMove(state, req.body);
        if(valid instanceof Error){
          res.status(400).send({ error: `${valid}`});
        }else{
          //update db with new state
          let src = req.body.src;
          let dst = req.body.dst;
          game.state[src] = valid[src];
          game.state[dst] = valid[dst];
          game.moves += 1;

          const valueMap = {
            'ace': 'Ace',
            '2': 'Two',
            '3': 'Three',
            '4': 'Four',
            '5': 'Five',
            '6': 'Six',
            '7': 'Seven',
            '8': 'Eight',
            '9': 'Nine',
            '10': 'Ten',
            'jack': 'Jack',
            'queen': 'Queen',
            'king': 'King'
          }
          let startCard = valueMap[JSON.parse(req.body.cards)[0].value];

          let newMove = {
            user: req.session.user._id,
            game: game._id,
            start: Date.now(),
            player: req.session.user.username,
            move: `${startCard} from ${src} to ${dst}`,
            state: game.state
          };
          let move = new app.models.Move(newMove);

          try {
            await game.save();
            await move.save();
            res.status(201).send({state: valid});
          }catch (error) {
            console.log(error);
            res.status(404).send({error: 'failed to save new state into DB'});
          }
        }
      }
    } catch (err) {
      console.log(`Game.get failure: ${err}`);
      res.status(404).send({ error: `unknown game: ${req.params.id}` });
    }

  });

  // Provide end-point to request shuffled deck of cards and initial state - for testing
  app.get("/v1/cards/shuffle", (req, res) => {
    res.send(shuffleCards(false));
  });
  app.get("/v1/cards/initial", (req, res) => {
    res.send(initialState());
  });
};
