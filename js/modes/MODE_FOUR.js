import * as UTILS from '../utils.js';



async function fetchSentences(){
    let dtb = await fetch("./data/convert_zhgsent.json");
    let to_text = await dtb.json();
    return to_text;
  }


export default class MODE_FOUR{

  constructor(wordList, laosSettings){
    this.wordList = wordList;
    this.laosSettings = laosSettings;
    this.maxCard = 4;
    this.generated_sentence = 0;
    this.longest_sentence = 25;

    this.sentences = {};
    this.index = -1;
    this.guess_ob = []; //word pos elt

    this.selected_bubble;
    this.lastGuess;
    this.offsetX;
    this.offsetY;
    this.mainDatabase;

    this.binded_drag = this.drag.bind(this);

  }

  drag(e){ //have to use a function cause of removeEventListener
      const self = this;
      e.preventDefault();
      $(this.selected_bubble["bubble"]).css({
        top: e.clientY + self.offsetY + "px",
        left:e.clientX + self.offsetX + "px"
      });

      for(let go in this.guess_ob){
        if(this.isOverlapping( this.selected_bubble["bubble"] , this.guess_ob[go]["elt"])){
          this.lastGuess =  this.guess_ob[go];
          if( $(this.selected_bubble["bubble"]).css("transform") != "matrix(1.3, 0, 0, 1.3, 0, 0)" ){$(this.selected_bubble["bubble"]).css({transform:"scale(1.3)"}); }
        }else{
          if( $(this.selected_bubble["bubble"]).css("transform") == "matrix(1.3, 0, 0, 1.3, 0, 0)" ){$(this.selected_bubble["bubble"]).css({transform:"scale(1)"}); }
        }
      }

  }

  isOverlapping(rect1, rect2){
    rect1 = rect1[0].getBoundingClientRect();
    rect2 = rect2.getBoundingClientRect();

    let overlap = !(rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom);

    return overlap;

  }

  //POPULATE
  refill(db){
     const self = this;
      let tempobj = [];
      for(let x in self.wordList){
        for(let y in self.wordList[x]){
          //set object
          const sentence = { word:self.wordList[x][y][self.laosSettings["tradsimp"]], sentences:[] }
          //go through database to fetch examples
          for(let dtb_sentence of db){
            if( dtb_sentence["zhg"].includes(sentence.word) && dtb_sentence["trans"][0] ){ dtb_sentence.word = sentence.word; sentence.sentences.push( dtb_sentence ); }
          }
          //push to global if found sentences
          if(sentence.sentences.length > 0){ tempobj.push(sentence); }
        }
      }

      if(tempobj.length < self.maxCard){ return false; } //not enough
      if(tempobj.length == self.maxCard){  return tempobj; } //right amount, no need to pick random
      if(tempobj.length > self.maxCard){

        const new_temp = []
        const new_randList = UTILS.generate_random_list([0,tempobj.length],self.maxCard);
        for(let rla of new_randList){ new_temp.push(tempobj[rla]); }
        return new_temp;

      } //too much words (more probable) so need to pick randomly "self.maxCard" (6) of valid words

    }

  trim(sentence,limit){
    const self = this;
    var zhongwen = sentence["zhg"];
    var translate = sentence["trans"];
    const word = sentence["word"];

    if(zhongwen.length < limit){ return sentence; }

    //split if has a comma
    if(zhongwen.match(/\,|\，|\;/)){
      zhongwen = zhongwen.split(/\,|\，|\;/);
      translate = translate[0].split(/\,|\，|\;/);

      //check which part contain the word
      for(var t in zhongwen){
        if(zhongwen[t] && zhongwen[t].includes(word)){
          zhongwen = zhongwen[t];
          translate = (translate[t]) ? [translate[t]] : [""];
        }
      }
    }

    sentence.zhg = zhongwen;
    sentence.trans = translate;
    return sentence;
  }

  reload(db){
    const self = this;
    //opacity 0
    $("#four_canvas section").css({transform:"scale(0)",opacity:0});
    setTimeout(function(){
      $("#four_bubbles").empty();
      $("#four_canvas").empty();
      self.sentence_populate(db);
    },500);

  }

  sentence_populate(db){
    const self = this;
    this.generated_sentence = 0;
    self.sentences = self.refill(db);
    let posArray = UTILS.shuffle_array(Array.from(Array(4).keys()));
    let count = 0;

    if(self.sentences){
      for(let sentence of self.sentences){
        let chosen_sentence = (sentence["sentences"].length == 1) ? sentence["sentences"][0] : sentence["sentences"][ UTILS.randomIntF(0, sentence["sentences"].length-1) ];
        chosen_sentence = self.trim(chosen_sentence, 15);
        if(chosen_sentence['zhg'].length > self.longest_sentence || chosen_sentence['zhg'].length == 1 ){ sentence.generated = false; continue; }
        //GENERATE BUBBLE
        const bub = $("<section class='four_bubble' data-word:'"+sentence["word"]+"'>"+sentence["word"]+"</section>");
        $("#four_bubbles").append(bub);
        sentence["initPos"] = $(bub).position();
        sentence["bubble"] = bub;
        sentence["locked"] = false;

        $(bub).css({
          top:$(bub).height() + $("#four_bubble_container").position().top+( 1.5*$(bub).height() * posArray[count]  ) +"px",
          left:$("#four_bubble_container").position().left + 20,
        });
        count++;
        //GENERATE SENTECES

        const section = document.createElement('section');
        $("#four_canvas").append(section);
        $(section).append("<span class='four_mainphrase'></span>");
        const table = document.createElement('table');
        $(table).attr('class','four_table');
        $(section).find('span').append(table);

          //ZHONGWEN & PINYIN

          //remove word (add the blank)
          let idx =  chosen_sentence["zhg"].indexOf(sentence["word"]);
          let new_sent = chosen_sentence["zhg"].replace(sentence["word"],"");
          var splitted = new_sent.split("");
          splitted.splice(idx,0,sentence["word"]);

          let tr = document.createElement("tr");
          tr.setAttribute("class","four_zhg");
          let trt = document.createElement("tr");
          trt.setAttribute("class","four_pinyin");

          $(table).append(tr);
          $(table).append(trt);

          //chop the sentence into a grid
          for(var sp in splitted){
            let td = document.createElement("td");
            $(tr).append(td);
            let tdt = document.createElement("td");
            $(trt).append(tdt);

            if(sp == idx){
              $(td).addClass("four_guess four_tosquare");
              $(tdt).addClass("four_guess");
              $(td).attr("data-word",sentence["word"]);
              td.innerHTML = "<p>"+splitted[sp]+"</p>";
              tdt.innerHTML ="<p>"+Pinyin(splitted[sp])+"</p>";

              let gb = {
                word:sentence["word"],
                elt:td,
                box:td.getBoundingClientRect()
              };
              self.guess_ob.push(gb);
            }else{
              if(splitted[sp].toString().match(/[A-Za-z]+/g) == null && splitted[sp].toString().match(/[0-9]+/g) == null ){ tdt.innerHTML = Pinyin(splitted[sp]);  }
              else{ tdt.innerHTML = " ";  }
              td.innerHTML = splitted[sp];
            }
          }

          //TRANSLATION
          for(var t in chosen_sentence["trans"]){
            if(!chosen_sentence['trans'][t] || chosen_sentence['trans'][t] == ''){break;}
            let translation = document.createElement("p");
            translation.setAttribute("class","four_translate");
            section.append(translation);
            translation.innerHTML = "&ensp;<img src='./media/subarrow.svg'>&ensp;" + chosen_sentence["trans"][t];
          }

          sentence.generated = true;
          self.generated_sentence++;

    }//populate done

      $("#four_ico_rand").unbind().on("click",function(){self.reload(self.mainDatabase)});

    }

    this.bubbleEvent();

  }


  bubbleEvent(){
          const self = this;
          //EVENTS
          $(".four_bubble").mousedown(function(e){
            for(let b of self.sentences){ if(b.generated && b["bubble"][0] == $(this)[0]){  self.selected_bubble = b; }  }
            if(!self.selected_bubble || self.selected_bubble["locked"]){return;}
            self.offsetY = $(self.selected_bubble["bubble"])[0].offsetTop - e.clientY;
            self.offsetX = $(self.selected_bubble["bubble"])[0].offsetLeft - e.clientX;
            document.addEventListener("mousemove",self.binded_drag);
          });

          $(".four_bubble").mouseup(function(){
            document.removeEventListener("mousemove",self.binded_drag);
            if(self.selected_bubble["word"] == self.lastGuess["word"] && self.isOverlapping( self.selected_bubble["bubble"] , self.lastGuess["elt"])){
              $(self.selected_bubble["bubble"]).css({
                transform:"scale(1)",
                top:self.lastGuess["elt"].getBoundingClientRect().top+"px",
                left:self.lastGuess["elt"].getBoundingClientRect().left+"px",
                opacity:0,
              });

              $(self.lastGuess["elt"]).parent().parent().find(".four_guess p").css({opacity:1});
              self.selected_bubble["locked"] = true;

              let are_all_checked = 0;
              for(let check in self.sentences){
                if(self.sentences[check]["locked"]){are_all_checked+=1;}
              }

              if(are_all_checked == self.generated_sentence){
                setTimeout(function(){self.reload(self.mainDatabase);},400);
              }

            }else if(self.selected_bubble["word"] != self.lastGuess["word"] && self.isOverlapping( self.selected_bubble["bubble"] , self.lastGuess["elt"])){
              $(self.selected_bubble["bubble"]).effect("shake");
            }


            self.selected_bubble = undefined;
          });

  }

  setEvent(){
    $("#four_ico_pinyin").on("click",function(){
      if($(".four_pinyin").css("opacity") == 0){ $(".four_pinyin").css({opacity:1}); }
      else{ $(".four_pinyin").css({opacity:0}); }
    });

    $("#four_ico_yingwen").on("click",function(){
      if($(".four_translate").css("opacity") == 1){ $(".four_translate").css({opacity:0}); }
      else{ $(".four_translate").css({opacity:1}); }
    });
  }

  init(){
    const self = this;
    self.wordList = UTILS.check_null(self.wordList);
    if(!self.wordList || UTILS.get_length(self.wordList) < self.maxCard){
      UTILS.notEnoughWords(self.maxCard);
      return;
    }
    $("body").css({overflow:"hidden"});
    this.setEvent();
    fetchSentences().then(dtb => {self.mainDatabase = dtb; self.sentence_populate(dtb);});
  }


}
