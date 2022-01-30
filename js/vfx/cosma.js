
import * as UTILS from '../utilities/utils.js';

export default class COSMA{

  color;
  maxNumber;
  container;
  width;
  arCircles;
  arLines;
  ctx;
  velocity;
  radius;
  maxConnection;
  opacity;

  counter;

   constructor(lp){

     this.color = lp["color"] || "#ddd";
     this.maxNumber = lp["maxNumber"] || 6;
     this.container = lp["container"] || "body";
     this.strokeWidth = lp["strokeWidth"] || 5;
     this.radius = lp["radius"] || [10,120];
     this.arCircles = [];
     this.arLines = [];
     this.maxConnection = lp["maxConnection"] || 4;
     this.velocity = lp["velocity"] || 5;
     this.opacity = lp["opacity"] || 1;

   }

   init(){

      const canvas = document.createElement("canvas");
      this.counter = 0;
      canvas.setAttribute("id","cosma");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      $(this.container).prepend(canvas);
      canvas.style.opacity = this.opacity;
      this.ctx = canvas.getContext("2d");

      $(canvas).css({
        position:"fixed",
        top:0,
        left:0,
        margin:0,
        padding:0,
        overflow:"hidden",
        width:"100%",
        height:"100%",
        zIndex:0
      });

      let prevCircle;
      for(var nm = 0; nm < this.maxNumber; nm++){
        let rad = UTILS.randomIntF(this.radius[0],this.radius[1]);

        this.arCircles.push({
          lineWidth:this.strokeWidth,
          x:UTILS.randomIntF(-rad/2,window.innerWidth+rad/2),
          y:UTILS.randomIntF(-rad/2,window.innerHeight+rad/2),
          radius:rad,
          sAngle:0,
          eAngle:2*Math.PI,
          velocityX:UTILS.randomIntF(-2*this.velocity,this.velocity),
          velocityY:UTILS.randomIntF(-2*this.velocity,this.velocity)
        });


        for(var l = 0; l < this.maxConnection; l++){

          this.arLines.push({
            lineWidth:UTILS.randomIntF(this.strokeWidth/5,this.strokeWidth/1.5),
            initPos:[this.arCircles[nm%this.maxConnection].x, this.arCircles[nm%this.maxConnection].y],
            endPos:[this.arCircles[nm].x, this.arCircles[nm].y]
          });

        }

      }



      let self = this;


      window.requestAnimationFrame(this.draw.bind(this));
   }

   draw(){

     if(!this.ctx){
       //console.warn("[COSMA] No context for canvas");
       return;
     }

     this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
     let time = new Date();
     let prevCircle;
     for(var c = 0; c < this.arCircles.length; c++){

       this.ctx.beginPath();
       this.arCircles[c].x = this.arCircles[c].x + Math.sin(this.counter) * Math.cos(this.counter) * this.arCircles[c].velocityX ;
       this.arCircles[c].y = this.arCircles[c].y + Math.sin(this.counter) * this.arCircles[c].velocityY ;

        this.ctx.arc(
          this.arCircles[c].x,
          this.arCircles[c].y,
          this.arCircles[c].radius,
          this.arCircles[c].sAngle,
          this.arCircles[c].eAngle,
        );

       this.ctx.fillStyle = this.color;
       this.ctx.fill();

       for(var l = 0; l < this.arLines.length; l++){

         this.ctx.beginPath();
         this.arLines[l].initPos = [this.arCircles[l%this.maxConnection].x, this.arCircles[l%this.maxConnection].y];
         this.arLines[l].endPos = [this.arCircles[c].x, this.arCircles[c].y];
         this.ctx.lineWidth = this.arLines[l].lineWidth/2;
         this.ctx.strokeStyle = this.color;
         this.ctx.moveTo( this.arLines[l].initPos[0], this.arLines[l].initPos[1] );
         this.ctx.lineTo( this.arLines[l].endPos[0], this.arLines[l].endPos[1] );
         this.ctx.stroke();

       }

     }

      this.counter += 0.008;
      window.requestAnimationFrame(this.draw.bind(this));
   }

   setColor(newColor){ this.color = newColor; }


}
