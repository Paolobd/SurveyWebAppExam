import { Row, Col, Form, Button, ButtonGroup, Card, Modal, Spinner } from 'react-bootstrap';
import { Link, Redirect, useLocation } from 'react-router-dom';
import { ErrorAlert, TrashIcon, StarIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from './IconsErrorComponents';
import { useState, useEffect } from 'react';
import API from './API';

function ViewResponses(props) {
    const location = useLocation(); //If I have another question(another position) reset the values

    const [questions, setQuestions] = useState([]); //array of questions
    const [responses, setResponses] = useState([]); //array of responses
    const [numResponses, setNumResponses] = useState(1); //there is at least one answer (or you can't click the View Results button)
    const [currentResponse, setCurrentResponse] = useState(0); //index in the response array. The first response is at index 0
    const [loading, setLoading] = useState(true); //loading questions and responses
    const [errorMessage, setErrorMessage] = useState(''); //if some error occures while loading

    useEffect(() => {
        if (location.state) { //I have the surveyId in the state so i need it
            const surveyId = location.state.surveyId;
            API.getQuestions(surveyId) //getting the questions from the server
                .then((questions) => {
                    setQuestions(questions);
                    API.getResponses(surveyId) //getting the responses from the server
                        .then((responses) => {
                            setResponses(responses);
                            setNumResponses(responses.length);
                            setLoading(false);
                        }).catch((err) => {
                            setErrorMessage('Impossible to load the responses! Try again later...');
                            console.error(err);
                        });
                }).catch((err) => {
                    setErrorMessage('Impossible to load the questions! Try again later...');
                    console.error(err);
                });
        }
    }, [location.state])

    const moveRight = () => {
        setCurrentResponse(old => old + 1); //next response
    }

    const moveLeft = () => {
        setCurrentResponse(old => old - 1); //previous response
    }

    return (
        <>
            {!location.state && <Redirect to='/' />}
            <Form>
                <Col md={{ span: 8, offset: 2 }}>
                    <h3 className='titleBackgroundBorder'>Survey Results</h3>
                    <h1 className='titleBoldCenter'>{location.state && location.state.title}</h1>
                    <h5 style={{ textAlign: 'center' }}><StarIcon /> Questions are mandatory</h5>
                </Col>
                {errorMessage && <ErrorAlert errorMessage={errorMessage} setErrorMessage={setErrorMessage} />}
                {loading ?
                    <h3 className='titleBoldCenter'>
                        Stay tuned! Loading questions and responses...
                        <Spinner animation="border" variant="dark" />
                    </h3> :
                    <>
                        <Row>
                            <Col className='text-left'>
                                {//Previous response
                                }
                                <Button className='thinBlackBorder' variant='warning' disabled={currentResponse === 0} onClick={() => moveLeft()}>
                                    <ArrowLeftIcon />
                                </Button>
                            </Col>
                            <Col className='text-center'>
                                <h5>#{currentResponse + 1}/{numResponses} Answers of user: <span className='userStyle'>{responses[currentResponse].name}</span></h5>
                            </Col>
                            {//Next response
                            }
                            <Col className='text-right'>
                                <Button className='thinBlackBorder' variant='warning' disabled={currentResponse === numResponses - 1} onClick={() => moveRight()}>
                                    <ArrowRightIcon />
                                </Button>
                            </Col>
                        </Row>
                        <br></br>
                        {questions.map(question => question.options ?
                            <ClosedQuestion key={question.id} question={question}
                                answer={responses[currentResponse].answers.filter(answer => answer.id === question.position)[0]} />
                            : <OpenQuestion key={question.id} question={question}
                                answer={responses[currentResponse].answers.filter(answer => answer.id === question.position)[0]} />)}
                    </>
                }
            </Form>
            <Col md={{ span: 8, offset: 2 }}>
                <Col className='text-left'>
                    <HomeButton />
                </Col>
            </Col>
        </>
    );
}

function CreateSurvey(props) {
    const [submitted, setSubmitted] = useState(false); //if survey is submitted
    const [loading, setLoading] = useState(false); //loading when adding the survey
    const [errorMessage, setErrorMessage] = useState(''); //server error

    const [title, setTitle] = useState(''); //title of survey
    const [questions, setQuestions] = useState([]);
    const [nextPosition, setNextPosition] = useState(1); //positions always update after insert/delete and, unlike ids, there is noone missing
    const [nextId, setNextId] = useState(1); //temp id, the server will give the definite id in the database
    const [error, setError] = useState(''); //validation error

    const addSurvey = (survey, questions) => {
        setLoading(true);
        API.addSurveyQuestions(survey, questions).then(() => {
            setLoading(false);
            setSubmitted(true);
        }).catch((err) => {
            setErrorMessage('Some issues were found while trying to create the survey! Try again later... Error: ' + err.error);
            console.error(err);
        });
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        setError('');
        let valid = true;

        if (title.trim() === '') {
            valid = false;
            setError(oldError => oldError + 'Survey must have a title\n');
            setTitle(''); //If user inserted many spaces
        }

        if (title.lenght > 100) {
            valid = false;
            setError(oldError => oldError + 'Survey title is too long\n');
        }

        if (questions.length === 0) { // or nextPosition === 1
            valid = false;
            setError(oldError => oldError + 'Survey must have at least one question\n');
        }

        if (valid) {
            const survey = { title: title };
            addSurvey(survey, questions);
        }
    }

    const addQuestion = (newQuestion) => {
        const question = { id: nextId, ...newQuestion, position: nextPosition };

        setNextPosition((oldPosition) => oldPosition + 1);
        setNextId((oldId) => oldId + 1)
        setQuestions(oldQuestions => [...oldQuestions, question]);
    }

    const deleteQuestion = (id) => {
        const deletedPosition = questions.filter(question => question.id === id)[0].position;

        setNextPosition((nextPosition) => nextPosition - 1);
        setQuestions(oldQuestions => oldQuestions.filter(question => question.id !== id)
            .map(question => question.position > deletedPosition ? { ...question, position: question.position - 1 } : question));
        //the question with position greater than the deleted one will be decreased by 1
    }

    const moveUp = (oldPosition) => {
        setQuestions(oldQuestions => oldQuestions.map((question) => {
            if (question.position === oldPosition)
                return { ...question, position: oldPosition - 1 };
            else if (question.position === oldPosition - 1)
                return { ...question, position: oldPosition };
            else
                return question;
        }).sort((firstq, secondq) => firstq.position - secondq.position));
        //swap of two questions
    }

    const moveDown = (oldPosition) => {
        setQuestions(oldQuestions => oldQuestions.map((question) => {
            if (question.position === oldPosition)
                return { ...question, position: oldPosition + 1 };
            else if (question.position === oldPosition + 1)
                return { ...question, position: oldPosition };
            else
                return question;
        }).sort((firstq, secondq) => firstq.position - secondq.position));
        //swap of two questions
    }

    return (
        <>
            {submitted && <Redirect to='/' />}
            <Form>
                <Col md={{ span: 8, offset: 2 }}>
                    <h3 className='titleBackgroundBorder'>Survey Creation</h3>
                    <Form.Group controlId='title'>
                        <Form.Control type='text' placeholder='Insert the survey title' value={title} onChange={ev => setTitle(ev.target.value)} />
                        <Form.Text muted className='text-right'><small>Max 100 characters&nbsp;</small></Form.Text>
                    </Form.Group>
                    <h5 style={{ textAlign: 'center' }}><StarIcon /> Questions are mandatory</h5>
                </Col>
                {questions.map(question => question.options ? <ClosedQuestion key={question.id}
                    nextPosition={nextPosition} question={question} deleteQuestion={deleteQuestion} moveUp={moveUp} moveDown={moveDown} />
                    : <OpenQuestion key={question.id} nextPosition={nextPosition}
                        question={question} deleteQuestion={deleteQuestion} moveUp={moveUp} moveDown={moveDown} />)}
            </Form>
            <Col md={{ span: 8, offset: 2 }}>
                <AddQuestionModal addQuestion={addQuestion} />
                <br></br>
                {errorMessage && <ErrorAlert errorMessage={errorMessage} setErrorMessage={setErrorMessage} />}
                <HomeSubmit loading={loading} handleSubmit={handleSubmit} error={error} />
            </Col>
        </>
    );
}

function HomeSubmit(props) {
    return (
        <>
            <Row>
                <Col className='text-center'>
                    {props.error !== '' && <span className='errorStyle'><strong>Error/s in the question form:</strong>{'\n' + props.error}</span>}
                    <br></br>
                </Col>
            </Row>
            <Row>
                <Col className='text-left'>
                    <HomeButton />
                </Col>
                <Col className='text-right'>
                    <SubmitButton handleSubmit={props.handleSubmit} loading={props.loading} />
                </Col>
            </Row>
        </>
    );
}

function HomeButton(props) {
    return (
        <Link to='/'>
            <Button className='thinBlackBorder' variant='danger'>
                Homepage
            </Button>
        </Link>
    );
}

function SubmitButton(props) {
    return (
        <>
            {props.loading === false ?
                <Button className='thinBlackBorder' variant='success' onClick={(event) => props.handleSubmit(event)}>
                    Submit
                </Button>
                :
                <Button className='thinBlackBorder' variant='success' disabled>
                    Loading <Spinner animation="border" variant="warning" size="sm" />
                </Button>}
        </>
    );
}

function ClosedQuestion(props) {

    return (
        <Card className='cardMarginBorder'>
            <Card.Header className='backgroundWarning'>
                {//props.answer !== undefined means that we are in view responses mode, hence no delete/moveup/movedown buttons
                }
                {props.answer !== undefined ?
                    <>
                        <Card.Title>#{props.question.position}: {props.question.title}</Card.Title>
                        <Card.Subtitle className="mb-1 text-muted">Closed Question {props.question.min > 0 && <StarIcon />}</Card.Subtitle>
                    </> :
                    <Row>
                        <Col className='text-left'>
                            <Card.Title>#{props.question.position}: {props.question.title}</Card.Title>
                            <Card.Subtitle className="mb-1 text-muted">Closed Question {props.question.min > 0 && <StarIcon />}</Card.Subtitle>
                        </Col>
                        <Col className='text-right'>
                            <ManageQuestion id={props.question.id} position={props.question.position} nextPosition={props.nextPosition} deleteQuestion={props.deleteQuestion} moveUp={props.moveUp} moveDown={props.moveDown} />
                        </Col>
                    </Row>
                }
            </Card.Header>
            <Card.Body>
                <Form.Group controlId='closedQuestion'>
                    {props.question.options.map(option =>
                        <DisplayOption key={option.id} option={option} type={props.question.max === 1 ? 'radio' : 'checkbox'} answer={props.answer} />)}
                </Form.Group>
            </Card.Body>
            <Card.Footer className='text-muted small commentCard'>
                User must choose a min of {props.question.min} to a max of {props.question.max} option/s{'\n'}
                {props.answer !== undefined && props.answer.value.length === 0 && 'User did not answer\n'}
                {props.answer !== undefined && props.answer.value.length !== 0 && `User answered with ${props.answer.value.length} option/s\n`}
            </Card.Footer>
        </Card>
    );

}

function OpenQuestion(props) {

    return (
        <Card className='cardMarginBorder'>
            <Card.Header className='backgroundWarning'>
                {//props.answer !== undefined means that we are in view responses mode, hence no delete/moveup/movedown buttons
                }
                {props.answer !== undefined ?
                    <>
                        <Card.Title>#{props.question.position}: {props.question.title}</Card.Title>
                        <Card.Subtitle className="mb-1 text-muted">Open Question {props.question.min > 0 && <StarIcon />}</Card.Subtitle>
                    </> :
                    <Row>
                        <Col className='text-left'>
                            <Card.Title>#{props.question.position}: {props.question.title}</Card.Title>
                            <Card.Subtitle className="mb-1 text-muted">Open Question {props.question.min > 0 && <StarIcon />}</Card.Subtitle>
                        </Col>
                        <Col className='text-right'>
                            <ManageQuestion id={props.question.id} position={props.question.position} nextPosition={props.nextPosition} deleteQuestion={props.deleteQuestion} moveUp={props.moveUp} moveDown={props.moveDown} />
                        </Col>
                    </Row>
                }
            </Card.Header>
            <Card.Body>
                <Form.Group controlId='openQuestion'>
                    <Form.Control as="textarea" rows={3} maxLength={200} disabled value={props.answer === undefined ? 'User will type here their answer' : props.answer.value} />
                    <Form.Text className='text-right' muted><small>Max 200 characters</small></Form.Text>
                </Form.Group>
            </Card.Body>
            <Card.Footer className='text-muted small commentCard'>
                {props.answer !== undefined && props.answer.value === '' && 'User did not answer'}
                {props.answer !== undefined && props.answer.value !== '' && `User answered with a text of ${props.answer.value.length} characters`}
            </Card.Footer>
        </Card>
    );
}

function ManageQuestion(props) {
    return (
        <>
            <ButtonGroup aria-label='Move question'>
                <Button className='blackBorder' variant='success' onClick={() => props.moveUp(props.position)} disabled={props.position === 1 ? true : false}>
                    <ArrowUpIcon />
                </Button>
                <Button className='blackBorder' variant='success' onClick={() => props.moveDown(props.position)} disabled={props.position === props.nextPosition - 1 ? true : false}>
                    <ArrowDownIcon />
                </Button>
            </ButtonGroup>
            &nbsp;&nbsp;&nbsp;
            <Button className='blackBorder' variant='danger' onClick={() => props.deleteQuestion(props.id)}>
                <TrashIcon />
            </Button>
        </>
    );
}

function AddQuestionModal(props) {
    const [show, setShow] = useState(false); //show modal or not

    const [title, setTitle] = useState(''); //title of question
    const [options, setOptions] = useState(); //options of closed question. Setted if we click add closed question
    const [min, setMin] = useState(0); // for open and closed
    const [max, setMax] = useState(); //only for closed question
    const [error, setError] = useState(''); //validation errors

    const resetModal = () => {
        setTitle('');
        setOptions();
        setMin(0);
        setMax();
        setError('');
    }

    const handleShowClosed = () => { //I want the closed question modal
        setOptions([]);
        setMax(0);
        setShow(true);
    }

    const handleShowOpen = () => { //I want the open question modal
        setOptions(null);
        setMax(null);
        setShow(true);
    }

    const handleClose = () => { //close modal
        setShow(false);
        resetModal();
    }

    const handleSubmit = (event) => {
        event.preventDefault('');

        setError('');
        let valid = true;

        if (title.trim() === '') { //closed or open question
            valid = false;
            setError(oldError => oldError + 'Question title cannot be empty\n');
            setTitle(''); //If user inserted many spaces
        }

        if (title.length > 100) {
            valid = false;
            setError(oldError => oldError + 'Question title is too long\n');
        }

        if (options !== null) { //closed question
            if (max === 0) {
                valid = false;
                setError(oldError => oldError + 'Max value cannot be 0\n');
            }
            if (min > max) {
                valid = false;
                setError(oldError => oldError + 'Min value cannot be greater than max value\n');
            }
            if (options.length === 0) {
                valid = false;
                setError(oldError => oldError + 'Number of options cannot be 0\n');
            }
            else {
                if (options.length < min) {
                    valid = false;
                    setError(oldError => oldError + 'Number of options cannot be less than the min value\n');
                }
                if (options.length < max) {
                    valid = false;
                    setError(oldError => oldError + 'Number of options cannot be less than the max value\n');
                }
            }
            for (const option of options) {
                if (option.text === '') {
                    valid = false;
                    setError(oldError => oldError + `Option #${option.position} cannot be empty\n`);
                }
            }
        }

        if (valid) {
            let newOptions = options; //remains null if open question
            if (options !== null) {
                newOptions = options.map(option => ({ id: option.position, text: option.text })).sort((opt1, opt2) => opt1.position - opt2.position);
            }
            const question = { title: title, min: min, max: max, options: newOptions }
            props.addQuestion(question);
            handleClose();
        }
    }

    return (
        <>
            <Row>
                <Col className='text-left'>
                    <Button className='thinBlackBorder' variant='warning' onClick={handleShowClosed}>
                        New Closed Answer Question
                    </Button>
                </Col>
                <Col className='text-right'>
                    <Button className='thinBlackBorder' variant='warning' onClick={handleShowOpen}>
                        New Open Answer Question
                    </Button>
                </Col>
            </Row>

            <Modal show={show} onHide={handleClose} className='thinBlackBorder' scrollable centered size='lg'>
                <Modal.Header className='backgroundWarning'>
                    {//Initially the options are not defined. To not cause issues we check also if they are undefined and not only null
                    }
                    <Modal.Title>{(options === null || options === undefined) ? 'Add Open Question' : 'Add Closed Question'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <QuestionForm title={title} setTitle={setTitle} options={options} setOptions={setOptions}
                        min={min} setMin={setMin} max={max} setMax={setMax} error={error} />
                    {error !== '' &&
                        <Col className='text-right'>
                            <span className='errorStyle'><strong>Error/s in the question form:</strong>{'\n' + error}</span>
                        </Col>}
                </Modal.Body>
                <Modal.Footer style={{ background: '#f5f5f5' }}>
                    <Button variant='danger' className='thinBlackBorder' onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant='success' className='thinBlackBorder' onClick={handleSubmit}>
                        Add Question
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

function QuestionForm(props) {
    return (
        <Form>
            <Form.Group as={Row} controlId='questionTitle'>
                <Form.Label column className='text-center' sm='2'>
                    Question:
                </Form.Label>
                <Col className='text-right' sm='10'>
                    <Form.Control type='text' placeholder='Insert the question' value={props.title}
                        onChange={ev => props.setTitle(ev.target.value)} />
                    <Form.Text className='text-muted'>Max 100 characters&nbsp;</Form.Text>
                </Col>
            </Form.Group>
            {//Initially the options are not defined. To not cause issues we check also if they are undefined and not only null
            }
            {(props.options === null || props.options === undefined) ? <OpenFormInfo min={props.min} setMin={props.setMin} /> :
                <ClosedFormInfo min={props.min} setMin={props.setMin} max={props.max} setMax={props.setMax}
                    options={props.options} setOptions={props.setOptions} />}
        </Form>
    );
}

function OpenFormInfo(props) {
    return (
        <Col className='text-left'>
            <Form.Group controlId='questionMandatory'>
            <Form.Check inline label='Optional' checked={props.min === 0 ? true : false} type='radio' onChange={() => props.setMin(0)}  id='inline-optional'/>
                <Form.Check inline label='Mandatory' checked={props.min === 1 ? true : false} type='radio' onChange={() => props.setMin(1)} id='inline-mandatory'/>
            </Form.Group>
        </Col>
    );
}

function ClosedFormInfo(props) {
    const [nextId, setNextId] = useState(1); //This is a temp id
    const [nextPosition, setNextPosition] = useState(1); //This will be used as an id when question is added
    //positions will be continuos like question and position. Hence 1, 2, 3 -> this will become ids

    const addNewOption = () => {
        const option = { id: nextId, text: '', position: nextPosition };

        setNextPosition((oldPosition) => oldPosition + 1);
        setNextId((oldId) => oldId + 1)
        props.setOptions(oldOptions => [...oldOptions, option])
    }

    const editOption = (id, text) => {
        props.setOptions(oldOptions => oldOptions.map(option => option.id === id ? { ...option, text: text } : option));
    }

    const deleteOption = (id) => {
        const optionPosition = props.options.filter(option => option.id === id)[0].position;
        setNextPosition((oldPosition) => oldPosition - 1);

        props.setOptions(oldOptions => oldOptions.filter(option => option.id !== id)
            .map(option => option.position > optionPosition ? { ...option, position: option.position - 1 } : option));
        //If i delete an option i must decrease by one all the successors positions

    }

    return (
        <>
            <Col className='text-left'>
                <Form.Group controlId='questionOptions'>
                    {props.options.map(option => <OptionsForm key={option.id} option={option} deleteOption={deleteOption} editOption={editOption} />)}
                    <Button variant='warning' className='thinBlackBorder' onClick={addNewOption}>Add Option</Button>
                </Form.Group>
            </Col>

            <Form.Group as={Row} controlId='questionMinMax'>
                <Form.Label column className='text-center' sm='1'>
                    Min
                </Form.Label>
                <Col className='text-center' sm='2'>
                    <Form.Control type='number' min={0} value={props.min} onChange={ev => props.setMin(ev.target.value * 1)} />
                </Col>
                <Form.Label column className='text-center' sm='1'>
                    Max
                </Form.Label>
                <Col className='text-center' sm='2'>
                    <Form.Control type='number' min={0} value={props.max} onChange={ev => props.setMax(ev.target.value * 1)} />
                </Col>
                <Form.Text muted style={{ whiteSpace: 'pre-line' }}>
                    Min is the minimum amount of answers that the user must give.{'\n'}
                    (e.g. min = 0 means optional, while min &gt; 0 means mandatory).{'\n'}
                    Max is the maximum amount of answers that the user can give.{'\n'}
                </Form.Text>
            </Form.Group>
        </>
    );
}

function OptionsForm(props) {
    //Single option with title and delete icon
    return (
        <Row style={{ marginBottom: '1em' }}>
            <Form.Label column sm='2'>Option #{props.option.position}: </Form.Label>
            <Col sm='3'>
                <Form.Control type='text' value={props.option.text} onChange={ev => props.editOption(props.option.id, ev.target.value)} />
            </Col>
            <Button className='thinBlackBorder' variant='danger' onClick={() => props.deleteOption(props.option.id)}>
                <TrashIcon />
            </Button>
        </Row>
    );
}

function DisplayOption(props) {
    //Displays options when question is added/view responses mode
    const checked = (props.answer !== undefined && props.answer.value.filter(ansOpt => ansOpt === props.option.id)[0] !== undefined) ? true : false;
    return (
        <Form.Group controlId={`formOption${props.option.id}`}>
            <Form.Check label={props.option.text} readOnly checked={checked} type={props.type} />
        </Form.Group>

    );
}

export { CreateSurvey, ViewResponses };