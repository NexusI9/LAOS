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


import COSMA from './vfx/cosma.js';
import MODE_ONE from './modes/MODE_ONE.js';
import MODE_TWO from './modes/MODE_TWO.js';
import MODE_THREE from './modes/MODE_THREE.js';
import MODE_FOUR from './modes/MODE_FOUR.js';
import * as UTILS from './utilities/utils.js';

let mainMode = "mone";

let wordList = [];
var laosSettings = {};

const cosma = new COSMA({
  maxNumber:6,
  strokeWidth:20,
  velocity:1,
  radius:[70,200],
  maxConnection:2,
  opacity:0.4
});


function UI(){

  chrome.storage.local.get("mainMode",function(data){
      let varColour = "var(--"+data["mainMode"]+")";
      $(".uicolor").css({backgroundColor:varColour});
  });


  $(".scene").on("click",function(){
    chrome.storage.local.set({mainMode:$(this).attr("p")});
    location.reload();
  });

  $("*[desc]").hover(
    function(){
      var e = window.event;

      var posX = e.clientX;
      var posY = e.clientY;

      if( posX < $(window).width()/2){
            $("#popup_desc").css({opacity:1, top:posY, left:posX+10});
      }else{
            $("#popup_desc").css({opacity:1, top:posY, left:posX-$("#popup_desc").width()});
      }
      console.log(this);
      $("#popup_desc p").text( $(this).attr("desc") );
  },
  function(){ $("#popup_desc").css({opacity:0});
});


}

$(document).ready(function(){

    chrome.storage.local.get(null,function(data){

      laosSettings["tradsimp"] = data.laosSettings["tradsimp"];

      wordList = data["wordList"] || [];

      //INIT
      if(!data["mainMode"]){ chrome.storage.local.set({mainMode:"mone"}); }
      else {  mainMode = data["mainMode"]; }

      $.get('pages/'+mainMode+".html", function(data){
        $("body").append(data);

        switch(mainMode){
          case "mone":
            new MODE_ONE(wordList, laosSettings).init();
            break;

          case "mtwo":
            new MODE_TWO(wordList, laosSettings).init();
            break;

          case "mthree":
            new MODE_THREE(wordList, laosSettings).init();
            cosma.init();
            cosma.setColor("#f0fbff");
            break;

          case "mfour":
            new MODE_FOUR(wordList, laosSettings).init();
            cosma.init();
            cosma.setColor("#fdf0ff");
            break;
        }

         UI();
      });

      $("."+mainMode).css({
        opacity:1,
        display:"flex"
      });


    });


});
