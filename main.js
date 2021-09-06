let FortuneHelper = {
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

	playedfortune: false,
	playedgolden: false,
	clickInterval: null,

	init: function() {
		setInterval(FortuneHelper.LogicLoop, 200);

		FortuneHelper.UpdateAutoclicker(FortuneHelper.config.click);

		Game.customOptionsMenu.push(function() {
			CCSE.AppendCollapsibleOptionsMenu(FortuneHelper.name, FortuneHelper.OptionsMenu());
		});

		CCSE.SpliceCodeIntoFunction('Game.playCookieClickSound', 2, 'if (FortuneHelper.config.muteclick) return;');
	},

	load: function(str) {
		const config = JSON.parse(str);
		for(var c in config) FortuneHelper.config[c] = config[c];
		FortuneHelper.UpdateAutoclicker(FortuneHelper.config.click);
	},

	save: function() {
		return JSON.stringify(FortuneHelper.config);
	},

	launch: function() {
		if (CCSE.ConfirmGameVersion(FortuneHelper.name, FortuneHelper.version, FortuneHelper.GameVersion)) {
			Game.registerMod(FortuneHelper.name, FortuneHelper);
		}
	},

	LogicLoop: function() {
		// Fortune tickers
		if (Game.TickerEffect && Game.TickerEffect.type == 'fortune'){
			if (FortuneHelper.config.fortune && (FortuneHelper.config.fortuneall || (Game.TickerEffect.sub != 'fortuneGC' && Game.TickerEffect.sub != 'fortuneCPS'))){
				Game.tickerL.click();
			} else if (FortuneHelper.config.fortunesound && !FortuneHelper.playedfortune) {
				PlaySound('snd/fortune.mp3');
			}
			FortuneHelper.playedfortune = true;
		} else {
			FortuneHelper.playedfortune = false;
		}

		// Golden cookies and reindeers
		var anygolden = false;
		for (const i in Game.shimmers) { const shimmer = Game.shimmers[i];
			if (shimmer.type == 'golden') {
				anygolden = true;
				if (FortuneHelper.config.golden && (!shimmer.wrath || FortuneHelper.config.alsowrath)) {
					shimmer.pop();
				} else if (FortuneHelper.config.goldensound && !Game.chimeType && !FortuneHelper.playedgolden) {
					PlaySound('snd/chime.mp3');
					FortuneHelper.playedgolden = true;
				}
			} else if (shimmer.type == 'reindeer' && FortuneHelper.config.reindeer) {
				shimmer.pop();
			}
		}
		if (!anygolden) FortuneHelper.playedgolden = false;

		// Wrinklers
		for (const i in Game.wrinklers) { const wrinkler = Game.wrinklers[i];
			if (FortuneHelper.config.wrinkler && wrinkler.hp > 0.5 && wrinkler.sucked > 0.5) {
				wrinkler.hp = -10;
			}
		}
	},

	UpdateAutoclicker: function(value) {
		if (FortuneHelper.clickInterval != null) {
			clearInterval(FortuneHelper.clickInterval);
		}
		if (value > 0) {
			FortuneHelper.clickInterval = setInterval(function() {
				if (FortuneHelper.config.clickalways) {
					Game.ClickCookie(0);
				} else {
					for (const i in Game.buffs){ const buff = Game.buffs[i];
						if (buff.multClick > 1 || buff.multCpS > 100 || buff.name == 'Cursed finger'){
							Game.ClickCookie(0);
							break;
						}
					}
				}
			}, 1000/value); 
		} else {
			FortuneHelper.clickInterval = null;
		}
	},




	/* Options Menu */

	OptionsMenu: function() {
		const f = FortuneHelper;
		const h = CCSE.MenuHelper;
		return `
		${h.Header('Sounds')}
		<div class="listing">
			${f.Button('goldensound', 'Golden Cookie Alert ON (override)', 'Golden Cookie Alert OFF (default)')}
		</div><div class="listing">
			${f.Button('fortunesound', 'Fortune Ticker Alert ON', 'Fortune Ticker Alert OFF')}
		</div><div class="listing">
			${f.Button('muteclick', 'Mute Big Cookie ON', 'Mute Big Cookie OFF')}
		</div>
		<br>
		${h.Header('Autoclicker')}
		<div class="listing">
			${f.Slider('click', 'Clicks Per Second', 0, 30)}
		</div><div class="listing">
			${f.Button('clickalways', 'Mode: Always active', 'Mode: Only active during click buffs')}
		</div>
		<br>
		${h.Header('Other Clicks')}
		<div class="listing">
			${f.Button('golden', 'Click Golden Cookies ON', 'Click Golden Cookies OFF')}
			${f.Button('alsowrath', 'Include Wrath Cookies', 'Exclude Wrath Cookies')}
		</div><div class="listing">
			${f.Button('fortune', 'Click Fortune Tickers ON', 'Click Fortune Tickers OFF')}
			${f.Button('fortuneall', 'Include Buffs', 'Unlockables Only')}
		</div><div class="listing">
			${f.Button('reindeer', 'Click Reindeer ON', 'Click Reindeer OFF')}
		</div><div class="listing">
			${f.Button('wrinkler', 'Pop Wrinklers ON', 'Pop Wrinklers OFF')}
		</div>`;
	},

	Slider: function(config, text, min, max) {
		const name = `FortuneHelper${config}Slider`;
		const value = FortuneHelper.config[config];
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
		FortuneHelper.config[config] = value;

		if (config == 'click') FortuneHelper.UpdateAutoclicker(value);
	},

	Button: (config, texton, textoff) => {
		const name = `FortuneHelper${config}Button`;
		const callback = `FortuneHelper.ButtonCallback('${config}', '${name}', '${texton}', '${textoff}');`
		const value = FortuneHelper.config[config];
		return `<a class="${value ? 'option' : 'option off'}" id="${name}" ${Game.clickStr}="${callback}">${value ? texton : textoff}</a>`
	},

	ButtonCallback: function(config, button, texton, textoff) {
		const value = !FortuneHelper.config[config];
		FortuneHelper.config[config] = value;
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
		CCSE.postLoadHooks.push(FortuneHelper.launch);
	}
}
