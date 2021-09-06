var FortuneHelper = {
	name: 'FortuneHelper',
	version: '2.3',
	GameVersion: '2.04',

	config: {
		fortune: 0,
		fortuneall: 0,
		golden: 0,
		alsowrath: 1,
		reindeer: 0,
		wrinkler: 0,
		click: 10,
		clickalways: 0,
		fortunesound: 1,
		goldensound: 1,
		muteclick: 0
	},

	isLoaded: false,
	playedfortune: false,
	playedgolden: false,
	clickInterval: null,

	init: function() {
		this.isLoaded = true;

		setInterval(this.LogicLoop.bind(this), 200);

		this.UpdateAutoclicker(this.config.click);

		Game.customOptionsMenu.push(function() {
			CCSE.AppendCollapsibleOptionsMenu(FortuneHelper.name, FortuneHelper.OptionsMenu());
		});

		CCSE.SpliceCodeIntoFunction('Game.playCookieClickSound', 2, 'if (FortuneHelper.config.muteclick) return;');
	},

	load: function(str) {
		const config = JSON.parse(str);
		for(const c in config) this.config[c] = config[c];
		this.UpdateAutoclicker(this.config.click);
	},

	save: function() {
		return JSON.stringify(this.config);
	},

	launch: function() {
		if (CCSE.ConfirmGameVersion(this.name, this.version, this.GameVersion)) {
			Game.registerMod(this.name, FortuneHelper);
		}
	},

	LogicLoop: function() {
		// Fortune tickers
		if (Game.TickerEffect && Game.TickerEffect.type === 'fortune'){
			if (this.config.fortune && (this.config.fortuneall || (Game.TickerEffect.sub !== 'fortuneGC' && Game.TickerEffect.sub !== 'fortuneCPS'))){
				Game.tickerL.click();
			} else if (this.config.fortunesound && !this.playedfortune) {
				PlaySound('snd/fortune.mp3');
			}
			this.playedfortune = true;
		} else {
			this.playedfortune = false;
		}

		// Golden cookies and reindeers
		let anygolden = false;
		for (const i in Game.shimmers) { const shimmer = Game.shimmers[i];
			if (shimmer.type === 'golden') {
				anygolden = true;
				if (this.config.golden && (!shimmer.wrath || this.config.alsowrath)) {
					shimmer.pop();
				} else if (this.config.goldensound && !Game.chimeType && !this.playedgolden) {
					PlaySound('snd/chime.mp3');
					this.playedgolden = true;
				}
			} else if (shimmer.type === 'reindeer' && this.config.reindeer) {
				shimmer.pop();
			}
		}
		if (!anygolden) this.playedgolden = false;

		// Wrinklers
		for (const i in Game.wrinklers) { const wrinkler = Game.wrinklers[i];
			if (this.config.wrinkler && wrinkler.hp > 0.5 && wrinkler.sucked > 0.5) {
				wrinkler.hp = -10;
			}
		}
	},

	UpdateAutoclicker: function(value) {
		if (this.clickInterval != null) {
			clearInterval(this.clickInterval);
		}
		if (value > 0) {
			this.clickInterval = setInterval(function() {
				if (FortuneHelper.config.clickalways) {
					Game.ClickCookie(0);
				} else {
					let totalMultCPS = 1;
					for (const i in Game.buffs){ const buff = Game.buffs[i];
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




	/* Options Menu */

	OptionsMenu: function() {
		return `
		${CCSE.MenuHelper.Header('Sounds')}
		<div class="listing">
			${this.Button('goldensound', 'Golden Cookie Alert ON (override)', 'Golden Cookie Alert OFF (default)')}
		</div><div class="listing">
			${this.Button('fortunesound', 'Fortune Ticker Alert ON', 'Fortune Ticker Alert OFF')}
		</div><div class="listing">
			${this.Button('muteclick', 'Mute Big Cookie ON', 'Mute Big Cookie OFF')}
		</div>
		<br>
		${CCSE.MenuHelper.Header('Autoclicker')}
		<div class="listing">
			${this.Slider('click', 'Clicks Per Second', 0, 30)}
		</div><div class="listing">
			${this.Button('clickalways', 'Mode: Always active', 'Mode: Only active during click buffs')}
		</div>
		<br>
		${CCSE.MenuHelper.Header('Other Clicks')}
		<div class="listing">
			${this.Button('golden', 'Click Golden Cookies ON', 'Click Golden Cookies OFF')}
			${this.Button('alsowrath', 'Include Wrath Cookies', 'Exclude Wrath Cookies')}
		</div><div class="listing">
			${this.Button('fortune', 'Click Fortune Tickers ON', 'Click Fortune Tickers OFF')}
			${this.Button('fortuneall', 'Include Buffs', 'Unlockables Only')}
		</div><div class="listing">
			${this.Button('reindeer', 'Click Reindeer ON', 'Click Reindeer OFF')}
		</div><div class="listing">
			${this.Button('wrinkler', 'Pop Wrinklers ON', 'Pop Wrinklers OFF')}
		</div>`;
	},

	Slider: function(config, text, min, max) {
		const name = `FortuneHelper${config}Slider`;
		const value = this.config[config];
		const callback = `FortuneHelper.SliderCallback('${config}', '${name}');`
		return `
		<div class="sliderBox">
			<div style="float:left;">${text}</div>
			<div style="float:right;" id="${name}Value">${value}</div>
			<input class="slider" id="${name}" style="clear:both;" type="range" min="${min}" max="${max}" step="1" value="${value}" 
				onchange="${callback}" oninput="${callback}" onmouseup="PlaySound(\'snd/tick.mp3\');"/>
		</div>`;
	},

	SliderCallback: function(config, slider) {
		const value = Math.round(l(slider).value);
		l(slider+'Value').innerHTML = value;
		this.config[config] = value;

		if (config === 'click') this.UpdateAutoclicker(value);
	},

	Button: function(config, texton, textoff) {
		const name = `FortuneHelper${config}Button`;
		const callback = `FortuneHelper.ButtonCallback('${config}', '${name}', '${texton}', '${textoff}');`
		const value = this.config[config];
		return `<a class="${value ? 'option' : 'option off'}" id="${name}" ${Game.clickStr}="${callback}">${value ? texton : textoff}</a>`
	},

	ButtonCallback: function(config, button, texton, textoff) {
		const value = !this.config[config];
		this.config[config] = value;
		l(button).innerHTML = value ? texton : textoff
		l(button).className = value ? 'option' : 'option off'
		PlaySound('snd/tick.mp3');
	},
};

if(!FortuneHelper.isLoaded){
	if(CCSE && CCSE.isLoaded){
		FortuneHelper.launch();
	}
	else{
		if(!CCSE) var CCSE = {};
		if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
		CCSE.postLoadHooks.push(FortuneHelper.launch.bind(FortuneHelper));
	}
}
