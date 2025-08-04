import { Fragment, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { CustomNavbar } from "./CustomNavbar";
import ReactMarkdown from "react-markdown";
import { FaGithub } from "react-icons/fa";

export default function Contact() {
    const [markdown, setMarkdown] = useState("");

    useEffect(() => {
        fetch(`${process.env.PUBLIC_URL}/files/contact.md`)
            .then((res) => res.text())
            .then((text) => setMarkdown(text))
            .catch((err) => console.error("Failed to load about.md", err));
    }, []);

    return (
        <Fragment>
            <CustomNavbar helperFunctions={["collectionLink"]} />

            <Container className="px-4 pt-4 page-container">
                <article className="mb-5">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                </article>
            </Container>
        </Fragment>
    );
}