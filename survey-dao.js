'use strict';
/* Data Access Object (DAO) module for accessing courses and exams */

const db = require('./db');

//Retrieve all surveys
exports.listSurveys = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT surveys.id as 'surveyId', title, adminId, administrators.name as 'adminName'
                     FROM surveys, administrators
                     WHERE surveys.adminId = administrators.id`;
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const surveys = rows.map((survey) => ({
                id: survey.surveyId, title: survey.title, adminName: survey.adminName
            }));
            resolve(surveys);
        });
    });
};

//Retrieve surveys of authenticated user
exports.listAdminSurveys = (adminId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT surveys.id as 'surveyId', title, (
                        SELECT COUNT(*)
                        FROM responses
                        WHERE responses.surveyId = surveys.id) as 'numAnswers'
                     FROM surveys
                     WHERE surveys.adminId = ?`;
        db.all(sql, [adminId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const surveys = rows.map((survey) => ({
                id: survey.surveyId, title: survey.title, numAnswers: survey.numAnswers
            }));
            resolve(surveys);
        });
    });
};

//Retrieve questions given a survey
exports.listQuestions = (surveyId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT *
                     FROM questions
                     WHERE questions.surveyId = ? 
                     ORDER BY questions.position`;
        db.all(sql, [surveyId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows.length === 0) {
                resolve({ error: 'Questions not found: Survey does not exist.' }) //Survey should have at least one question!
            }
            else {
                const questions = rows.map((question) => ({
                    id: question.id, title: question.title, position: question.position,
                    min: question.min, max: question.max, options: question.options
                }));
                resolve(questions);
            }
        });
    });
};

//Retrieve list of responses
exports.listResponses = (surveyId, adminId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT responses.id as responseId, name, answers
                     FROM responses, surveys
                     WHERE responses.surveyId = ? AND surveys.adminId = ? AND responses.surveyId = surveys.id`;
        db.all(sql, [surveyId, adminId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows.length === 0) {
                resolve({ error: 'Responses not found: No one has answered or Survey does not exist.' }); 
                //Possible causes: -No one has answered; -Survey with that ID does not exist;
                //-Another admin is trying to see responses to a survey that is not theirs somehow(client side is impossible)
            }
            else {
                const responses = rows.map((response) => ({
                    id: response.responseId, name: response.name, answers: response.answers
                }));
                resolve(responses);
            }
        });
    });
}; 

//Create a survey
exports.createSurvey = (survey) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO surveys (title, adminId) VALUES (?, ?)';
        db.run(sql, [survey.title, survey.adminId], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID); //surveyId
        });
    });
};

//Create a question
exports.createQuestion = (question) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO questions (title, position, min, max, options, surveyId) VALUES (?, ?, ?, ?, ?, ?)';
        db.run(sql, [question.title, question.position, question.min, question.max, question.options, question.surveyId], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID); //qestuionId
        });
    });
};

//Create a response
exports.createResponse = (response) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO responses (name, answers, surveyId) VALUES (?, ?, ?)';
        db.run(sql, [response.name, response.answers, response.surveyId], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });
};