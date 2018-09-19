var tconfig = require("./config.ts");
    chai = require("chai"),
    expect = chai.expect;
const puppeteer = require('puppeteer');
const compareThreshold = 0.1;
var browser;
var page;
const resemble = require("resemblejs");
const fs = require("fs");
describe("Test suite", function() {
    before(function(done) {
        this.timeout(10000);
        (async function() {
            browser = await puppeteer.launch({headless: true});
            page = await browser.newPage();
            // const dimensions = await page.evaluate(() => {
            //     return {
            //     width: document.documentElement.clientWidth,
            //     height: document.documentElement.clientHeight,
            //     deviceScaleFactor: window.devicePixelRatio
            //     };
            // });
            // console.log('Dimensions:', dimensions);
            done();
        }());
    });
    function evaluate(func, arg) {
        var args = arg;
        var fn = "(" + func.toString() + ").apply(this, [" + JSON.stringify(args) + "]);";
        // console.log(fn);
        return page.evaluate(fn);
    }
    async function runTest(config) {
        console.log(config)
        var events = config.events,
            evnt,
            ssConfig = {path: 'test.png'},
            i,
            len;
        if (config.dim) {
            await page.setViewport({
                width: config.dim.width,
                height: config.dim.height
            })
        }
        if (config.URL) {
            await page.goto(config.URL);
        }
        
        if (events) {
            len = events.length;
            for (i = 0; i < len; i++) {
                evnt = events[i];
                await evaluate(function (evnt) {
                    var node;
                    if (evnt.node) {
                        node = document.querySelector(evnt.node);
                    } else if (evnt.xnode) {
                        node = document.evaluate(evnt.xnode, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    }
                    if (evnt.value) {
                        node.value = evnt.value;
                    }
                    var e = document.createEvent('HTMLEvents');
                    e.initEvent(evnt.name, false, true);
                    node.dispatchEvent(e);
                }, evnt);
                await delay(evnt.delay);
            }
        }
        await delay(config.delay);
        if (config.clip) {
            ssConfig.clip = config.clip;
        } else if (config.clipNode) {
            ssConfig.clip = await getNodeClip(config.clipNode);
        }
        await page.screenshot(ssConfig);
        await runResemble(config);
    }
    async function getNodeClip(cssSel) {
        var clip = await page.evaluate(() => {
            var node = document.querySelector(cssSel),
                rect = node.getBoundingClientRect();
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            };
        });
        return clip;
    }
    function runResemble (config) {
        var p = new Promise(function (resolve, reject) {
            var file = 'res/' + config.png;
            resemble(file).compareTo("test.png").ignoreLess().onComplete(function(data){
                fs.writeFileSync('out/error-' + config.png, data.getBuffer());
                expect(parseInt(data.misMatchPercentage), "Test: " + config.png).to.be.below(compareThreshold);
                expect(data.isSameDimensions).to.equal(true);
                fs.unlinkSync('out/error-' + config.png);
                resolve(true);
            }); 
        });
        return p;
    }
    function delay(ms) {
        return new Promise(function (resolve) {
            console.log("Waiting for "+ ms)
            setTimeout(function () {
                console.log("done");
                resolve();   
            }, ms);
        });
    }
    it("File Comparison", function(done) {
        (async () => {
            this.timeout(2000000);
            var i,
                configs = tconfig.testConfig,
                len = configs.length,
                config;
            console.log("Starting the tests...")
            for (i = 0; i < len; i++) {
                config = configs[i];
                try {
                    await runTest(config);
                } catch (e) {
                    await browser.close();
                    console.log("Failed: "+ JSON.stringify(config));
                    done(e);
                    return;
                }
            }
            await browser.close();
            done();
        })();
    });
  });