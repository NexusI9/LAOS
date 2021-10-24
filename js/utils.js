

export function remove_tones(str){

    str = str.replace(/\ī|\í|\ǐ|\ì/g,"i");
    str = str.replace(/\ā|\á|\ǎ|\à/g,"a");
    str = str.replace(/\ē|\é|\ě|\è/g,"e");
    str = str.replace(/\ō|\ó|\ǒ|\ò/g,"o");
    str = str.replace(/\ū|\ú|\ǔ|\ù|\ǚ/g,"u");

    return str;
  }

export function check_null(ar){

    for(var x = 0; x < ar.length; x++){
      if(ar[x] == null || ar[x].length == 0){
        wordList.splice(x,1);
        return check_null(ar);
      }
    }

    return ar;
  }

export function notEnoughWords(n){
    let elt = `
      <div id="notEnough" class="warnWindow">
        <h1>Oops ! Seems like you don't have enough words to start the exercise.</h1>
        <h1>You need at least `+n+` words for this exercise.</h1>
        <h1>Simply hover on mandarin characters and press R to add words !</h1>
      </div>
    `;

    $("body").append(elt);

  }

export function get_length(ar){
      let length = 0;

      for(var x in ar){
        length += ar[x].length;
      }

      return length;
  }

export function shuffle_array(ar){ return ar.sort( () => Math.random() - 0.5); }

export function random_from_range(){

    var new_min = $("#min").val();
    var new_max = $("#max").val();

    $("#interval > input").change(function(){
        new_min = $("#min").val();
        new_max = $("#max").val();

        if(new_max > max){ new_max = max
                           $("#max").attr("value",new_max);
                         }
        if(new_min < 0){ new_min = min;
                         $("#min").attr("value",new_min);
                        }



    });

        return randomIntF(new_min,new_max);

  }

export function randomIntF(mn, mx) { // min and max included
  mn = parseInt(mn);
  mx = parseInt(mx);
  return  Math.floor(Math.random() * (mx - mn + 1) + mn) ;
}

var grl = [];
export function generate_random_list(interval,length){

  for(let fill = interval[0]; fill < interval[1]; fill++){ grl.push(fill); }
  const init_length = grl.length;

  for(let sp = 0; sp < init_length-length; sp++){
    let indx = randomIntF(0,grl.length);
    grl.splice(indx,1);
  }

  if(grl.length > length){  grl.splice(length,grl.length);  }

  let toReturn = grl;
  grl = [];
  return toReturn;
}
