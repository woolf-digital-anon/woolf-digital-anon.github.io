import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import logo from "../assets/logo.png";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";

export function CustomNavbar({helperFunctions={}}) {

    return(
        <Navbar bg="light" expand="lg" className="sticky-top">
            <Container>
                <Navbar.Brand>
                    <span><img src={logo} alt={""} style={{"height": 64, "width": 64, "marginRight": "10px"}}/></span>
                    Necturus XML Viewer
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                { helperFunctions.resetLayout ?
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <NavDropdown title="Set Layouts" id="basic-nav-dropdown">
                                <NavDropdown.Item onClick={() => helperFunctions.resetLayout('sbs')}>Side by Side</NavDropdown.Item>
                                <NavDropdown.Item onClick={() => helperFunctions.resetLayout('fw')}>Full-Width</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse> : ''}
            </Container>
        </Navbar>
    )
}