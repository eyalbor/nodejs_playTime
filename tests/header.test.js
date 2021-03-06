const Page = require('./helpers/page');

let page;

//invoke before every single test is executed
beforeEach(async () => {
    page = await Page.build();
    await page.goto('localhost:3000');
})

afterEach(async () => {
    //some issue here
    await page.close();
})

test('the header as the correct text', async () => {
    const text = await page.getContectsOf('a.brand-logo');
    expect(text).toEqual('Blogster');
});

test('clicking login start oauth flow', async () =>{
    await page.click('.right a');
    const url = await page.url();
    expect(url).toMatch(/accounts\.google\.com/);
});

test('When signed in, shows logout button', async () => {
    //const id = '5fa988964cc8263510ec2cc4';

    await page.login();

    const text = await page.getContectsOf('a[href="/auth/logout"]');
    expect(text).toEqual('Logout');
});