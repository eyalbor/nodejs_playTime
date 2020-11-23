const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('localhost:3000');
});

afterEach(async ()=> {
    await page.close();
});


describe('When logged in', async () => {
    beforeEach( async () =>{
        //we are getting to route /blogs
        await page.login();
        await page.click('a.btn-floating');
    });

    test('can see blog create form', async () =>{
        const label = await page.getContentsOf('from label');
        expect(label).toEqual('Blog Title')
    });

    describe('And using valid input', async () => {
        beforeEach(async () => {
            await page.type('.title input', 'My Title' )
            await page.type('.content input', 'My Content' )
            await page.click('form button');
        });

        test('Submitting takes user to review screen', async () => {
            const text = await page.getContentsOf('h5');
            except(text).toEqual('Please confirm your entries');
        });

        test('Submitting then saving adds blog', async () => {
            await page.click('button.green');
            //wait for the server
            await page.waitFor('.card');

            const title = await page.getContentsOf('.card-title');
            const content = await page.getContentsOf('p');

            except(title).toEqual('My Title');
            except(content).toEqual('My Content');
        });
    })

    describe('And using invalid input', async () => {
        beforeEach(async () => {
            await page.click('form button');
        });

        test('the form shows an error message', async () => {
            const titleError =  await page.getContentsOf('.title .red-text');
            except(titleError).toEqual('You must provide a value');
            const contentError =  await page.getContentsOf('.title .red-text');
            except(contentError).toEqual('You must provide a value');
        });
    })
});

describe('User is not logged in', async () =>{
    test('User cannot create blog post', async ()=>{
        const result = await page.evaluate(
            () => {
                return fetch('/api/blogs', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers:{
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({title: 'My Title', content: 'My Content'})
                }).then(res => res.json());
            }
        );
        except(result).toEqual({ error: 'You must log in!' })
    });

    test('User cannot get blogs post', async ()=>{
        const result = await page.evaluate(
            () => {
                return fetch('/api/blogs', {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers:{
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json());
            }
        );
        except(result).toEqual({ error: 'You must log in!' })
    });
});