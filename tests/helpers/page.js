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
        await this.page.goto('localhost:3000');
        
        await this.page.waitFor('a[href="/auth/logout"]');
    }
}

module.exports = CustomPage;