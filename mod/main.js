if (!FortuneHelper) var FortuneHelper = {
    name: 'FortuneHelper',
    version: '2.8',
    gameVersion: '2.048',

    config: {
        fortune: 0,
        fortuneall: 0,
        golden: 0,
        alsowrath: 1,
        reindeer: 0,
        wrinkler: 0,
        research: 0,
        pledge: 0,
        click: 10,
        clickalways: 0,
        fortunesound: 1,
        goldensound: 1,
        muteclick: 0,
        chocolateegg: 1
    },

    isLoaded: false,
    playedfortune: false,
    playedgolden: false,
    clickInterval: null,

    init: function() {
        Game.customOptionsMenu.push(this.addOptionsMenu);
        setInterval(this.logicLoop, 200);
        this.updateAutoclicker();
        CCSE.SpliceCodeIntoFunction('Game.playCookieClickSound', 2, 'if (FortuneHelper.config.muteclick) return;');
        CCSE.SpliceCodeIntoFunction('Game.Ascend', 5, 'FortuneHelper.preAscend();');
        this.isLoaded = true;
    },

    load: function(str) {
        const config = JSON.parse(str);
        for(const c in config) this.config[c] = config[c];
        this.updateAutoclicker();
    },

    save: function() {
        return JSON.stringify(this.config);
    },

    register: function() {
        if (CCSE.ConfirmGameVersion(this.name, this.version, this.gameVersion)) {
            Game.registerMod(this.name, this);
        }
    },

    logicLoop: function() {
        // Fortune tickers
        if (Game.TickerEffect && Game.TickerEffect.type === 'fortune') {
            if (this.config.fortune && (this.config.fortuneall || Game.TickerEffect.sub !== 'fortuneGC' && Game.TickerEffect.sub !== 'fortuneCPS')) {
                Game.tickerL.click();
            } else if (this.config.fortunesound && !this.playedfortune) {
                PlaySound('snd/fortune.mp3');
                this.playedfortune = true;
            }
        } else {
            this.playedfortune = false;
        }

        // Golden cookies and reindeers
        let anygolden = false;
        for (const shimmer of Game.shimmers) {
            if (shimmer.type === 'golden') {
                anygolden = true;
                if (this.config.golden && (!shimmer.wrath || shimmer.force === 'cookie storm drop' || this.config.alsowrath)) {
                    shimmer.pop();
                } else if (this.config.goldensound && !Game.chimeType && !this.playedgolden && shimmer.force !== 'cookie storm drop') {
                    PlaySound('snd/chime.mp3');
                    this.playedgolden = true;
                }
            } else if (shimmer.type === 'reindeer' && this.config.reindeer) {
                shimmer.pop();
            }
        }
        if (!anygolden) this.playedgolden = false;

        // Wrinklers
        if (this.config.wrinkler) {
            for (const wrinkler of Game.wrinklers) {
                if (wrinkler.hp > 0.5 && wrinkler.sucked > 0.5 && wrinkler.type !== 1) { // preserve shiny wrinklers
                    wrinkler.hp = -10;
                }
            }
        }

        // Research
        if (this.config.research || this.config.pledge) {
            for (const upgrade of Game.UpgradesInStore) {
                if (this.config.research && upgrade.pool === 'tech'
                    || this.config.pledge && upgrade.name === 'Elder Pledge'
                    || upgrade.name === 'Sacrificial rolling pins') {
                    upgrade.buy(1);
                }
            }
        }

        // Chocolate egg
        if (this.config.chocolateegg && Game.Has('Inspired checklist') && !Game.Upgrades['Chocolate egg'].isVaulted()){
            Game.Upgrades['Chocolate egg'].vault();
            Game.upgradesToRebuild=1;
        }
    },

    updateAutoclicker: function() {
        const value = this.config.click;
        if (this.clickInterval != null) {
            clearInterval(this.clickInterval);
        }
        if (value > 0) {
            this.clickInterval = setInterval(function() {
                if (FortuneHelper.config.clickalways) {
                    Game.ClickCookie(0);
                } else {
                    let totalMultCPS = 1;
                    for (const i in Game.buffs) { // Can't use "of" because it's not an array
                        const buff = Game.buffs[i];
                        if (buff.multCpS > 1) totalMultCPS *= buff.multCpS;
                        if (totalMultCPS > 50 || buff.multClick > 1 || buff.name == 'Cursed finger'){
                            Game.ClickCookie(0);
                            break;
                        }
                    }
                }
            }, 1000/value); 
        } else {
            this.clickInterval = null;
        }
    },

    preAscend: function() {
        const egg = Game.Upgrades['Chocolate egg'];
        if (this.config.chocolateegg && egg.unlocked && !egg.bought) {
            // Switch aura
            if (Game.dragonLevel >= 8 && !Game.hasAura('Earth Shatterer')) {
                const earthShatterer = 5, realityBending = 18;
                Game.SelectingDragonAura = earthShatterer;
                if (Game.dragonAura === realityBending) Game.dragonAura2 = earthShatterer;
                else Game.dragonAura = earthShatterer;
                let highestBuilding = null;
                for (var i in Game.Objects) {
                    if (Game.Objects[i].amount) highestBuilding = Game.Objects[i];
                }
                if (highestBuilding) {
                    Game.ObjectsById[highestBuilding.id].sacrifice(1);
                }
            }
            // Sell buildings
            for (var i in Game.Objects) {
                const building = Game.Objects[i];
                if (building.amount) building.sell(building.amount);
            }
            // Profit
            egg.buy(1);
        }
    },




    /* Menu */

    addOptionsMenu: function() {
        const body = `
        ${this.header('Sounds')}
        <div class="listing">
            ${this.button('goldensound', 'Golden Cookie Alert ON (override)', 'Golden Cookie Alert OFF (default)')}
        </div><div class="listing">
            ${this.button('fortunesound', 'Fortune Ticker Alert ON', 'Fortune Ticker Alert OFF')}
        </div><div class="listing">
            ${this.button('muteclick', 'Mute Big Cookie ON', 'Mute Big Cookie OFF')}
        </div>
        <br>
        ${this.header('Auto-Clicker')}
        <div class="listing">
            ${this.slider('click', 'Clicks Per Second', 0, 30)}
        </div><div class="listing">
            ${this.button('clickalways', 'Mode: Always active', 'Mode: Only active during big buffs')}
        </div>
        <br>
        ${this.header('Other Clickers')}
        <div class="listing">
            ${this.button('golden', 'Click Golden Cookies ON', 'Click Golden Cookies OFF')}
            ${this.button('alsowrath', 'Mode: Include Wrath Cookies', 'Mode: Exclude Wrath Cookies', 9)}
        </div><div class="listing">
            ${this.button('fortune', 'Click Fortune Tickers ON', 'Click Fortune Tickers OFF')}
            ${this.button('fortuneall', 'Mode: All Fortunes', 'Mode: Unlockable Fortunes Only', 9)}
        </div><div class="listing">
            ${this.button('research', 'Auto-Research ON', 'Auto-Research OFF')}
            ${this.button('pledge', 'Auto-Pledge ON', 'Auto-Pledge OFF')}
        </div><div class="listing">
            ${this.button('reindeer', 'Click Reindeer ON', 'Click Reindeer OFF')}
            ${this.button('wrinkler', 'Pop Wrinklers ON', 'Pop Wrinklers OFF')}
        </div>
        <br>
        ${this.header('Advanced')}
        <div class="listing">
            ${this.button('chocolateegg', 'Automatic Chocolate Egg ON', 'Automatic Chocolate Egg OFF')}
            <label>Vaults the chocolate egg upgrade if unlocked. On ascend, buys it at max efficiency to get you some extra prestige levels.</label>
        </div>`;

        CCSE.AppendCollapsibleOptionsMenu(this.name, body)
    },

    header: function(title) {
        return `<div class="listing" style="padding: 5px 16px; opacity: 0.7; font-size: 17px; font-family: Kavoon, Georgia, serif;">${title}</div>`
    },

    slider: function(config, text, min, max) {
        const name = `FortuneHelper${config}slider`;
        const value = this.config[config];
        const callback = `FortuneHelper.sliderCallback('${config}', '${name}');`
        return `
        <div class="sliderBox">
            <div style="float:left;">${text}</div>
            <div style="float:right;" id="${name}Value">${value}</div>
            <input class="slider" id="${name}" style="clear:both;" type="range" min="${min}" max="${max}" step="1" value="${value}" 
                onchange="${callback}" oninput="${callback}" onmouseup="PlaySound(\'snd/tick.mp3\');"/>
        </div>`;
    },

    sliderCallback: function(config, slider) {
        const value = Math.round(l(slider).value);
        l(slider+'Value').innerHTML = value;
        this.config[config] = value;

        if (config === 'click') this.updateAutoclicker();
    },

    button: function(config, texton, textoff, size) {
        const name = `FortuneHelper${config}button`;
        const callback = `FortuneHelper.buttonCallback('${config}', '${name}', '${texton}', '${textoff}');`
        const value = this.config[config];
        return `<a class="${value ? 'option' : 'option off'}" id="${name}" style="font-size:${size ? size : 12}px;"
            ${Game.clickStr}="${callback}">${value ? texton : textoff}</a>`
    },

    buttonCallback: function(config, button, texton, textoff) {
        const value = !this.config[config];
        this.config[config] = value;
        l(button).innerHTML = value ? texton : textoff
        l(button).className = value ? 'option' : 'option off'
        PlaySound('snd/tick.mp3');
    },
};

// Bind methods
for (func of Object.getOwnPropertyNames(FortuneHelper).filter(m => typeof FortuneHelper[m] === 'function')){
    FortuneHelper[func] = FortuneHelper[func].bind(FortuneHelper);
}

// Load mod
if(!FortuneHelper.isLoaded){
    if(CCSE && CCSE.isLoaded){
        FortuneHelper.register();
    }
    else{
        if(!CCSE) var CCSE = {};
        if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(FortuneHelper.register);
    }
}
