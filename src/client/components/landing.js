/* Copyright G. Hemingway, @2022 - All rights reserved */
"use strict";

import React, {Fragment} from "react";
import styled from "styled-components";

const LandingBase = styled.div`
  display: flex;
  justify-content: center;
  grid-area: main;
`;

export const Landing = () => (
    <LandingBase>
      <h1>This is my landing page!</h1>
        <ul>
            <li>3. Enable modification of a user's profile.</li>
            <li>4. Fully working "results" page</li>
            <li>5. Each move is click-able and renders the state of the game after the completion of the clicked move</li>
        </ul>
    </LandingBase>
)