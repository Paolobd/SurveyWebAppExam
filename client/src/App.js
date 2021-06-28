
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TopNavigationBar } from './NavComponents';
import { CreateSurvey, ViewResponses } from './CreateViewComponents';
import { SurveyList } from './ListSurveyComponents';
import { AnswerSurvey } from './AnswerComponents';
import { LoginModal } from './LoginComponents';
import API from './API';

function App() {
  const [loggedIn, setLoggedIn] = useState(false); // at the beginning, no user is logged in
  const [logInMessage, setLogInMessage] = useState(); //logInMessage. It can be of type success (message in the top bar) 
  //or error (message in login form)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setLogInMessage({ msg: `Welcome, ${user}!`, type: 'success' });
      } catch (err) {
        console.error(err.error);
      }
    };
    checkAuth();
  }, []); //check if user is loggedIn

  const doLogIn = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setLogInMessage({ msg: `Welcome, ${user}!`, type: 'success' });
    } catch (err) {
      setLogInMessage({ msg: err, type: 'danger' });
    }
  }

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setLogInMessage();
  }

  return (
    <Router>
      <TopNavigationBar doLogOut={doLogOut} logInMessage={logInMessage} loggedIn={loggedIn} />
      <Container fluid className="App">
        <Row>
          <Col md={{ span: 8, offset: 2 }}>
            <Switch>
              <Route exact path='/' render={() =>
                <>
                  {window.scrollTo(0, 0)}
                  <SurveyList loggedIn={loggedIn} />
                </>
              } />
              <Route path='/create' render={() =>
                <>
                  {!loggedIn && <Redirect to='/' />}
                  {window.scrollTo(0, 0)}
                  <CreateSurvey />
                </>
              } />
              <Route path='/view' render={() =>
                <>
                  {!loggedIn && <Redirect to='/' />}
                  {window.scrollTo(0, 0)}
                  <ViewResponses />
                </>
              } />
              <Route path='/answer' render={() =>
                <>
                  {loggedIn && <Redirect to='/' />}
                  {window.scrollTo(0, 0)}
                  <AnswerSurvey />
                </>
              } />
              <Route path='/login' render={() =>
                <>
                  {loggedIn && <Redirect to='/' />}
                  {window.scrollTo(0, 0)}
                  <LoginModal doLogIn={doLogIn} logInMessage={logInMessage} />
                </>
              } />
              <Route render={() =>
                <Redirect to='/' />
              } />
            </Switch>
          </Col>
        </Row>
      </Container>
    </Router>
  );
}

export default App;
