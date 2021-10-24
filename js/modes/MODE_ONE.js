
import * as UTILS from '../utils.js';

export default class MONE_ONE{


  constructor(wordList, laosSettings){

    this.selected_case = [];
    this.wordList = wordList;
    this.laosSettings = laosSettings;

  }

  UI_checkButton(){
    if(this.selected_case.length > 0){
      if($("#tableManager").css("opacity") == 0){
        $("#tableManager").css({opacity:1});
      }
    }else{
      $("#tableManager").css({opacity:0});
    }
  }

  scan_selection(){
      const self = this;
      this.selected_case = [];
      $("tbody tr").each(function(){

        if($(this).attr("data-selected") == "true" && $(this).hasClass("tr_selected")){
          self.selected_case.push($(this)[0]);
        }
      });
  }

  select_rows(){

    const self = this;
    $(".tr_words td:not(.td_input)").on("click",function(){
    var isSelected = $(this).parent().attr("data-selected");
    if(isSelected == "true"){ isSelected = "false"}
    else{ isSelected = "true" }

    $(this).parent().attr("data-selected",isSelected);

    if(isSelected == "true"){
      $(this).parent().addClass("tr_selected");
      //selected_case.push( $(this).parent()[0] );
  }
    else{
      $(this).parent().removeClass("tr_selected");
      //selected_case.splice(selected_case.indexOf($(this).parent()[0]),1);
    }

    //UI
    self.scan_selection();
    self.UI_checkButton();

  });

  }

  recount_rows(){ $(".tr_words").each(function(n){ $(this).find(".td_number").text(n+1); }); }

  UI_selectAllRow(){

    const self = this;
    self.selected_case = [];
    if($("#button_selectAll").text() == "Select everything"){

      $(".tr_words").each(function(){
        self.selected_case.push($(this)[0]);
        $(this).addClass("tr_selected");
        $(this).attr("data-selected","true");
      });

      $("#button_selectAll").text("Deselect everything")
    }else{

      self.selected_case = [];

      $(".tr_words").each(function(){
        $(this).removeClass("tr_selected");
        $(this).attr("data-selected","false");
      });

      $("#button_selectAll").text("Select everything");

    }


  }
  UI_removeRow(ar){
    const self = this;
    //check ID
    let new_array = ar;
    //if(selected_case.length == 0){return;}

    for(var x in new_array){
      for(var y in new_array[x]){
        for(var s in this.selected_case){
          if(this.selected_case[s] == new_array[x][y]["key"]){
            new_array[x].splice(y,1);
            $(this.selected_case[s]).remove();
            this.selected_case.splice(s,1);
            return self.UI_removeRow(new_array);
          }
        }
      }
      if(self.wordList[x].length == 0){ self.wordList.splice(x,1); }
    }

    return new_array;
  }

  checkDarkMode(){

    if($("#list_moon").attr("data-mode") == "true"){
      $("#list_moon").css({backgroundImage:"url('./media/sun.svg')"});
      $("#gradbkg").css({background:"#222"});
      $("table").css({color:"#FFF"});
      $("th, td").addClass("tr_dark");
      $(".td_input input").css({color:"#FFF"});
      $("#input_ico").css({backgroundImage:"url('./media/pen.svg')"});
      $("th").css({borderBottom: "solid 3px #444444"});

    }else{
      $("#list_moon").css({backgroundImage:"url('./media/moon.svg')"});
      $("#gradbkg").css({background:"linear-gradient(324deg,#b3dfff 0%, #f8eaff 100%)"});
      $("table").css({color:"initial"});
      $("th, td").removeClass("tr_dark");
      $(".td_input input").css({color:"#000"});
      $("#input_ico").css({backgroundImage:"url('./media/pen_black.svg')"});
      $("th").css({borderBottom: "3px solid rgb(180, 180, 180)"});
    }

    chrome.storage.local.set({darkMode:$("#list_moon").attr("data-mode")});
  }

  setEvent(){
    const self = this;
    $("#list_moon").on("click",function(){
      if($(this).attr("data-mode") == "false"){ $(this).attr("data-mode","true"); }
      else{  $(this).attr("data-mode","false"); }
      self.checkDarkMode();
    });

    $("#list_rand").on("click",function(){

          let $children = $("tbody").children(".tr_words");

          let $new_array = $children.sort(function() {
              return 0.5 - Math.random();
            });

          $children.remove();
          $("tbody").append($new_array);
          $(".tr_words").each(function(n){ $(this).find(".td_number").text(n+1); });
          self.select_rows();

    });

    $("#list_manual").on("click",function(){

        if($(this).attr("data-value") == 'false'){

          $(this).css({backgroundImage:'url("media/disp.svg")'});
          $(this).attr("desc",'Back to normal view');
          $(".td_def p, .td_pinyin p").css({opacity:0});
          $(".td_def, .td_pinyin").hover(
            function(){ $(this).parent().find(".td_def p, .td_pinyin p").css({opacity:1});
          },
            function(){ $(this).parent().find(".td_def p, .td_pinyin p").css({opacity:0}); }
          );
          $("colgroup col:nth-child(5)").attr("style","width:10%");
          $(".td_input").css({
            display:"table-cell",
            position:'relative'
        });
          //$("tbody tr:nth-child(3)").insertAfter();

          $(".td_input input").change(function(){

              let clean_pinyin = UTILS.remove_tones($(this).parent().parent().find(".td_pinyin p").html()).replace(/\s/g, '');
              if( $(this).val() == clean_pinyin ){
                $(this).parent().parent().find(".td_def p, .td_pinyin p").css({opacity:1});
                $(this).parent().parent().find(".td_def, .td_pinyin").unbind('mouseenter mouseleave');
                $(this).parent().parent().addClass("tr_selected");
                $(this).parent().parent().attr("data-selected","true");
                $(this).css({color:"#FFF"});
              }else{
                $(this).val("");
                $(this).effect("shake");
                $(this).parent().parent().removeClass("tr_selected");
                $(this).parent().parent().attr("data-selected","false");
                $(this).css({color:"#000"});
              }

              self.scan_selection();
              self.UI_checkButton();


          });

          $(this).attr("data-value",'true')
        }else{
          $(this).css({backgroundImage:'url("media/pen.svg")'});
          $(this).attr("desc",'Typing exercise');
          $(".td_def, .td_pinyin").unbind('mouseenter mouseleave');
          $(".td_def p, .td_pinyin p").css({opacity:1});
          $(".td_input").css({display:"none"});
          $("colgroup col:nth-child(5)").attr("style","width:40%");


          $(this).attr("data-value",'false')
        }

    });

    $("#button_selectAll").on("click",function(){ self.UI_selectAllRow(); });
    $("#button_delete").on("click", function(){

      self.wordList = self.UI_removeRow(self.wordList);
      chrome.storage.local.set({wordList:self.wordList});

      if($(".tr_words").length == 0){ $("#noWords").css({opacity:1}); }
      self.UI_checkButton();
      self.recount_rows();
    });

  }

  init(){

    const self = this;
    let n = 1;
    if(!self.wordList){return;}
    self.wordList = UTILS.check_null(self.wordList);


    //populate
      for(var x = 0; x < self.wordList.length; x++){
        for(var y = 0; y < self.wordList[x].length; y++){
          let tBuilder = "";
          let tr = document.createElement("tr");
          tr.setAttribute("data-selected","false");
          tr.setAttribute("class","tr_words");

          tBuilder += "<td class='td_number'><p></p></td>";
          tBuilder += "<td class='td_character'>" + self.wordList[x][y][ self.laosSettings["tradsimp"] ] + "</td>";
          tBuilder += "<td class='td_input'><input type='text'></td>";
          tBuilder += "<td class='td_pinyin'><p>" + self.wordList[x][y]["pinyin"].join(" ") + "</p><p>" + self.wordList[x][y]["zhuyin"] + "</p></td>";
          tBuilder += "<td class='td_def'><p>" + self.wordList[x][y]["definition"].join(";\xa0\xa0"); + "</p></td>";

          tr.innerHTML = tBuilder;
          self.wordList[x][y].key = tr;
          $("table tbody tr:first-child()").after(tr);
        }

      }

    if($(".tr_words").length > 0){ $("#noWords").css({opacity:0}); }
    self.recount_rows();
    self.select_rows();

    chrome.storage.local.get("darkMode",function(data){

        if(data["darkMode"]==null){ data["darkMode"] = "false"; }
        $("#list_moon").attr("data-mode",data["darkMode"]);
        self.checkDarkMode();

    });

    self.setEvent();
  }



}
