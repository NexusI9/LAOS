/*

LAOS - The mandarin learning toolbox
by Nassim El Khantour.
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


/*
Check ROOT/js/components.js for all the components
*/

 const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;
 const REGEX_PONCT = /[\$\uFFE5\^\+=`~<>{}\[\]|\u3000-\u303F!-#%-\x2A,-/:;\x3F@\x5B-\x5D_\x7B}\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/g;


//RANGE
let targetNode;
let lastText;
let savedStartOffset;
let savedRange;
let select = window.getSelection();
const $ = window.jQuery;

//BUBBLE
const bubble_param = {
  range:null,
  result:null
}
const bubble_list = [];
var lastLocation = "";

//LAOS POPUP
let laosSettings;
let posX, posY;
let globalObject;
let lastObj;

const laos_popup = new LAOS_POPUP("laos_popup");

//CAPTURE & CROP
let jCrop;
let laos_ocr = new LAOS_OCR({ onDestroy: () => jCrop = null });

//TEXT
function textResult(result){

   if(!result){return;}

   let max_increment = 0;
   let newRange = savedRange;
   let startOffset = savedStartOffset;

   for(var i = 0; i < result.data.length; i++){
     if( result.data[i][1].length > max_increment){
       max_increment = result.data[i][1].length;
     }
   }

   newRange.setEnd(targetNode,startOffset+max_increment);
   select.removeAllRanges();
   select.addRange(newRange);

   laos_popup.fill(result, posX, posY);
   bubble_param.range = newRange;
   bubble_param.result = result;

}

function set_class_tone(ar){


  let tone_array = [
    [/[āēīōūǖ]/,"laos_tone_a"],
    [/[áéíóúǘ]/,"laos_tone_b"],
    [/[ǎěǐǒǔǚ]/,"laos_tone_c"],
    [/[àèìòùǜ]/,"laos_tone_d"]
  ];

  let tempar = [];
  let elt;
  for(var a in ar){
    if(/[āēīōūǖáéíóúǘǎěǐǒǔǚàèìòùǜ]/.test(ar[a])){
      for(var t in tone_array){
        if( tone_array[t][0].test(ar[a]) ){
          elt = "<span class='"+tone_array[t][1]+"'>"+ar[a]+"</span>"
          tempar.push(elt);
        }
      }
    }else{
      elt = "<span class='laos_tone_a'>"+ar[a]+"</span>"
      tempar.push(elt);
    }

  }

  return tempar.join(" ");
}
function set_class_tone_zhuyin(str){
    let splt = str.split(" ");

    let tone_array = [
      [/[ˊ]/, "laos_tone_b" ],
      [/[ˇ]/, "laos_tone_c" ],
      [/[ˋ]/, "laos_tone_d" ],
      [/[˙]/, "laos_tone_a" ]
    ];

    let tempar = [];
    let elt;
    for(var s in splt){
      if(/[ˊˇˋ˙]/.test(splt[s])){
        for(var t in tone_array){
          if(tone_array[t][0].test(splt[s])){
            elt = "<span class='"+tone_array[t][1]+"'>"+splt[s]+"</span>";
            tempar.push(elt);
          }
        }
      }else{
        elt = "<span class='laos_tone_a'>"+splt[s]+"</span>";
        tempar.push(elt);
      }

    }

    return tempar.join(" ");

}
function tone(str){
  str = str.replace("u:","ü");
  str = str.replace("U:","Ü");
  str = PinyinConverter.convert(str);
  return str;
}

function remove_string_doublon(ref,exp){

  let nChange = 0;
  for(x in ref){
      if(exp[x] == ref[x]){ exp = exp.replace(exp[x],"—"); nChange++; }
  }

  if(nChange == exp.length){
      return "";
  }else{
      return "("+exp+")";
  }


}
function getText(nd){

  if(!REGEX_CHINESE.test(nd.data)){ return; }

  let range = new Range();
  let startOffset = savedStartOffset;
  let increment = 1;
  let max_increment = nd.data.length - startOffset;

  range.setStart(nd,startOffset);
  range.setEnd(nd,startOffset+max_increment);
  savedRange = range;
  range = range.toString();

  if(lastText !== range && !REGEX_PONCT.test(range) && isNaN(range) ){
    globalObject = null;

    chrome.runtime.sendMessage({
      type:'search',
      text: range
      },
      textResult
    );

    lastText = range;
  }


  return;
}
function findNextTextNode(root, previous) {
    if (root === null) { return null; }

    let nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, null);
    let node = nodeIterator.nextNode();
    while (node !== previous) {
        node = nodeIterator.nextNode(); //next Node jusqu'a qu'on reach le previous (actuel node)
        if (node === null) {
            return findNextTextNode(root.parentNode, previous);
        }
    }
    let result = nodeIterator.nextNode();
    if (result !== null) { return result; }
    else { return findNextTextNode(root.parentNode, previous); }
}

//EVENTS
function onMouseMove(mouseMove){

  if(mouseMove.type == "mousedown"){return;}
  if (mouseMove.target.nodeName === 'TEXTAREA' ||
      mouseMove.target.nodeName === 'INPUT' ||
      mouseMove.target.nodeName === 'DIV') {


      let clientX = mouseMove.pageX;
      let clientY = mouseMove.pageY;

      if(mouseMove.target.nodeName === 'TEXTAREA' ||
         mouseMove.target.nodeName === 'INPUT'){
      }

    }


      //    We could simply get innerText of each element to fetch the chinese characters
      //    But we wouldn't be able to highlight text on hover (innerText does only return a string)
      //    So we have to use a Node approach, that select a Node in the DOM to be manipulated
      //    So we use caretRangeFromPoint to "ray trace" Nodes in the dom


      let range;
      let rangeNode;
      let rangeOffset;


      if(document.caretRangeFromPoint){
        range = document.caretRangeFromPoint(mouseMove.clientX, mouseMove.clientY);
        if (range === null) { return; }
        rangeNode = range.startContainer; //actual element node
        rangeOffset = range.startOffset;

      }else if(document.caretPositionFromPoint){
        range = document.caretPositionFromPoint(mouseMove.clientX, mouseMove.clientY);
        if (range === null) {  return; }
        rangeNode = range.offsetNode;
        rangeOffset = range.offset;
      }

      if (rangeNode.data && rangeOffset === rangeNode.data.length) {
          rangeNode = findNextTextNode(rangeNode.parentNode, rangeNode);
          rangeOffset = 0;
      }

      if (!rangeNode || rangeNode.parentNode !== mouseMove.target && !jCrop){
        lastText = null;
        globalObject = null;

        if( laos_popup.$node.css('display') !== 'none'){
          select.removeAllRanges();
          if(laos_popup.$node){
            laos_popup.$node.css({display:'none'});
          }
        }
          rangeNode = null;
          rangeOffset = -1;
      }


      if(rangeNode &&
        rangeNode.data &&
        rangeOffset < rangeNode.data.length &&
        !jCrop){

          savedStartOffset = rangeOffset;
          targetNode = rangeNode;

          posX = mouseMove.pageX;
          posY = mouseMove.pageY;

          getText(rangeNode);
        }

}

function onMouseDown(mouseDown){
  document.removeEventListener('mousemove',onMouseMove)
  if($("#"+laos_popup.id)){ $("#"+laos_popup.id).css({display:"none"}); }
}

function laosKeyDown(keydown){

  if(keydown.altKey && keydown.keyCode == 69){
      /* Alt + E */
      chrome.runtime.sendMessage({
          type: 'open',
          url: '/laos.html'
      });
      return;
  }

}

function globalKeyDown(keydown){

    /*Pop manually a notification*/
    if(keydown.altKey && keydown.keyCode == 81 ){
      chrome.runtime.sendMessage({type:'notif'});
      return;
    }

    /*Get word list*/
    if(keydown.altKey && keydown.keyCode == 84 ){
      chrome.runtime.sendMessage({
        type:'query',
        object: globalObject
      });
      return;
    }

    /*Destroy Jcrop*/
    if(keydown.key === 'Escape'){
      if(jCrop){
        jCrop.destroy();
        jCrop = null;
      }
      return;
    }

    /*Apply Jcrop*/
    if(keydown.key === 'Enter'){
      if(jCrop){
        keydown.preventDefault(); //safety so doesn't enter an input
        jCrop.destroy();
        laos_ocr.fetchOCR(jCrop.src, jCrop.area, laosSettings['tradsimp']);
        laos_ocr.pop();
      }
    }

    /*Add found word to word list*/
    if(keydown.keyCode == 82 && globalObject !== null){
      chrome.runtime.sendMessage({
          type: 'add',
          object: globalObject
      });

      $(".laos_folder").each(function(index,value){
        let $self = $(this);
        index += 0.5;
        setTimeout( () => $self.css({transition:"transform 0.1s cubic-bezier(.03,.35,.35,.9)", transform:"scale(1.2)", boxShadow:"0px 1px 3px rgba(0,0,0,30%)"}), (index)*200);
        setTimeout( () => $self.css({transition:"transform 0.1s linear", transform:"scale(1)", boxShadow:"none"}), index*(250) );

      });

      return;

    }



}

function onMouseUp(mouseUp){

  document.addEventListener('mousemove', onMouseMove);
}

function onClick(e){

  //if click on anchor
  if(laosSettings && laosSettings.pinyinBubble == 'false'){ return; }
  if(e.target.nodeName == "A"){
    $('.laos_bubble').remove();
  }else{
    if(!bubble_param.range || !bubble_param.result || globalObject == null){ return; }
    new BUBBLE(bubble_param.range, bubble_param.result).pop();
  }
}

function onPopState(){ $('.laos_bubble').remove(); }

function check_events(){

    //BUBBLE EVENT
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', globalKeyDown)
    window.addEventListener('popstate', onPopState );

    //LAOS POPUP EVENT
    if( laosSettings && laosSettings['hoverTrans'] == 'true' ){
      laos_popup.pop();
      document.addEventListener('keydown', laosKeyDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mousedown',onMouseDown);
      document.addEventListener('mouseup',onMouseUp);
    }else{
      laos_popup.remove();
      document.removeEventListener('keydown', laosKeyDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown',onMouseDown);
      document.removeEventListener('mouseup',onMouseUp);
    }

}

//INIT
function __init__(){

  check_events();
  lastLocation = window.location.href;
  /*
    use - Chrome.tabs -> background.js to send new localStorage to all tabs
        - Chrome.runtime -> content.js
        - Window.PostMessage -> ocr iframe
    Add a listener so (live) update when options triggered and send message to background
  */

  chrome.runtime.onMessage.addListener((data) => {

    switch(data.type){

      case 'laosSettings':
          laosSettings = data.settings;
          check_events();
      break;

      case 'jcrop':
        if(!jCrop){
          jCrop = new JCROP(data.image);
          jCrop.init();
        }
      break;

    }
  });

  window.addEventListener("message", (req) => {

    req = req.data;
    switch(req.type){
      case 'ocr_result':
        laos_ocr.setResult(req.result);
      break;
    }

  });

  window.addEventListener('resize', () => {
    if(jCrop){
      jCrop.destroy();
      jCrop = null;
    }
  });


}

//First sync with chrome.storage -> then init
chrome.runtime.sendMessage({type:'init'},() => {
  chrome.runtime.sendMessage({type:'getLocalStorage'},(data) => {
    laosSettings = data.settings;
     __init__();
  });
});
