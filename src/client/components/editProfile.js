import React, { useState, useEffect } from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
    ErrorMessage,
    FormBase,
    FormInput,
    FormLabel,
    FormButton,
    ModalNotify,
} from "./shared.js";

export const EditProfile = (props) => {
    let navigate = useNavigate();
    const { username } = useParams();
    let [state, setState] = useState({
        username: "",
        first_name: "",
        last_name: "",
        primary_email: "",
        city: "",
        error: "",
    });

    let [error, setError] = useState("");
    let [notify, setNotify] = useState("");

    const fetchUser = (username) => {
        fetch(`/v1/user/${username}`)
            .then((res) => res.json())
            .then((data) => {
                setState(data);
            })
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        fetchUser(username);
    }, [username]);

    // Is the logged-in user viewing their own profile
    const isUser = state.username === props.currentUser;

    const onChange = (ev) => {
        setError("");
        // Update from form and clear errors
        setState({
            ...state,
            [ev.target.name]: ev.target.value,
        });
    };

    const onSubmit = async (ev) => {
        ev.preventDefault();
        // Only proceed if there are no errors
        if (error !== "") return;
        const res = await fetch("/v1/user", {
            method: "PUT",
            body: JSON.stringify({
                first_name: state.first_name,
                last_name: state.last_name,
                city: state.city
            }),
            credentials: "include",
            headers: {
                "content-type": "application/json",
            },
        });
        if (res.ok) {
            // Notify users
            setNotify(`${state.username}'s profile Edited. You will now be directed to Profile page`);
        } else {
            const err = await res.json();
            setError(err.error);
        }
    };

    const onAcceptEdit = () => {
        navigate(`/profile/${username}`);
    };

    if(!isUser){
        return(
            <div style={{ gridArea: "main" }}>
                <ErrorMessage msg={`Error: Not Authorized`} />
            </div>
        );
    }

    return(
        <div style={{ gridArea: "main" }}>
            {notify !== "" ? (
                <ModalNotify
                    id="notification"
                    msg={notify}
                    onAccept={onAcceptEdit}
                />
            ) : null}
            <div htmlFor="username">Username:{username}</div>
        <FormBase>
            <FormLabel htmlFor="first_name">First Name:</FormLabel>
            <FormInput
                id="first_name"
                name="first_name"
                placeholder="First Name"
                onChange={onChange}
                value={state.first_name}
            />

            <FormLabel htmlFor="last_name">Last Name:</FormLabel>
            <FormInput
                id="last_name"
                name="last_name"
                placeholder="Last Name"
                onChange={onChange}
                value={state.last_name}
            />

            <FormLabel htmlFor="city">City:</FormLabel>
            <FormInput
                id="city"
                name="city"
                placeholder="City"
                onChange={onChange}
                value={state.city}
            />
            <div />
            <FormButton id="submitBtn" onClick={onSubmit}>
                Edit
            </FormButton>
        </FormBase>
        </div>
    )
}