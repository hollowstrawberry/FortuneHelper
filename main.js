if (FortuneHelper === undefined) var FortuneHelper = {
	name: 'FortuneHelper',
	version: '2.0',
	GameVersion: '2.04',

	init: function() {
		FortuneHelper.isLoaded = 1;
		if (FortuneHelper.config == null) {
			FortuneHelper.config = {
				fortune: 0,
				fortuneall: 0,
				golden: 0,
				alsowrath: 1,
				reindeer: 0,
				wrinkler: 0,
				click: 10,
				clickonlyfrenzy: 1,
				fortunesound: 1,
				goldensound: 1
			};
		}
		
		Game.customOptionsMenu.push(function(){
			CCSE.AppendCollapsibleOptionsMenu(FortuneHelper.name, FortuneHelper.GetMenuString());
		});

		FortuneHelper.playedfortune = false;
		FortuneHelper.playedgolden = false;
		setInterval(FortuneHelper.LogicLoop, 200);

		FortuneHelper.clickInterval = null;
		FortuneHelper.UpdateClicker(FortuneHelper.config.click);
		
		if (Game.prefs.popups) Game.Popup(FortuneHelper.name + ' loaded!');
		else Game.Notify(FortuneHelper.name + ' loaded!', '', '', 1, 1);
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
		for (var i in Game.shimmers) {
			var shimmer = Game.shimmers[i];
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
		for (var i in Game.wrinklers) {
			var wrinkler = Game.wrinklers[i];
			if (FortuneHelper.config.wrinkler && wrinkler.hp > 0.5 && wrinkler.sucked > 0.5) {
				wrinkler.hp = -10;
			}
		}
	},

	UpdateClicker: function(value) {
		FortuneHelper.config.click = value;
		if (FortuneHelper.clickInterval != null) {
			clearInterval(FortuneHelper.clickInterval);
		}
		if (value > 0) {
			FortuneHelper.clickInterval = setInterval(function() {
				if (!FortuneHelper.config.clickonlyfrenzy) {
					Game.ClickCookie(0);
				} else {
					for (var i in Game.buffs){
						if (Game.buffs[i].multClick > 1 || Game.buffs[i].multCps > 100 || Game.buffs[i].name == 'Cursed finger'){
							Game.ClickCookie(0);
							break;
						}
					}
				}
			}, 1000 / value); 
		} else {
			FortuneHelper.clickInterval = null;
		}
	},

	GetMenuString: function() {
		var m = CCSE.MenuHelper;
		return "" +
			'<div class="listing">' +
			m.ToggleButton(
				FortuneHelper.config, 'goldensound', 'FortuneHelper_goldenSoundButton',
				'Golden Cookie Sound ON (override)', 'Golden Cookie Sound OFF (default)', "FortuneHelper.Toggle") +
			'</div><div class="listing">' +
			m.ToggleButton(
				FortuneHelper.config, 'fortunesound', 'FortuneHelper_fortuneSoundButton',
				'Fortune Ticker Sound ON', 'Fortune Ticker Sound OFF', "FortuneHelper.Toggle") +
			'</div><br><br><div class="listing">' +
			m.Slider(
				'clickSlider', 'Autoclicker Speed', '[$]',
				function () { return FortuneHelper.config.click; },
				"FortuneHelper.UpdateClicker(Math.round(l('clickSlider').value)); l('clickSliderRightText').innerHTML = l('clickSlider').value;",
				0, 30, 1) +
			'</div><div class="listing">	' +
			m.ToggleButton(
				FortuneHelper.config, 'clickonlyfrenzy', 'FortuneHelper_frenzyButton',
				'Autoclicker Mode: Only when buffed', 'Autoclicker Mode: Normal', "FortuneHelper.Toggle") +
			'</div><br><div class="listing">' +
			m.ToggleButton(
				FortuneHelper.config, 'golden', 'FortuneHelper_goldenButton',
				'Click Golden Cookies ON', 'Click Golden Cookies OFF', "FortuneHelper.Toggle") +
			m.ToggleButton(
				FortuneHelper.config, 'alsowrath', 'FortuneHelper_wrathButton',
				'Include Wrath Cookies', 'Exclude Wrath Cookies', "FortuneHelper.Toggle") +
			'</div><div class="listing">' +
			m.ToggleButton(
				FortuneHelper.config, 'fortune', 'FortuneHelper_fortuneButton',
				'Click Fortune Tickers ON', 'Click Fortune Tickers OFF', "FortuneHelper.Toggle") +
			m.ToggleButton(
				FortuneHelper.config, 'fortuneall', 'FortuneHelper_fortuneallButton',
				'Include Buffs', 'Unlockables Only', "FortuneHelper.Toggle") +
			'</div><div class="listing">' +
			m.ToggleButton(
				FortuneHelper.config, 'reindeer', 'FortuneHelper_reindeerButton',
				'Click Reindeer ON', 'Click Reindeer OFF', "FortuneHelper.Toggle") +
			'</div><div class="listing">' +
			m.ToggleButton(
				FortuneHelper.config, 'wrinkler', 'FortuneHelper_wrinklerButton',
				'Pop Wrinklers ON', 'Pop Wrinklers OFF', "FortuneHelper.Toggle") +
			'</div>';
	},

	Toggle: function(prefName, button, on, off, invert) {
		if(FortuneHelper.config[prefName]){
			l(button).innerHTML = off;
			FortuneHelper.config[prefName] = 0;
		}
		else{
			l(button).innerHTML = on;
			FortuneHelper.config[prefName] = 1;
		}
		l(button).className = 'option' + ((FortuneHelper.config[prefName] ^ invert) ? '' : ' off');
	},

	save: function() {
		return JSON.stringify(FortuneHelper.config);
	},

	load: function(str) {
		var config = JSON.parse(str);
		for(var pref in config){
			FortuneHelper.config[pref] = config[pref];
		}
		
		FortuneHelper.UpdateClicker(FortuneHelper.config.click);
	},

	launch: function() {
		if(CCSE.ConfirmGameVersion(FortuneHelper.name, FortuneHelper.version, FortuneHelper.GameVersion)) {
			Game.registerMod(FortuneHelper.name, FortuneHelper);
		}
	}
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
