/*

LAOS - The mandarin learning toolbox
Written by Nassim El Khantour.
  https://elkhantour.com/
  Copyright (C) 2021 Nassim El Khantour


 ---

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

 ---

 Please do not change or remove any of the copyrights or links to web pages
 when modifying any of the files.

 */


import ZhongwenDictionary from './js/utilities/zhongwendico.js';

let dict;
const initStorage = {
  laosSettings: {
        tradsimp:  "simplified",
        activeNotif: "true",
        hoverTrans: "true",
        pinyinBubble: "true"
  },
  wordList:[],
  darkMode:'false'
}

/*utilities*/
function isEmpty(data){
  if(!data || Object.keys(data).length == 0){ return true;}
  else{ return false; }
}
function update_storage(){
  /*Send back new laos Settings on option changes*/
  chrome.storage.local.get(null,function(data){

    if(isEmpty(data['wordList'])){ chrome.storage.local.set({wordList:initStorage.wordList}); }
    if(isEmpty(data['darkMode'])){ chrome.storage.local.set({darkMode:initStorage.darkMode}); }
    if(isEmpty(data['laosSettings'])){
      chrome.storage.local.set({laosSettings:initStorage.laosSettings}, () => update_storage() );
    }else{
      if(data.laosSettings.activeNotif){ setAlarm(); }
      chrome.tabs.query({}, function(tabs){
        for(var i = 0; i< tabs.length; i++){
          chrome.tabs.sendMessage(tabs[i].id, {type:'laosSettings', settings:data.laosSettings});
        }
      });
    }

  });


}
function randomInt(mn, mx){
   mn = parseInt(mn);
   mx = parseInt(mx);

     return  Math.floor(Math.random() * (mx - mn + 1) + mn) ;
 }
function pop_notif(){

  chrome.storage.local.get(null,function(data){

    if(data["wordList"].length == 0 || data.laosSettings['activeNotif'] == "false"){return;}
    chrome.alarms.clear("notifAlarm");

    let parsed_array = data["wordList"];
    let randX = randomInt(0, parsed_array.length-1);
    let randY = randomInt(0, parsed_array[randX].length-1);
    let chosen_word = parsed_array[randX][randY];

    var notifoptions = {
      type:"basic",
      iconUrl:"media/logo/LAOS48.png",
      title:chosen_word[ data.laosSettings["tradsimp"] ] +"‎‎‎      "+ chosen_word["zhuyin"],
      message:chosen_word["definition"].join(";  "),
      requireInteraction: true
    }

    chrome.notifications.create("remindNotif", notifoptions, function(){});



  });


}
function setAlarm(){
    let alarmConfig = { periodInMinutes: randomInt(10,20) }
    chrome.alarms.clear("notifAlarm");
    chrome.alarms.create("notifAlarm",alarmConfig);
}
function tryImport(url){
  try{
    importScripts(chrome.runtime.getURL(url));
    return true;
  }catch(e){
    console.log(e);
  }
}
function startScreenCapture(){
  chrome.tabs.query({active:true, lastFocusedWindow:true}, (tab) => {
    chrome.tabs.captureVisibleTab( tab[0].windowId, {format:'png'}, (capture) => {
      chrome.tabs.sendMessage(tab[0].id, {type:'jcrop', image:capture});
    });
  });
}
/*dictionary*/
async function loadDictData() {
    let wordDict = fetch(chrome.runtime.getURL(
        "data/cedict_ts.u8")).then(r => r.text());
    let wordIndex = fetch(chrome.runtime.getURL(
        "data/cedict.idx")).then(r => r.text());
    let grammarKeywords = fetch(chrome.runtime.getURL(
        "data/grammarKeywordsMin.json")).then(r => r.json());

    return Promise.all([wordDict, wordIndex, grammarKeywords]);
}
async function loadDictionary() {
    let [wordDict, wordIndex, grammarKeywords] = await loadDictData();
    return new ZhongwenDictionary(wordDict, wordIndex, grammarKeywords);
}
function search(text) {

    if (!dict) {
        console.log("no Dictionary loaded");
        return;
    }

    let entry = dict.wordSearch(text);

    if (entry) {
        for (let i = 0; i < entry.data.length; i++) {
            let word = entry.data[i][1];
            if (dict.hasKeyword(word) && (entry.matchLen === word.length)) {
                // the final index should be the last one with the maximum length
                entry.grammar = { keyword: word, index: i };
            }
        }
    }

    return entry;
}

/*Message handler*/
chrome.runtime.onMessage.addListener(function(req, sender, cback){

  switch(req.type){

    case 'open':

      switch(req.url){

        case '/laos.html':
          chrome.storage.local.get("tabID",function(data){

            if( !isEmpty(data) ){

              chrome.tabs.get(data["tabID"],function(tab){
                if (chrome.runtime.lastError) { tab = undefined; }
                if(tab){ chrome.tabs.update(tab.id,{active:true}); }
                else{
                  chrome.tabs.create(
                    {url: chrome.runtime.getURL( req.url )},
                    function(tab){  chrome.storage.local.set({tabID:tab.id}); });
                }
              });

            }else{
              chrome.tabs.create(
                {url: chrome.runtime.getURL( req.url )},
                function(tab){  chrome.storage.local.set({tabID: tab.id}); });
            }


          });
        break;

        default:
          chrome.tabs.create({url: chrome.runtime.getURL( req.url )});
      }


    break;

    case 'search':
      if(!dict){ loadDictionary().then(r => dict = r).then( () => {let resp = search(req.text); cback(resp); })  }
      else{ cback( search(req.text) ); }
    break;

    case 'add':

      chrome.storage.local.get("wordList",function(data){

          data["wordList"].push(req.object);
          chrome.storage.local.set({wordList: data["wordList"] },function(){
            chrome.storage.local.get("tabID",function(data){
              if(!isEmpty(data)){
                chrome.tabs.get(data["tabID"],function(tab){ chrome.tabs.reload(tab.id); });
              }
            });
          });

      });


    break;

    case 'notif':
        pop_notif();
    break;

    case 'alarm':

      switch (req.boolean) {
        case 'true':
            chrome.notifications.clear("remindNotif");
            setAlarm();
          break;
        case 'false':
            console.log("alarm cleared")
            chrome.notifications.clear("remindNotif");
            chrome.alarms.clear("notifAlarm");
        break;

        default:

      }

    break;

    case 'getLocalStorage':
          chrome.storage.local.get(null, (data) => cback({type:'laosSettings',settings:data.laosSettings}));
    break;

    case 'query':
      chrome.storage.local.get('laosSettings',(data) => {
        let tatoebaQuery = "https://tatoeba.org/fr/sentences/search?from=cmn&to=eng&query="+req.object[0][ data.laosSettings['tradsimp'] ];
        chrome.tabs.create({ url: tatoebaQuery });
      });
    break;

    case 'updateStorage':
      update_storage();
    break;

    case 'init':

      update_storage();

      if(!dict){ loadDictionary().then(r => {dict = r; cback(true);}); } //only send callback when loaded
      else{ cback(true); } //if already loaded -> send callback

    break;

    case 'screenshot':
      startScreenCapture();
    break;

  }

  return true;
});


/*Command handler*/
chrome.commands.onCommand.addListener( (command) => {
  //Needs to use command to work with activeTab (~screencapture)
  switch(command){
    case 'screencapture':
      startScreenCapture();
    break;
  }
});


/*Alarm and Notification system*/
chrome.alarms.onAlarm.addListener(function(alarm){  pop_notif(); });
chrome.notifications.onClosed.addListener(function(){
  chrome.storage.local.get("laosSettings",function(data){
    if(data.laosSettings["activeNotif"] == 'true'){ setAlarm(); }
     chrome.notifications.clear("remindNotif");});
});
