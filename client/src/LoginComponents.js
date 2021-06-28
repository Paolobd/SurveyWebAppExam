import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { useState } from 'react';
import { Link } from 'react-router-dom';


function LoginModal(props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('')

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');
        const credentials = { username, password };

        let valid = true;
        if (username.trim() === '') {
            valid = false;
            setError(oldError => oldError + 'Email cannot be empty\n');
            setUsername(''); //If user inserted many spaces
        }

        if (password === '') {
            valid = false;
            setError(oldError => oldError + 'Password cannot be empty\n');
            setPassword(''); //If user inserted many spaces
        }

        if (password.length < 6) {
            valid = false;
            setError(oldError => oldError + 'Password must be at least 6 characters\n');
            setPassword('');
        }

        if (valid) {
            props.doLogIn(credentials);
        }
    }

    return (
        <Col md={{ span: 8, offset: 2 }}>
            <Card className='cardMarginBorder' style={{ marginTop: '2em' }}>
                <Card.Header className='backgroundWarning'>
                    <Card.Title><h3 className='titleBoldCenter'>Login</h3></Card.Title>
                    <Card.Subtitle className="mb-1 text-muted" style={{ textAlign: 'center' }}>
                        Login to create and view the results of your surveys
                    </Card.Subtitle>
                </Card.Header>
                <Card.Body>
                    <LoginForm username={username} setUsername={setUsername} password={password} setPassword={setPassword}
                        error={error} logInMessage={props.logInMessage} />
                </Card.Body>
                <Card.Footer>
                    <Row>
                        <Col className='text-left'>
                            <Link to='/'>
                                <Button className='thinBlackBorder' variant='danger'>
                                    Homepage
                                </Button>
                            </Link>
                        </Col>
                        <Col className='text-right'>
                            <Button className='thinBlackBorder' variant='success' onClick={handleSubmit}>
                                Login
                            </Button>
                        </Col>
                    </Row>
                </Card.Footer>
            </Card>
        </Col>
    );
}

function LoginForm(props) {
    return (
        <Form>
            <Form.Group as={Row} controlId='username'>
                <Form.Label column sm="3">
                    <strong>Email</strong>
                </Form.Label>
                <Col sm="9">
                    <Form.Control type="email" value={props.username} onChange={ev => props.setUsername(ev.target.value)} />
                    <Form.Text className="text-muted">
                    </Form.Text>
                </Col>
            </Form.Group>
            <Form.Group as={Row} controlId='password'>
                <Form.Label column sm="3">
                    <strong>Password</strong>
                </Form.Label>
                <Col sm="9">
                    <Form.Control type="password" value={props.password} onChange={ev => props.setPassword(ev.target.value)} />
                    <Form.Text className="text-muted">
                    </Form.Text>
                </Col>
            </Form.Group>
            {props.error !== '' && <span className='errorStyle'><strong>Error/s in the question form:</strong>{'\n' + props.error}</span>}
            {props.logInMessage !== undefined && props.logInMessage.type === 'danger' && <span className='errorStyle'>{props.logInMessage.msg}</span>}
        </Form>
    );
}

export { LoginModal };