'use strict';
/*Installed: express sqlite3 morgan express-validator passport passport-local bcrypt express-session*/

const express = require('express');
const morgan = require('morgan');
const { check, validationResult } = require('express-validator'); // validation middleware
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const userDao = require('./user-dao'); // module for accessing the administrators in the DB
const surveyDao = require('./survey-dao'); // module for accessing surveys, reponses, questions in the DB

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getAdmin(username, password).then((admin) => {
      if (!admin)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, admin);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  userDao.getAdminById(id)
    .then(admin => {
      done(null, admin); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

const errorFormatter = ({ location, msg, param, value, nestederrors }) => {
  // Format express-validate errors as strings
  return `${location}[${param}]: ${msg}`;
};

// init express
const app = new express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());

// custom middleware: check if a given request is coming from an authenticated admin
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();

  return res.status(401).json({ error: 'not authenticated' });
};

// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

/*** APIs ***/

//Retrieve all the surveys
app.get('/api/surveys',
  async (req, res) => {
    try {
      let result;
      if (req.isAuthenticated()) { //user is authenticated -> admin surveys
        result = await surveyDao.listAdminSurveys(req.user.id);
      }
      else { //all the surveys
        result = await surveyDao.listSurveys();
      }
      res.json(result);
    } catch (err) {
      res.status(500).end();
    }
  }
);

//Retrieve the questions of a survey
app.get('/api/surveys/:surveyId/questions', [
  check('surveyId').isInt()
],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); //format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    try {
      const result = await surveyDao.listQuestions(req.params.surveyId);
      if (result.error) {
        res.status(404).json(result); //questions not found. See survey-dao for more info
      }
      else {
        res.json(result);
      }
    } catch (err) {
      res.status(500).end();
    }
  }
);

//Retrieve the responses of a survey
app.get('/api/surveys/:surveyId/responses',
  isLoggedIn,
  [
    check('surveyId').isInt()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); //format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    try {
      const result = await surveyDao.listResponses(req.params.surveyId, req.user.id);
      if (result.error) {
        res.status(404).json(result); //responses not found. See survey-dao for more info
      }
      else {
        res.json(result);
      }
    } catch (err) {
      res.status(500).end();
    }
  }
);

//Create a new Survey
app.post('/api/surveys',
  isLoggedIn,
  [
    check('title').isLength({ min: 1, max: 100 })
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); //format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const survey = {
      title: req.body.title,
      adminId: req.user.id
    };

    try {
      const result = await surveyDao.createSurvey(survey);
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of new survey: ${err}.` });
    }
  }
);

//Create a new Question
app.post('/api/surveys/:surveyId/questions',
  isLoggedIn,
  [
    check('title').isLength({ min: 1, max: 100 }),
    check(['min', 'surveyId', 'position']).isInt(),
    check('max').isInt().optional({ nullable: true }),
    check('options').isJSON().optional({ nullable: true })
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); //format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const question = {
      title: req.body.title,
      position: req.body.position,
      min: req.body.min,
      max: req.body.max,
      options: req.body.options,
      surveyId: req.params.surveyId
    };

    try {
      const result = await surveyDao.createQuestion(question);
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of question ${err}` });
    }
  }
)

//Create a new user Response
app.post('/api/surveys/:surveyId/responses',
  [
    check('name').isLength({ min: 1, max: 25 }),
    check('answers').isJSON(),
    check('surveyId').isInt()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); //format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const response = {
      name: req.body.name,
      answers: req.body.answers,
      surveyId: req.params.surveyId
    };

    try {
      const result = await surveyDao.createResponse(response);
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the creation of response ${err}` });
    }
  }
);

/*** Users APIs ***/

// POST /sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);

      // req.user contains the authenticated user, we send all the user info back
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout();
  res.end();
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });;
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});