var tconfig,
    chai = require("chai"),
    expect = chai.expect;
const puppeteer = require('puppeteer');
const compareThreshold = 5;
var browser;
var page;
const resemble = require("resemblejs");
const fs = require("fs");
var count = 0;
var rawdata = fs.readFileSync('src/config.json');  
tconfig = JSON.parse(rawdata);
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
    function getEventName(input) {
        var out = "";
        switch (input) {
            case "0":
                out = "";
                break;
            case "1":
                out = "click";
                break;
            case "2":
                out = "change";
                break;
            case "3":
                out = "mouseover";
                break;
            case "4":
                out = "keypress";
                break;
            case "5":
                out = "keyup";
                break;
            case "6":
                out = "keydown";
                break;
            case "7":
                out = "focus";
                break;
            case "8":
                out = "blur";
                break;
            case "9":
                out = "rightclick";
                break;
            case "10":
                out = "doubleclick";
                break;
            case "11":
                out = "submit";
                break;
        }
        return out;
    }
    async function runTest(config) {
        // console.log(config)
        var evnt = config,
            ssConfig = {path: 'test.png'},
            i,
            screens = config.screens,
            screen,
            ename = getEventName(evnt.event),
            len = screens.length;
        if (config.dim) {
            await page.setViewport({
                width: config.dim.width,
                height: config.dim.height
            })
        }
        if (config.URL) {
            await page.goto(config.URL);
        }
        if (ename) {
            console.log("Event name ===> " + ename);
            evnt.name = ename;
            await evaluate(function (evnt) {
                var node;
                if (evnt.node) {
                    node = document.querySelector(evnt.node);
                } else if (evnt.xnode) {
                    node = document.evaluate(evnt.xnode, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                }
                if (evnt.evalue) {
                    node.value = evnt.evalue;
                }
                var e = document.createEvent('HTMLEvents');
                e.initEvent(evnt.name, false, true);
                node.dispatchEvent(e);
            }, evnt);
        }
        await delay(evnt.timer * 1000);
        for (i = 0; i < len; i++) {
            count++;
            screen = screens[i];
            console.log(screen.node);
            if (screen.clip) {
                ssConfig.clip = screen.clip;
            } else if (screen.node) {
                ssConfig.clip = await getNodeClip(screen.node);
            }
            await page.screenshot(ssConfig);
            await runResemble(screen);
        }
        
    }
    async function getNodeClip(cssSel) {
        console.log(cssSel)
        try {
            var clip = await evaluate(function (cssSel) {
                var node = document.querySelector(cssSel),
                    rect = node.getBoundingClientRect();
                return {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                };
            }, cssSel);
        } catch (e) {
            clip = {x:0, y:0, width: 1000, height: 1000};
        }  
        return clip;
    }
    function runResemble (config) {
        var p = new Promise(function (resolve, reject) {
            var file = config.image;
            resemble(file).compareTo("test.png").ignoreLess().onComplete(function(data){
                fs.writeFileSync('out/error-' + count + '.png', data.getBuffer());
                expect(parseInt(data.misMatchPercentage), "Test: " + config.png).to.be.below(compareThreshold);
                expect(data.isSameDimensions).to.equal(true);
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
                configs = tconfig,
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