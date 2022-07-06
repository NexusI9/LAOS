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


function loadSettings(){

  document.querySelector("#openLaos > input").addEventListener('click',() => chrome.runtime.sendMessage({ type: 'open', url: '/laos.html'}) );
  document.querySelector("#openOCR > input").addEventListener('click',() => chrome.runtime.sendMessage({ type: 'screenshot'}) );
  document.querySelector("#about > a").addEventListener('click',() => chrome.runtime.sendMessage({ type: 'open', url: '/pages/about.html'}) );

  chrome.storage.local.get(null,function(data){

    const initSettingValue = (setting) => {
      const settingValue = data.laosSettings[setting];
      document.querySelector(`input[name='${setting}']`).checked = (settingValue == "true") ? true : false;
    }

    const tradsimp = data.laosSettings["tradsimp"];
    document.querySelector(`input[name='tradsimp'][value="${tradsimp}"]`).checked = true;

    initSettingValue("activeNotif");
    initSettingValue("hoverTrans");
    initSettingValue("pinyinBubble");
    initSettingValue("convertPage");

  });

  chrome.commands.getAll((commands) => {
    var command = commands.find((command) => command.name === 'screencapture' );
    console.log( command );
  });


}

function handler(input){

  switch(input['type']){
    case 'checkbox':

        switch(input['name']){

            case 'activeNotif':
              chrome.runtime.sendMessage({type:'alarm',boolean:String(input['checked'])});
            break;


            default:

        }

        return String(input['checked']);
    break;

    case 'radio':
        return input['value'];
    break;
  }

}


window.addEventListener('load', () => {
  loadSettings();
  document.querySelectorAll("input").forEach( (input) => {
      if(input['name']){
        let key = input['name'];
        input.addEventListener("change", function(){
           chrome.storage.local.get(null, (data) => {
             var tempObj = data.laosSettings;
             tempObj[key] = handler(input);
             chrome.storage.local.set({laosSettings:tempObj}, () => { chrome.runtime.sendMessage({type:"updateStorage"}); });
           });
        });
      }
  });


});
