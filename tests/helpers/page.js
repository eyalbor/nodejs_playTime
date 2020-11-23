const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory')

//it is better to call it Page
class CustomPage {
    static async build(){
        const browser = await puppeteer.launch({
            headless: false
        });
        
        const page = await browser.newPage();
        const customPage = new CustomPage(page);
    
        return new Proxy(customPage, {
            get: function(target, property) {
                return customPage[property] || browser[property] || page[property];
                //now we can manage access to the browser from customPage too.
            }
        });
    }

    constructor(page){
        this.page = page;
    }

    async login(){
        const user = await userFactory();
        const { session, sig} = sessionFactory(user);
        console.log(sessionString + " " + sig);
        await this.page.setCookie({ name: 'session', value: session });
        await this.page.setCookie({ name: 'session.sig', value: sig });
        await this.page.goto('localhost:3000/blogs');
        
        await this.page.waitFor('a[href="/auth/logout"]');
    }

    async getContectsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }

    get(path){
        //evaluate take all the code turn into string and send it to chrome
        return this.page.evaluate(
            (_path) => {
                return fetch(_path, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers:{
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json());
            }, path);
    }

    post(path, data){
        return this.page.evaluate(
            (_path, _data) => {
                return fetch(_path, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers:{
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(_data)
                }).then(res => res.json());
            },
            path,
            data);
    }

    execRequests(actions) {
        return Promise.all(
            actions.map(({ method, path, data }) => {
                //this = page
                return this[method](path, data);
                //return array of promises, we need to wait for all of them to be resolve
            })
        );
    }

}

module.exports = CustomPage;