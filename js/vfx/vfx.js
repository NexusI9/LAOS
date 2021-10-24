function randomIntF(mn, mx) { // min and max included
  mn = parseInt(mn);
  mx = parseInt(mx);
  return  Math.floor(Math.random() * (mx - mn + 1) + mn) ;
}



export class STAR{

  constructor(size, rot){
    this.rotation = rot;
    this.size = size;
  }

  init(){
    var elt = document.createElement("span");
    elt.setAttribute('class','vfx_star');
    elt.style.width = this.size+'em';
    elt.style.height = this.size+'em';
    if(this.rotation){
      elt.style.transform = 'rotate('+randomIntF(0,360)+'deg)';
    }

    return elt;
  }

}


export class EXPLODE{

    constructor(ob){
      this.props = ob.props || null;
      this.number = ob.number || 4;
      this.speed = ob.speed || 500;
      this.id = ob.id || "vfx_epicentre";

      if(this.props == null){ return; }
    }

    init(){
        var epicentre = document.createElement("span");
        epicentre.setAttribute("id",this.id);
        for(var s = 0; s < this.number; s++){
          var props = $(this.props).clone();
          var randDim = randomIntF(0.5,1.3)+'em';
          $(props).css({width:randDim, height:randDim })
          $(epicentre).append( $(props) );
          $(epicentre).css({opacity:0});
          }

        return epicentre;
    }

    trigger(){


      var e = window.event;
      var posX = e.clientX;
      var posY = e.clientY;
      const self = this;
      $("#"+this.id).css({left:posX, top:posY, opacity:1});
      $("#"+this.id).children().each(function(){

        var randX = randomIntF(-800,800);
        var randY = randomIntF(-800,800);
        var randDelay = randomIntF(0,40);
        $(this).delay(randDelay).css({opacity:1}).animate({left:randX,top:randY,opacity:0},self.speed,'swing',function(){ $(this).css({left:0,top:0,opacity:0});});
      });


    }

}
