import { Navbar, Nav } from 'react-bootstrap';
import { LogoIcon, LoginIcon, LogoutIcon } from './IconsErrorComponents';

function TopNavigationBar(props) {

    return (<>
        <Navbar bg="warning" sticky="top">
            <Nav className="container-fluid">
                <LogoIcon />
                {props.logInMessage !== undefined && props.logInMessage.type === 'success' &&
                    <span style={{ fontSize: '2em', fontWeight: 'bold' }}> {props.logInMessage.msg} </span>}
                {props.loggedIn ?
                    <LogoutIcon doLogOut={props.doLogOut}/> :
                    <LoginIcon />}
            </Nav>
        </Navbar>
    </>
    );
}

export { TopNavigationBar };