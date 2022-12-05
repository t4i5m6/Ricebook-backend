/*
 * Test suite for articles
 */
require('es6-promise').polyfill();
require('isomorphic-fetch');

const url = path => `http://localhost:3000${path}`;

describe('Validate Registration, Login, Headline, Articles functionality', () => {

    let cookie;


    it('register new user', (done) => {
        let regUser = {username: 'mrj3456', password: '1234', email: "5555", zipcode: "5555", dob: "77777"};
        fetch(url('/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regUser)
        }).then(res => res.json()).then(res => {
            expect(res.username).toEqual('mrj3456');
            expect(res.result).toEqual('success');
            done();
        });
    });

    it('login user', (done) => {
        let loginUser = {username: 'mrj3456', password: '1234'};
        fetch(url('/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginUser)
        }).then(res => {
            cookie = res.headers.get("set-cookie")
            return res.json()
        }).then(res => {
            expect(res.username).toEqual('mrj3456');
            expect(res.result).toEqual('success');
            done();
        });
    });


    it('update headline', (done) => {
        let headline = {headline: 'I am headline'};
        fetch(url('/headline'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json',
                'cookie': cookie},
            body: JSON.stringify(headline)
        }).then(res => res.json()).then(res => {
            expect(res.headline).toEqual('I am headline');
            done();
        });
    });

    it('get headline', (done) => {
        fetch(url('/headline'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json',
                'cookie': cookie},
        }).then(res => res.json()).then(res => {
            expect(res.headline).toEqual('I am headline');
            done();
        });
    });

    it('get articles', (done) => {
        fetch(url('/articles'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json',
                'cookie': cookie},
        }).then(res => res.json()).then(res => {
            if (res.articles instanceof Array)
                expect(res.articles.length).toEqual(0);
            done();
        });
    });

    it('get article id', (done) => {
        fetch(url('/articles/0'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json',
                'cookie': cookie},
        }).then(res => res.json()).then(res => {
            if (res.articles instanceof Array)
                expect(res.articles.length).toEqual(1);
            done();
        });

        fetch(url('/articles/1000'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json',
                'cookie': cookie},
        }).then(res => {
            expect(res.status).toEqual(404);
            done();
        });
    });


    it('add an article', (done) => {
        let text = {text: 'I am text'};
        fetch(url('/article'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',
                        'cookie': cookie},
            body: JSON.stringify(text)
        }).then(res => res.json()).then(res => {
            if (res.articles instanceof Array)
                expect(res.articles.length).toEqual(1);
                expect(res.articles[0].text).toEqual('I am text')
            done();
        });
    });

    it('logout user', (done) => {
        fetch(url('/logout'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'cookie': cookie},
        }).then(res => {
            expect(res.status).toEqual(200);
            done();
        });

        fetch(url('/articles'), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json',
                'cookie': cookie},
        }).then(res => {
            expect(res.status).toEqual(401);
            done();
        });

    });


});
