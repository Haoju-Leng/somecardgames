import React, {useState, useEffect, useRef, Fragment} from "react";
import {useNavigate, useParams} from "react-router-dom";
import styled from "styled-components";
import { Pile } from "./pile.js";
import {CardRow, CardRowGap, GameBase} from "./game.js";
import {
    ErrorMessage,
} from "./shared.js";

export const MoveDetail = () => {
    const { id, moveId } = useParams();
    let navigate = useNavigate();

    let [move, setMove] = useState({
        state: {
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
        }
    });

    // Fetch data on load
    useEffect(() => {
        fetch(`/v1/results/moves/${moveId}`)
            .then((res) => res.json())
            .then((data) => {
                setMove(data);
            })
            .catch((err) => console.log(err));
    }, [id, moveId]);

    const onClick = () =>{
        navigate(`/results/${id}`);
    }

    return (
        <GameBase>
            <CardRow>
                <Pile pileName='stack1' cards={move.state.stack1} spacing={0}/>
                <Pile pileName='stack2' cards={move.state.stack2} spacing={0}/>
                <Pile pileName='stack3' cards={move.state.stack3} spacing={0}/>
                <Pile pileName='stack4' cards={move.state.stack4} spacing={0}/>
                <CardRowGap/>
                <button style={{marginTop: 80, fontSize: 20}} onClick={onClick}>Back to Result page!</button>
                <Pile pileName='draw' cards={move.state.draw} spacing={0}/>
                <Pile pileName='discard' cards={move.state.discard} spacing={0}/>
            </CardRow>

            <CardRow>
                <Pile pileName='pile1' cards={move.state.pile1}/>
                <Pile pileName='pile2' cards={move.state.pile2}/>
                <Pile pileName='pile3' cards={move.state.pile3}/>
                <Pile pileName='pile4' cards={move.state.pile4}/>
                <Pile pileName='pile5' cards={move.state.pile5}/>
                <Pile pileName='pile6' cards={move.state.pile6}/>
                <Pile pileName='pile7' cards={move.state.pile7}/>
            </CardRow>

        </GameBase>
    );

};