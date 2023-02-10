/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

import React, {useState, useEffect, useRef} from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Pile } from "./pile.js";

export const CardRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 2em;
`;

export const CardRowGap = styled.div`
  flex-grow: 2;
`;

export const GameBase = styled.div`
  grid-row: 2;
  grid-column: sb / main;
`;

export const Game = () => {
  const { id } = useParams();
  let [state, setState] = useState({
    pile1: [],
    pile2: [],
    pile3: [],
    pile4: [],
    pile5: [],
    pile6: [],
    pile7: [],
    stack1: [],
    stack2: [],
    stack3: [],
    stack4: [],
    draw: [],
    discard: [],
    drawCount: 1
  });

  let [firstTarget, setTarget] = useState(undefined);
  let [firstPile, setFirstPile] = useState(undefined);
  // let [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  let [drawCount, setDrawCount] = useState(3);
  let [update,setUpdate] = useState(0);

  useEffect(() => {
    const getGameState = async () => {
      const response = await fetch(`/v1/game/${id}`);
      const data = await response.json();
      setDrawCount(data.drawCount);
      setState({
        pile1: data.pile1,
        pile2: data.pile2,
        pile3: data.pile3,
        pile4: data.pile4,
        pile5: data.pile5,
        pile6: data.pile6,
        pile7: data.pile7,
        stack1: data.stack1,
        stack2: data.stack2,
        stack3: data.stack3,
        stack4: data.stack4,
        draw: data.draw,
        discard: data.discard
      });
    };
    getGameState();

    document.body.addEventListener("click", () => handleClickOutside());

    return () => document.body.removeEventListener("click", () => handleClickOutside())
  }, [id, update]);

  const onClick = async (ev) => {
    ev.stopPropagation();
    let target = ev.target;
    let up = false;

    if(firstTarget !== undefined){
      let destination = undefined;

      //when pile is empty
      if(ev.target.tagName === 'DIV'){
        destination = target.className.split(' ')[2];
      }else{
        Object.entries(state).forEach(([pile, cards]) => {
          cards.forEach((card) => {
            if(card.suit === target.id.split(":")[0] && card.value === target.id.split(":")[1]){
              destination = pile;
            }
          })
        })
      }
      let move = {
        cards: JSON.stringify(firstTarget),
        src: firstPile,
        dst: destination
      }

      console.log(move);

      setTarget(undefined);
      setFirstPile(undefined);

      let res = await fetch(`/v1/game/${id}`, {
        body: JSON.stringify(move),
        method: "PUT",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
      });
      const data = await res.json();
      if(data.error){
        console.log(data.error);
      }else{
        setUpdate(update + 1);
      }
    }else{
      let cardList = [];
      Object.entries(state).forEach(([pile, cards]) => {
        let found = false;
        cards.forEach((card) => {
          if(card.suit === target.id.split(":")[0] && card.value === target.id.split(":")[1]){
            up = card.up;
            if(up === false){
              setTarget(undefined);
            }else{
              found = true;
              setFirstPile(pile);
            }
          }
          if(found === true){
            cardList.push(card);
          }
        })
      })
      setTarget(cardList);

    }
  };

  const onClickTalon = async (ev) => {
    setTarget(undefined);
    setFirstPile(undefined);

    let cardList = [];
    let move = {};
    if(ev.target.tagName === 'DIV'){
      cardList = state.discard;
      move = {
        cards: JSON.stringify(cardList),
        src: "discard",
        dst: "draw"
      };
    }else {
      for (let i = 0; i < drawCount; i++) {
        cardList.push(state.draw[state.draw.length - 1 - i]);
      }
      move = {
        cards: JSON.stringify(cardList),
        src: "draw",
        dst: "discard"
      };
    }
    console.log(move);
    let res = await fetch(`/v1/game/${id}`, {
      body: JSON.stringify(move),
      method: "PUT",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });
    const data = await res.json();
    if(data.error){
      console.log(data.error);
    }else{
      setUpdate(update + 1);
    }
  };

  const handleClickOutside = () => {
    setTarget(undefined);
    setFirstPile(undefined);
  };

  return (
    <GameBase>
      <CardRow>
        <Pile pileName='stack1' cards={state.stack1} spacing={0} onClick={onClick} />
        <Pile pileName='stack2' cards={state.stack2} spacing={0} onClick={onClick} />
        <Pile pileName='stack3' cards={state.stack3} spacing={0} onClick={onClick} />
        <Pile pileName='stack4' cards={state.stack4} spacing={0} onClick={onClick} />
        <CardRowGap />
        <Pile pileName='draw' cards={state.draw} spacing={0} onClick={onClickTalon} />
        <Pile pileName='discard' cards={state.discard} spacing={0} onClick={onClick} />
      </CardRow>
      <CardRow>
        <Pile pileName='pile1' cards={state.pile1} onClick={onClick} />
        <Pile pileName='pile2' cards={state.pile2} onClick={onClick} />
        <Pile pileName='pile3' cards={state.pile3} onClick={onClick} />
        <Pile pileName='pile4' cards={state.pile4} onClick={onClick} />
        <Pile pileName='pile5' cards={state.pile5} onClick={onClick} />
        <Pile pileName='pile6' cards={state.pile6} onClick={onClick} />
        <Pile pileName='pile7' cards={state.pile7} onClick={onClick} />
      </CardRow>
    </GameBase>
  );
};

Game.propTypes = {};
