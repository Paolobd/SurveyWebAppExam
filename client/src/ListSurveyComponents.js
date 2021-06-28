import { Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ErrorAlert } from './IconsErrorComponents';
import API from './API';

function SurveyList(props) {
    const [surveys, setSurveys] = useState([]); //array of surveys
    const [loading, setLoading] = useState(true); //initially loading the surveys
    const [errorMessage, setErrorMessage] = useState(''); //error with server

    useEffect(() => {
        API.getSurveys().then(newSurveys => {
            setSurveys(newSurveys);
            setLoading(false);
        }).catch((err) => {
            setErrorMessage('Impossible to load the surveys! Try again later.');
            console.error(err);
        });
    }, [props.loggedIn]);

    return (
        <Row>
            <Col md={{ span: 8, offset: 2 }}>
                <h1 className='titleBackgroundBorder' style={{ marginBottom: '1em' }}>List of {props.loggedIn && 'your'} Published Surveys</h1>
                {errorMessage && <ErrorAlert errorMessage={errorMessage} setErrorMessage={setErrorMessage} />}
                {//create survey option if loggedIn
                }
                {props.loggedIn &&
                    <Col className='text-center' style={{ marginBottom: '1em' }}>
                        <Link to='/create'>
                            <Button className='thinBlackBorder' variant='success' size='lg'>
                                Create Survey
                            </Button>
                        </Link>
                    </Col>
                }
                {loading ?
                    <h3 className='titleBoldCenter'>
                        Stay tuned! Loading the surveys...
                        <Spinner animation="border" variant="dark" />
                    </h3> :
                    surveys.map(survey => <SurveyElement key={survey.id} survey={survey} loggedIn={props.loggedIn} />)}
            </Col>
        </Row>
    );
}

function SurveyElement(props) {
    return (
        <Card className='cardMarginBorder'>
            <Card.Header className='backgroundWarning'>
                <Row>
                    <Col className='text-left'>
                        <Card.Title><strong>{props.survey.title}</strong></Card.Title>
                        <Card.Subtitle className="mb-1 text-muted">Survey Title</Card.Subtitle>
                    </Col>
                    <Col className='text-right'>
                        {//Answer Button if not logged in. View Results button if logged in
                        }
                        {props.loggedIn === false ?
                            <Link to={{ pathname: '/answer', state: { surveyId: props.survey.id, title: props.survey.title } }}>
                                <Button className='thinBlackBorder' variant='success'>
                                    Answer
                                </Button>
                            </Link> :
                            <Link to={{ pathname: '/view', state: { surveyId: props.survey.id, title: props.survey.title } }}>
                                <Button className='thinBlackBorder' variant='success' disabled={props.survey.numAnswers === 0}>
                                    View Results
                                </Button>
                            </Link>
                        }
                    </Col>
                </Row>
            </Card.Header>
            <Card.Body>
                {props.loggedIn === false ?
                    <>If you want to take part in this survey click the <strong>Answer</strong> button </> :
                    <>Number of answers: <span style={{fontSize: '1.5em'}}>{props.survey.numAnswers}</span></>
                }
            </Card.Body>
            <Card.Footer className='text-muted small commentCard'>
                {props.loggedIn === true ? 'Please log out if you want to answer a survey' : `Created by: ${props.survey.adminName}`}
            </Card.Footer>
        </Card>
    );
}

export { SurveyList };