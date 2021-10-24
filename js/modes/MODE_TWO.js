
import * as UTILS from '../utils.js';

export default class MODE_TWO{


    constructor(wordList, laosSettings){
      this.wordList = wordList;
      this.laosSettings = laosSettings;
      this.rm = {display:'none'};
      this.dsp = {
          opacity:1,
          visibility:'visible'
      }
      this.pop = {
          display:'inline-flex'
      }
      this.hid = {
          opacity:0,
          visibility:"hidden"
      }

      this.timer = 0;
      this.speed = 5300;
      this.t_pen = false;
      this.t_auto = true;
    }


    setEvent(){

      const self = this;
      $("#two_def").on("click",function(){
        if( $("#desc").css("opacity") == 1 ){ $("#desc").css({opacity:0});  }
        else{  $("#desc").css({opacity:1}); }
      });
      //UI
      $("#chrono").unbind().on("click",function(){

        if($(this).attr("data-value") == "true"){

          $(this).attr("data-value","false");
          $(this).css({backgroundImage:"url('media/pen.svg')"});
          $("#ideo").css({cursor:"default"});
          $("#ideo").unbind('mouseenter mouseleave');

          clearTimeout(self.timer);

           $(document).off("keydown");

           $("#desc").css(self.dsp);
           $("#speed").css(self.dsp);
           $("#quest").css(self.rm);

           self.timer = setInterval(function(){self.loop();},self.speed);
           self.t_auto = true;
           self.t_pen = false;

           $("#pin").css(self.dsp);
           $(".write").css(self.hid);

           $(".write").val("");
        }else{

          $(this).attr("data-value","true");
          $(this).css({backgroundImage:"url('media/time.svg')"});
          clearTimeout(self.timer);
          self.t_pen = true;
          self.t_auto = false;

          $(".write").css(self.dsp);
          $(".write").css({ width:$("#pin").width()+"px" });

          $("#desc").css({opacity:0}); //can't use hid, cause need to reveal later (on hover)
          $("#pin").css({opacity:0});
          $("#speed").css(self.hid);

          $("#quest").css(self.dsp);
          $("#quest").css(self.pop);


          $(document).on("keydown",function(e){
              if(e.keyCode == 13){
                  var input = $(".write").val();

                  var pinVal = UTILS.remove_tones( $("#pin").text() );
                  if( input == pinVal || input == pinVal.replace(/ /g,"")){

                    $(".write").val("");
                    let new_rand_parent = UTILS.randomIntF(0,self.wordList.length-1);
                    let new_rand_child = UTILS.randomIntF(0,self.wordList[new_rand_parent].length-1);
                    $("#ideo").html( self.wordList[new_rand_parent][new_rand_child][ self.laosSettings["tradsimp"] ] );
                    $("#pin").html(  self.wordList[new_rand_parent][new_rand_child]["pinyin"].join(" ") );
                    $("#desc").html( self.wordList[new_rand_parent][new_rand_child]["definition"].join(";\xa0\xa0"));
                    $(".write").css({ width:$("#pin").width()+"px" });
                  }else{
                    $(".write").effect("shake");
                  }

              }

          });

         $("#ideo").css({cursor:"pointer"});
         $("#quest, #ideo").hover(function(){ $("#pin").css({opacity:0.3});
                                       if( $("#desc").css("opacity") != 1 ){ $("#desc").css({opacity:0.3}) };
                                       $(".write").css({opacity:0});
                                     },
                           function(){ $("#pin").css({opacity:0});
                                       if( $("#desc").css("opacity") != 1 ){ $("#desc").css({opacity:0}) };
                                      $(".write").css({opacity:1});
                                     });



        }

        });


      $(".scene").on("click", function(){ clearTimeout(self.timer); });

      $("#speed > input").change(function(){
          self.speed = $(this).attr("speed");
          clearTimeout(self.timer);
          self.timer = setInterval(function(){self.loop();},self.speed);
          return false;
      });


      self.timer = setInterval(function(){self.loop();},self.speed);
    }

    loop(){
            const self = this;
            let rand_parent = UTILS.randomIntF(0,self.wordList.length-1);
            let rand_child = UTILS.randomIntF(0,self.wordList[rand_parent].length-1);
            $("#ideo").html( self.wordList[rand_parent][rand_child][ this.laosSettings["tradsimp"] ] );
            $("#pin").html(  self.wordList[rand_parent][rand_child]["pinyin"].join(" ") );
            $("#desc").html( self.wordList[rand_parent][rand_child]["definition"].join(";\xa0\xa0"));
    }

    init(){
          const self = this;
          self.wordList = UTILS.check_null(self.wordList);
          if(!self.wordList || UTILS.get_length(self.wordList) < 2){
            UTILS.notEnoughWords(2);
            return;
          }

          let t_auto = true;
          let t_manual = false;

          var nWord = 0;
          for(var x in self.wordList){
            for(var y in self.wordList[x]){
              nWord +=1;
            }
          }

          $("#quest").css(this.rm);

          //init
          $("#ideo").html( self.wordList[0][0][ self.laosSettings["tradsimp"] ] );
          $("#pin").html(  self.wordList[0][0]["pinyin"].join(" ") );
          $("#desc").html( self.wordList[0][0]["definition"].join(";\xa0\xa0") );

          self.setEvent();

    }

}
