
import * as UTILS from '../utilities/utils.js';
import {STAR, EXPLODE} from '../vfx/vfx.js';

export default class MODE_THREE{

    constructor(wordList, laosSettings){
      this.wordList = wordList;
      this.laosSettings = laosSettings;

      this.total_card = 3*4;
      this.clicked_card = 0;
      this.clicked_array = [];
      this.scene_card = this.total_card;
      this.total_hit = 0;
      this.xplode = new EXPLODE({number:12, props: new STAR().init()});
    }


    setEvent(){
        const self = this;

        $("#ico_rand").unbind().on("click",function(){

          $("#three_canvas").animate({opacity:0},300,'linear',function(){
            $(this).children().remove();
            self.init();
            $(this).css({opacity:1});
            $("#vfx_epicentre").remove();
          });

          $("#found_list").animate({opacity:0},300,'linear',function(){
            $(this).find("ul").children().remove();
            $(this).css({opacity:1});
          });


        });

        $("#ico_pinyin").on("click",function(){
          if($(".three_pin").css("opacity") == 1){  $(".three_pin").css({opacity:0}); }
          else{  $(".three_pin").css({opacity:1});  }
        });

        $(".card input").on("click",function(){

        var key = $(this).parent().find("label").attr("key");


          if( $(this).prop("checked") ){

            self.clicked_card+=1;
            self.total_hit+=1;

            $("#hits p").text("HITS : "+self.total_hit);
            if(self.clicked_card > 2){

                $(".card input").prop("checked",false);
                $(".card > label").removeClass("card_selected");
                self.clicked_card = 0;
                self.clicked_array = [];

            }
            if(self.clicked_card == 2){

              self.clicked_array.push(key);
              $(this).parent().addClass("card_selected");

              if( self.clicked_array[0] == self.clicked_array[1] ){ //WIN

                  //update canvas GUI
                  $(".card label[key='"+key+"']").parent().css({opacity:0,pointerEvents:'none'});
                  $(".card input").prop("checked",false);
                  $(".card > label").removeClass("card_selected");
                  self.clicked_card = 0;
                  self.clicked_array = [];

                  //EXPLODE VFX :D
                  self.xplode.trigger();

                  //fill up list
                  var pin = $(".card label[key='"+key+"']").parent().find(".three_pin").text();
                  var chin = $(".card label[key='"+key+"']").parent().find(".three_chin").text();
                  var dsc = $(".card label[key='"+key+"']").parent().find(".three_desc").text();
                  var new_li = document.createElement("li");

                  $(new_li).append(`<span><p>${chin}</p><p>${pin}</p></span><p>${dsc}</p>`);
                  $("#found_list ul").append($(new_li));


                  if(self.scene_card > 0){
                    self.scene_card -= 2;
                  }
                  if(self.scene_card == 0){

                    $("#three_clicktc").css({visibility:"visible", opacity:1});


                  }

              }else{

                  $(".card input").prop("checked",false);
                  UTILS.shake(".card_selected");
                  $(".card").removeClass("card_selected");
                  self.clicked_card = 0;
                  self.clicked_array = [];

              }

            }else{

              self.clicked_array.push(key);
              $(this).parent().addClass("card_selected");

            }


        }

          else{

            self.clicked_card -= 1;
            $(this).parent().removeClass("card_selected");
            self.clicked_array = self.clicked_array.filter(val => val !== key);
          }


        });

        $("#three_clicktc").unbind().on("click",function(){

          $(this).animate({opacity:0},300, () => $(this).css({visibility:"hidden"}));
          $("#three_canvas").animate({opacity:0},300,'linear',function(){
            $(this).children().remove();
            self.init();
            $(this).css({opacity:1});
          });

          $("#found_list").animate({opacity:0},300,'linear',function(){
            $(this).find("ul").children().remove();
            $(this).css({opacity:1});
          });

        });

    }

    init(){
      const self = this;

      self.wordList = UTILS.check_null(self.wordList);
      if(!self.wordList || UTILS.get_length(self.wordList) < self.total_card){
        //console.warn("[Mode Three] Not enough words to start the exercice");
        UTILS.notEnoughWords(self.total_card)
        return;
      }

      //flatten array
      self.wordList = self.wordList.flat();

      $("body").css({overflow:'hidden'});
      $("#vfx_epicentre").remove();
      $("body").append( this.xplode.init() );

      var n_selected = 0;

      var card = $("#card").clone();
      card.removeClass("mock");
      var card_array = [];

      var available_card = [];
      var rand_list = UTILS.generate_random_list([0,self.wordList.length],self.total_card/2);

      self.scene_card = self.total_card;
      for(var c = 0; c < self.total_card; c++){

        available_card.push(c);
        var new_card = card.clone();

        if(c%2 == 0){
          let rand_parent = rand_list[c/2];
          let rand_child = UTILS.randomIntF(0, self.wordList[rand_parent].length-1);
          var card_pair = [];

          card_pair.push( self.wordList[rand_parent][ self.laosSettings["tradsimp"] ] );
          card_pair.push( self.wordList[rand_parent]["pinyin"].join(" ") );

          var filtered_desc = self.wordList[rand_parent]["definition"].join("; ");
          filtered_desc = filtered_desc.replace(/[^\x00-\x7F]/g, "");
          filtered_desc = filtered_desc.replace( / *\([^)]*\) */g, " ");
          filtered_desc = filtered_desc.replace( / *\[[^)]*\] */g, " ");
          filtered_desc = filtered_desc.split(",")[0];
          filtered_desc = filtered_desc.split(";")[0];

          card_pair.push( filtered_desc );
          card_array.push( card_pair );

        }


        new_card.attr("id","card"+c);
        new_card.find("input").attr("id","card_input"+c);
        new_card.find("input").attr("name","card_input"+c);
        new_card.find("label").attr("for","card_input"+c);

        $("#three_canvas").append(new_card);



      }

      for(var ac = 0; ac < self.total_card/2; ac++){

        var to_remove = [];

        var random_av_card_left = available_card[ UTILS.randomIntF(0,available_card.length-1) ];
        var random_av_card_right = available_card[ UTILS.randomIntF(0,available_card.length-1) ];
        while( random_av_card_left  == random_av_card_right ){
          random_av_card_right = available_card[ UTILS.randomIntF(0,available_card.length-1) ];
        }

        to_remove.push(random_av_card_left);
        to_remove.push(random_av_card_right);



        var randSwitch = UTILS.randomIntF(0,1);
        if(randSwitch == 1){
          $("#card"+random_av_card_left).find(".three_chin").text( card_array[ac][0] );
          $("#card"+random_av_card_left).find(".three_pin").text(  card_array[ac][1] );
        }else{
          $("#card"+random_av_card_left).find(".three_chin").text( card_array[ac][1] );
          $("#card"+random_av_card_left).find(".three_pin").text(  card_array[ac][0] ).css({visibility:'hidden'});
        }

        $("#card"+random_av_card_left).find("label").attr("key",card_array[ac][2].replace("'",""));

        $("#card"+random_av_card_right).addClass("defCard");
        //$("#card"+random_av_card_right).find(".three_pin").css({display:"none"});
        $("#card"+random_av_card_right).find(".three_chin").css({display:"none"});
        $("#card"+random_av_card_right).find(".three_desc").text( card_array[ac][2].toUpperCase() );
        $("#card"+random_av_card_right).find("label").attr("key",card_array[ac][2].replace("'",""));

        for(var trm = 0; trm < to_remove.length; trm++){
          available_card = available_card.filter(val => val !== to_remove[trm]);
        }



      }


      $("#hits p").text("HITS : "+self.total_hit);

      this.setEvent();
    }

}
