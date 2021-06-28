const BASEURL = '/api';

async function getSurveys() {
    //call: GET /api/surveys
    const response = await fetch(BASEURL + '/surveys');
    const surveysJson = await response.json();
    if (response.ok) {
        return surveysJson;
    } else {
        throw surveysJson;   // an object with the error coming from the server
    }
}

async function getQuestions(surveyId) {
    //call: GET /api/surveys/:surveyId/questions
    const response = await fetch(BASEURL + '/surveys/' + surveyId + '/questions');
    const questionsJson = await response.json();

    if (response.ok) {
        //options is a JSOn in the database {"options": [{"id": 1, "text": "Yes"}] so I have to retrieve it accordingly
        return questionsJson.map((question) => question.options === null ? question : { ...question, options: JSON.parse(question.options).options })
            .sort((q1, q2) => q1.position - q2.position);
    } else {
        throw questionsJson;   // an object with the error coming from the server
    }
}

async function getResponses(surveyId) {
    //call: GET /api/surveys/:surveyId/responses
    const response = await fetch(BASEURL + '/surveys/' + surveyId + '/responses');
    const responsesJson = await response.json();
    if (response.ok) {
        //answers is a JSON in the dabatase {"answers": [{"id": 1, "value": [1] } ]} so I have to retrieve it accordingly
        return responsesJson.map((res) => ({ ...res, answers: JSON.parse(res.answers).answers }));
    } else {
        throw responsesJson;   // an object with the error coming from the server
    }
}

async function addSurveyQuestions(survey, questions) {
    //calls function addSurvey and addQuestion
    return new Promise((resolve, reject) => {
        addSurvey(survey).then(surveyId => {
            for (const question of questions) {
                addQuestion(surveyId, question)
                    .then(resolve(null))
                    .catch((err) => reject(err));
            }
        }).catch((err) => reject(err));
    });
}

function addResponse(surveyId, response) {
    //call: POST /api/surveys/:surveyId/responses
    return new Promise((resolve, reject) => {
        fetch(BASEURL + '/surveys/' + surveyId + '/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            //answers in DB is a JSON in the dabatase {"answers": [{"id": 1, "value": [1] } ]} so I have to format it accordingly
            body: JSON.stringify({ name: response.name, answers: JSON.stringify({ answers: response.answers }), surveyId: surveyId })
        }).then(res => {
            if (res.ok) {
                resolve(null);
            } else {
                res.json()
                    .then(message => reject(message)) // error message in the response body
                    .catch(() => reject({ error: "Cannot parse server response." })) // something else
            }
        }).catch(() => reject({ error: "Cannot communicate with the server." })); //connection errors
    });
}

async function addSurvey(survey) {
    //call: POST /api/surveys
    return new Promise((resolve, reject) => {
        fetch(BASEURL + '/surveys/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: survey.title })
        }).then(async (response) => {
            if (response.ok) {
                const surveyId = await response.json();
                resolve(surveyId); //return surveyId, useful because I willc all addQuestions later and I need the surveyId
            } else {
                response.json()
                    .then(message => reject(message)) // error message in the response body
                    .catch(() => reject({ error: "Cannot parse server response." })) // something else
            }
        }).catch(() => reject({ error: "Cannot communicate with the server." })); //connection errors
    });
}

async function addQuestion(surveyId, question) {
    //call: POST /api/surveys/:surveyId/questions
    return new Promise((resolve, reject) => {
        fetch(BASEURL + '/surveys/' + surveyId + '/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            //options is a JSOn in the database {"options": [{"id": 1, "text": "Yes"}] so I have to format it accordingly
            body: JSON.stringify({
                title: question.title, position: question.position, min: question.min, max: question.max,
                options: (question.options === null ? question.options : JSON.stringify({ options: question.options }))
            })
        }).then(response => {
            if (response.ok) {
                resolve(null);
            } else {
                response.json()
                    .then(message => reject(message)) // error message in the response body
                    .catch(() => reject({ error: "Cannot parse server response." })) // something else
            }
        }).catch(() => reject({ error: "Cannot communicate with the server." })); //connection errors
    });
}


async function logIn(credentials) {
    let response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (response.ok) {
        const admin = await response.json();
        return admin.name; //to put in the message
    }
    else {
        try {
            const errDetail = await response.json();
            throw errDetail.message;
        }
        catch (err) {
            throw err;
        }
    }
}

async function logOut() {
    await fetch('/api/sessions/current', { method: 'DELETE' });
}

async function getUserInfo() {
    const response = await fetch(BASEURL + '/sessions/current');
    const userInfo = await response.json();
    if (response.ok) {
        return userInfo.name;
    } else {
        throw userInfo;  // an object with the error coming from the server
    }
}

const API = { getSurveys, getQuestions, getResponses, addResponse, addSurveyQuestions, logIn, logOut, getUserInfo };
export default API;