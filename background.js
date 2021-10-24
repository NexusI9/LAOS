/*

LAOS - The mandarin learning toolbox
Written by Nassim El Khantour.
  https://elkhantour.com/
  Copyright (C) 2021 Nassim El Khantour

Parts of this script were taken from the Zhongwen - A Chinese-English Pop-Up Dictionary and were optimized
 Copyright (C) 2019 Christian Schiller
 https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde


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

'use strict';

let dict;
const initStorage = {
  laosSettings: {
        tradsimp:  "simplified",
        dispZhuyin : "true",
        activeNotif: "true",
        hoverTrans: "true"
  },
  wordList:[],
  darkMode:'false'

}


// importScripts() won't work and MV3 doesn't support ES Module : so import class directly within Background.js
class ZhongwenDictionary {

    constructor(wordDict, wordIndex, grammarKeywords) {
        this.wordDict = wordDict;
        this.wordIndex = wordIndex;
        this.grammarKeywords = grammarKeywords;
        this.cache = {};
    }

    static find(needle, haystack) {

        let beg = 0;
        let end = haystack.length - 1;

        while (beg < end) {
            let mi = Math.floor((beg + end) / 2);
            let i = haystack.lastIndexOf('\n', mi) + 1;

            let mis = haystack.substr(i, needle.length);
            if (needle < mis) {
                end = i - 1;
            } else if (needle > mis) {
                beg = haystack.indexOf('\n', mi + 1) + 1;
            } else {
                return haystack.substring(i, haystack.indexOf('\n', mi + 1));
            }
        }

        return null;
    }

    hasKeyword(keyword) {
        return this.grammarKeywords[keyword];
    }

    wordSearch(word, max) {

        let entry = { data: [] };

        let dict = this.wordDict;
        let index = this.wordIndex;

        let maxTrim = max || 7;

        let count = 0;
        let maxLen = 0;

        WHILE:
            while (word.length > 0) {

                let ix = this.cache[word];
                if (!ix) {
                    ix = ZhongwenDictionary.find(word + ',', index);
                    if (!ix) {
                        this.cache[word] = [];
                        continue;
                    }
                    ix = ix.split(',');
                    this.cache[word] = ix;
                }

                for (let j = 1; j < ix.length; ++j) {
                    let offset = ix[j];

                    let dentry = dict.substring(offset, dict.indexOf('\n', offset));

                    if (count >= maxTrim) {
                        entry.more = 1;
                        break WHILE;
                    }

                    ++count;
                    if (maxLen === 0) {
                        maxLen = word.length;
                    }

                    entry.data.push([dentry, word]);
                }

                word = word.substr(0, word.length - 1);
            }

        if (entry.data.length === 0) {
            return null;
        }

        entry.matchLen = maxLen;
        return entry;
    }
}



function isEmpty(data){
  if(!data || Object.keys(data).length == 0){ return true;}
  else{ return false; }
}
function update_storage(){

  chrome.storage.local.get(null,function(data){

    if(isEmpty(data['wordList'])){ chrome.storage.local.set({wordList:initStorage.wordList}); }
    if(isEmpty(data['darkMode'])){ chrome.storage.local.set({darkMode:initStorage.darkMode}); }
    if(isEmpty(data['laosSettings'])){
      chrome.storage.local.set({laosSettings:initStorage.laosSettings}, () => update_storage() );
    }else{
      if(data.laosSettings.activeNotif){ setAlarm(); }
      chrome.tabs.query({}, function(tabs){
        for(var i = 0; i< tabs.length; i++){
          chrome.tabs.sendMessage(tabs[i].id, data['laosSettings']);
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
        // dictionary not loaded
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


chrome.runtime.onMessage.addListener(function(req, sender, cback){
  switch(req.type){

    case 'open':

      if(req.url == '/laos.html'){
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

      }else{
        chrome.tabs.create({url: chrome.runtime.getURL( req.url )});
      }

    break;

    case 'search':
      if(!dict){ loadDictionary().then(r => dict = r).then( () => {let resp = search(req.text); cback(resp); })  }
      else{
        let resp = search(req.text);
        cback(resp);
      }

    break;

    case 'add':

      chrome.storage.local.get("wordList",function(data){

          //prevent double add.......

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
          chrome.storage.local.get(null, (data) => cback(data));
    break;

    case 'query':
      let tatoebaQuery = "https://tatoeba.org/fr/sentences/search?from=cmn&to=eng&query="+req.object[0][ laosSettings["tradsimp"] ];
      chrome.tabs.create({ url: tatoebaQuery });
    break;

    case 'updateStorage':
      update_storage();
    break;

    case 'init':

      update_storage();

      if(!dict){ loadDictionary().then(r => {dict = r; cback(true);}); } //only send callback when loaded
      else{ cback(true); } //if already loaded -> send callback

    break;

  }

  return true;
});

chrome.alarms.onAlarm.addListener(function(alarm){  pop_notif(); });
chrome.notifications.onClosed.addListener(function(){
  chrome.storage.local.get("laosSettings",function(data){
    if(data.laosSettings["activeNotif"] == 'true'){ setAlarm(); }
     chrome.notifications.clear("remindNotif");});
  });
