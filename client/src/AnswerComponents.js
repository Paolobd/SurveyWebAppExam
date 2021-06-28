import { Row, Col, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, Redirect, useLocation } from 'react-router-dom';
import { StarIcon, ErrorAlert } from './IconsErrorComponents';
import { useState, useEffect } from 'react';
import API from './API';

function AnswerSurvey(props) {
    const location = useLocation(); // state: {surveyId, title}

    const [submitted, setSubmitted] = useState(false); //if response submitted
    const [name, setName] = useState(''); //name of the user responding
    const [answers, setAnswers] = useState([]); //answers given by the user until now
    const [questions, setQuestions] = useState([]); //questions the user has to answer
    const [currentQuestion, setCurrentQuestion] = useState(undefined); //tells which is the currentQuestion to display.
    //Initially it is undefined and it will also be undefined when we are at finalpage (because currentQuestionPosition will be out of numQuestions)
    const [currentQuestionPosition, setCurrentQuestionPosition] = useState(1); //First question has position = 1
    const [numQuestions, setNumQuestions] = useState(1); //There is at least one question. This will be questions.length
    const [errorMessage, setErrorMessage] = useState(''); //Server errors
    const [error, setError] = useState(''); //Validation errors
    const [loadingQuestions, setLoadingQuestions] = useState(true); //when initially loading questions
    const [loadingSubmit, setLoadingSubmit] = useState(false); //when trying to submit response

    useEffect(() => {
        if (location.state) { //surveyId is in the state
            const surveyId = location.state.surveyId;
            API.getQuestions(surveyId)
                .then(questions => {
                    setQuestions(questions);
                    setNumQuestions(questions.length);
                    setLoadingQuestions(false);
                }).catch((err) => {
                    setErrorMessage('Impossible to load the questions! Try again later...');
                    console.error(err);
                });
        }
    }, [location.state])

    useEffect(() => {
        if (loadingQuestions === false) { //If I've finished loading and currentQuestionPosition changes I update the currentQuestion
            setCurrentQuestion(questions.filter(question => question.position === currentQuestionPosition)[0]);
        }
    }, [loadingQuestions, currentQuestionPosition])

    const addAnswer = (newAnswer) => {
        setAnswers(oldAnswers => [...oldAnswers, newAnswer]);
        setCurrentQuestionPosition(oldPos => oldPos + 1); //next Question
    }

    const addResponse = (response) => {
        const surveyId = location.state.surveyId;
        setLoadingSubmit(true);
        API.addResponse(surveyId, response) //adding response to server
            .then(() => {
                setLoadingSubmit(false);
                setSubmitted(true);
            }).catch((err) => {
                setErrorMessage('Some issues were found while trying to send the response! Try again later... Error: ' + err.error);
                console.error(err);
            });
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        setError('');
        let valid = true;

        if (name.trim() === '') {
            valid = false;
            setError('Name cannot be empty');
            setName(''); //If user inserted many spaces
        }

        if (name.length > 25) {
            valid = false;
            setError('Name is too long');
        }

        if (valid) {
            const response = { name: name, answers: answers };
            addResponse(response);
        }
    }

    return (
        <>
            {!location.state && <Redirect to='/' />}
            {submitted && <Redirect to='/' />}
            <Form>
                <Col md={{ span: 8, offset: 2 }}>
                    <h3 className='titleBackgroundBorder'>Survey Compilation</h3>
                    <h1 className='titleBoldCenter'>{location.state && location.state.title}</h1>
                    <h5 style={{ textAlign: 'center' }}><StarIcon /> Questions are mandatory</h5>
                    <Form.Group controlId='nameUser'>
                        <Form.Control type='text' placeholder='Insert your name' value={name} onChange={ev => setName(ev.target.value)} />
                        <Form.Text muted className='text-right'><small>Max 25 characters&nbsp;</small></Form.Text>
                    </Form.Group>
                    <Alert variant="warning">
                        <Alert.Heading>Warning!</Alert.Heading>
                        <p>You cannot go back to previous questions!</p>
                    </Alert>
                </Col>
                {errorMessage && <ErrorAlert errorMessage={errorMessage} setErrorMessage={setErrorMessage} />}
                {loadingQuestions ?
                    <h3 className='titleBoldCenter'>
                        Stay tuned! Loading questions...
                        <Spinner animation="border" variant="dark" />
                    </h3> :
                    <>
                        {currentQuestionPosition > numQuestions ?
                            <FinalPage />
                            :
                            <>
                                {//CurrentQuestionPosition is undefined at the start. We need to check that
                                    currentQuestion !== undefined ? (currentQuestion.options === null ?
                                        <OpenQuestion question={currentQuestion} numQuestions={numQuestions} addAnswer={addAnswer} />
                                        : <ClosedQuestion question={currentQuestion} numQuestions={numQuestions} addAnswer={addAnswer} />)
                                        : <></>
                                }
                            </>
                        }
                    </>
                }
            </Form>
            <br></br>
            <Col md={{ span: 8, offset: 2 }}>
                <Col className='text-center'>
                    {error !== '' && <span className='errorStyle'><strong>Error/s in the survey form:</strong>{'\n' + error}</span>}
                </Col>
                <Row>
                    <Col className='text-left'>
                        <Link to='/'>
                            <Button className='thinBlackBorder' variant='danger'>
                                Homepage
                            </Button>
                        </Link>
                    </Col>
                    <Col className='text-right'>
                        {loadingSubmit === false ?
                            <Button className='thinBlackBorder' variant='success' disabled={currentQuestionPosition > numQuestions ? false : true} onClick={handleSubmit}>
                                Submit
                            </Button>
                            :
                            <Button className='thinBlackBorder' variant='success' disabled>
                                Loading <Spinner animation="border" variant="warning" size="sm" />
                            </Button>
                        }
                    </Col>
                </Row>
            </Col>
        </>
    );
}

function ClosedQuestion(props) {
    const [value, setValue] = useState([]); //array of int. It contains the id of the options selected
    const [error, setError] = useState(''); //validation errors

    useEffect(() => {
        setValue([]);
    }, [props.question.position]) //If I have another question(another position) reset the values

    const addOption = (newId) => {
        if (props.question.max === 1) { //radio button
            setValue([newId]); //only one answer
        }
        else { //checkboxes
            setValue(oldValue => [...oldValue, newId]) //add the option
        }
    }

    const deleteOption = (newId) => {
        setValue(oldValue => oldValue.filter(ans => ans !== newId)); //delete if option already checked
    }

    const resetOptions = () => {
        setValue([]); //reset when we have radio options (max=1) and the question is optional (min=0)
        //If we want not to answer but we clicked before
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        setError('');
        let valid = true;

        const numAnsw = value.length;
        if (numAnsw < props.question.min) { //If I have chosen 0 options and question is optional this won't trigger
            valid = false;
            setError(oldError => oldError + `You must choose at least ${props.question.min} options\n`)
        }
        if (numAnsw > props.question.max) {
            valid = false;
            setError(oldError => oldError + `You can choose a maximum of ${props.question.max} options\n`)
        }

        if (valid) {
            const answer = { id: props.question.position, value: value.sort((option1, option2) => option1 - option2) };
            props.addAnswer(answer);
        }
    }

    return (
        <>
            <Card className='cardMarginBorder'>
                <Card.Header className='backgroundWarning'>
                    <Card.Title>#{props.question.position} of {props.numQuestions}: {props.question.title}</Card.Title>
                    <Card.Subtitle className="mb-1 text-muted">Closed Question {props.question.min > 0 && <StarIcon />}</Card.Subtitle>
                </Card.Header>
                <Card.Body>
                    <Form.Group controlId='closedQuestion'>
                        {//checked value: If I have the option id in values (not undefined) then it means is checked option
                        }
                        {props.question.options.map(option =>
                            <DisplayOption key={option.id} option={option} addOption={addOption} deleteOption={deleteOption}
                                type={props.question.max === 1 ? 'radio' : 'checkbox'}
                                checked={value.filter(id => id === option.id)[0] !== undefined ? true : false} />)}
                        <br></br>
                        {props.question.max === 1 && props.question.min === 0 &&
                            <Button className='thinBlackBorder' variant='warning' onClick={resetOptions}>
                                Reset choices
                            </Button>}
                    </Form.Group>

                    {error !== '' && <span className='errorStyle'><strong>Error/s in the question form:</strong>{'\n' + error}</span>}
                </Card.Body>
                <Card.Footer className='text-muted small' style={{ fontStyle: 'italic' }}>
                    You {props.question.min === 0 ? 'may' : 'must'} choose a min of {props.question.min} to a max of {props.question.max} option/s
                </Card.Footer>
            </Card>
            <Col md={{ span: 8, offset: 2 }}>
                <Col className='text-right'>
                    <Button className='thinBlackBorder' variant='warning' onClick={handleSubmit}>
                        Next
                    </Button>
                </Col>
            </Col>
        </>
    );
}

function OpenQuestion(props) {
    const [value, setValue] = useState(''); //text value of answer
    const [error, setError] = useState(''); //validation error

    useEffect(() => {
        setValue('');
    }, [props.question.position]) //If I have another question(another position) reset the values

    const handleSubmit = (event) => {
        event.preventDefault();

        setError('');
        let valid = true;

        if (value.trim() === '' && props.question.min === 1) {
            valid = false;
            setError(oldError => oldError + `This question is mandatory\n`);
            setValue(''); //if user inserted many spaces I reset the text box
        }
        //No check if question is too long. This constraint is in the form

        if (valid) {
            const answer = { id: props.question.position, value: value };
            props.addAnswer(answer);
        }
    }

    return (
        <>
            <Card className='cardMarginBorder'>
                <Card.Header className='backgroundWarning'>
                    <Card.Title>#{props.question.position} of {props.numQuestions}: {props.question.title}</Card.Title>
                    <Card.Subtitle className="mb-1 text-muted">Open Question {props.question.min > 0 && <StarIcon />}</Card.Subtitle>
                </Card.Header>
                <Card.Body>
                    <Form.Group controlId='openQuestion'>
                        <Form.Control as="textarea" rows={3} maxLength={200} value={value} onChange={ev => setValue(ev.target.value)} />
                        <Form.Text className='text-right' muted><small>Max 200 characters</small></Form.Text>
                    </Form.Group>
                    {error !== '' && <span className='errorStyle'><strong>Error/s in the question form:</strong>{'\n' + error}</span>}
                </Card.Body>
                <Card.Footer className='text-muted small' style={{ fontStyle: 'italic' }}>
                    This question is {props.question.min === 0 ? 'optional' : 'mandatory'}
                </Card.Footer>
            </Card>
            <Col md={{ span: 8, offset: 2 }}>
                <Col className='text-right'>
                    <Button className='thinBlackBorder' variant='warning' onClick={handleSubmit}>
                        Next
                    </Button>
                </Col>
            </Col>
        </>
    );
}

function FinalPage(props) {
    return (
        <Col md={{ span: 8, offset: 2 }}>
            <h3 className='titleBackgroundBorder'>You have answered all the questions!</h3>
            <h4 style={{ textAlign: 'center' }}>Remember to insert your name</h4>
            <h5 className='text-muted' style={{ textAlign: 'center' }}>When you are done remember to hit the submit button</h5>
        </Col>
    )
}

function DisplayOption(props) {

    const handleClick = () => {
        if (props.checked) {
            props.deleteOption(props.option.id); //If I click a checked checkbox delete the option
        }
        else {
            props.addOption(props.option.id); //If it was not checked add the option
        }
    }

    return (
        <Form.Check label={props.option.text} type={props.type} checked={props.checked} onChange={() => handleClick()} />
    );
}

export { AnswerSurvey };