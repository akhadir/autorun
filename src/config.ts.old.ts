export var testConfig  = [
    {
        "URL": 'http://rhelhubqa001:8080/bdd/config',
        "events": null,
        "png": "login.png",
        "delay": 0,
        "dim": {width: 800, height: 600},
        "clip": {x: 10, y: 10, width: 790, height: 790}
    },
    {
        "URL": null,
        "dim": {width: 800, height: 600},
        "events": [{
            "xnode": "//input[contains(@id,'username')]",
            "name": "click",
            "value": "admin",
            "delay": 0
        },{
            "xnode": "//input[contains(@id,'password')]",
            "name": "click",
            "value": "admin",
            "delay": 3000
        },{
            "xnode": "//a[contains(@id,'login')]",
            "name": "mousedown",
            "value": null,
            "delay": 0
        }],
        "png": "landing.png",
        "delay": 35000
    },
    {
        URL: null,
        png: "menu-login.png",
        events: [{
            delay: 0,
            node: "#infaMenu1 td.infaMenuItem:nth(0)",
            name: "mouseover",
            value: null
        }],
        delay: 1000
    }
]