/*
LAOS Extension Content Script HTML components (Popup translator, Pinyin bubble, OCR detection window... )
*/


/*Convert array into laos folder UI an into correct dictionary*/
class MANAGER{
  constructor(){}

  converted(res, concat=true){

    const obj_array = [];

    for(var word of res.data){

      let zhg = word[0].match( /^[^\[]+/gm );
      let trad = "";

      zhg = zhg[0].split(" ");
      zhg = zhg.filter(item => item);

      trad = zhg[0];
      zhg = zhg[1];

      let pin = word[0].match( /(?<=\[).+?(?=\])/ );
      let zhu = toZhuyin(pin[0]);
      pin = tone(pin[0]).toLowerCase();
      pin = pin.split(" ");

      let trans = word[0].match( /(?<=\/).*/gm );

      trans = tone(trans[0]);
      trans = trans.split("/");

      const words = {
        simplified: zhg,
        traditional:trad,
        pinyin:pin,
        zhuyin:zhu,
        definition:trans
      };

      obj_array.push(words);

      }

      /*Concat arrays if OCR to add ALL results, else (popup simply replace the actual array)*/
      if(concat){
        if(!globalObject){ globalObject = []; }
        globalObject = globalObject.concat(obj_array);
      }
      else{ globalObject = obj_array; }

      return obj_array;
  }

  setFolder(list,parent){

    for(let currentOb of list){

      //word
      let folder = document.createElement("section");
      folder.setAttribute("class","laos_folder");
      document.getElementById(parent).appendChild(folder);

      let header = document.createElement("section");
      header.setAttribute("class","laos_header");
      folder.appendChild(header);
      //zhong
      let zhongwen = document.createElement("h1");
      zhongwen.setAttribute("class","laos_zhongwhen");
      header.appendChild(zhongwen);
      //pin
      switch(laosSettings["tradsimp"]){

        case 'traditional':
            $(zhongwen).text(currentOb["traditional"]+"\xa0"+ remove_string_doublon(currentOb["traditional"], currentOb["simplified"]) );
        break;

        case 'simplified':
            $(zhongwen).text(currentOb["simplified"]+"\xa0"+  remove_string_doublon(currentOb["simplified"], currentOb["traditional"]) );
        break;

      }


      let pinyin = document.createElement("h1");
      pinyin.setAttribute("class","laos_pinyin");
      header.appendChild(pinyin);

      $(pinyin).html( set_class_tone(currentOb["pinyin"]) );

      let zhuyin = document.createElement("h1");
      zhuyin.setAttribute("class","laos_zhuyin");
      header.appendChild(zhuyin);
      $(zhuyin).html(set_class_tone_zhuyin(currentOb["zhuyin"]));

      let def = document.createElement("p");
      def.setAttribute("class","laos_def");
      folder.appendChild(def);

      $(def).text(currentOb["definition"].join(";\xa0\xa0"));

    }


  }

  setTips(ob){

    const parent = ob.parent;
    const type = ob.type;
    const animated = ob.animated || true;
    const position = ob.position || "";

    $('#laos_tips').remove();

    let tips = `
      <div id="laos_tips" class="${position}" style="opacity:0;">
        <p> <span class='laos_key'>R</span> add words </p>
        <p>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2V10H19V8C19 4.691 16.309 2 13 2ZM5 16C5 19.309 7.691 22 11 22H13C16.309 22 19 19.309 19 16V12H5V16Z" fill="black"/>
        <path d="M5 10V8C5 4.691 7.691 2 11 2V10H5Z" fill="#FF0073"/>
        </svg> Pinyin bubble </p>
        <p> <span class='laos_key'>alt + E</span> open list </p>
        <p> <span class='laos_key'>alt + T</span> query in Tatoeba </p>
      </div>
    `;

    if(type === 'add'){
      tips = `<div id="laos_tips" class="${position}" style="opacity:0;">
          <p><span class='laos_key'>R</span> add words </p>
        </div>`;
    }

    $(parent).append(tips);
    if(animated){  setTimeout(function(){$("#laos_tips").css({opacity:1});}, 3000); }
    else{ $("#laos_tips").css({opacity:1}); }
  }

}

/*Pinyin bubbles*/
class BUBBLE{

  constructor(range, result){
    this.box = range.getBoundingClientRect();
    this.pinyin = tone( result.data[0][0].match( /(?<=\[).+?(?=\])/ )[0] );
  }

  pop(){
    if(!this.box || !this.pinyin){ return; }


    this.pinyin = this.pinyin.split(" ");
    this.node = $("<div class='laos_bubble'></div>");
    for(var p of this.pinyin){ this.node.append("<p>"+p+"</p>"); }

    //no doublon comparing box (position...)
    for(var b of bubble_list){
      if(JSON.stringify(b.box) == JSON.stringify(this.box)){ return; }
    }

    bubble_list.push(this);
    $("body").append(this.node);
    this.node.css({
      top: $(window).scrollTop() + (this.box.y + this.box.height + 5 ) + "px",
      left: this.box.x + "px",
      minWidth: this.box.width,
      display:'flex',
      alignItems: 'center',
      justifyContent: 'space-around'
    });

    if( this.box.width < this.node.width() ){
      this.node.css({
        left: this.box.x + -5 + -1 * Math.abs(this.node.width() - this.box.width)/2 + "px"
      });
    }

    this.setEvent();
  }

  setEvent(){

    this.node.hover(
      () => this.node.addClass('active') ,
      () => this.node.removeClass('active')
    );

    this.node.on('click',() => { this.node.animate({opacity:0}, 200, () => { this.node.remove(); bubble_list.splice(bubble_list.indexOf(this.node),1); });  });

  }

  remove(){

  }

}

/*Main popup translator*/
class LAOS_POPUP extends MANAGER{

  constructor(id){
    super();
    this.id = id;
    this.$node = $("#"+this.id);
    window.onload = () => this.pop();
  }


  append(){
    let elt = document.createElement("div");
    elt.setAttribute("id",this.id);
    elt.setAttribute("class",'laos_pannel');
    try{
      document.body.appendChild(elt);
      this.$node = $("#"+this.id);
    }catch(error){

    }

  }

  remove(){
    if(this.$node){
      this.$node.remove();
      this.$node = null;
    }
  }

  pop(){
    if(!this.$node || this.$node.length == 0 ){ this.append(); }
  }


  fill(res, pX, pY){

      if(this.$node.length == 0 || !res.data){return;}

      //////-----------------UI-------------------
      //////-----------------UI-------------------
      //////-----------------UI-------------------
      //////-----------------UI-------------------

      this.$node.empty();

      this.setFolder( this.converted(res) , this.id);

      let normalised = ( pX / $(window).width() );
      const overflow = ( pY - window.pageYOffset + this.$node.height() > window.innerHeight ) ? true : false;
      const topPos = (overflow) ? pY - 20 - this.$node.height() : pY + 20;

      this.setTips({
        parent:"#"+this.id,
        animated: true,
        position: (overflow) ? "top" : ""
      });

      this.$node.css({
        display:'block',
        top: topPos,
        left: pX - this.$node.width() * normalised
      });

  }

}

/*Screen capture element (cropping tool)*/
class JCROP{

  constructor(src){
    this.src = src;
    this.id = 'laos_curtainImg';
    this.image = () => document.getElementById(this.id);
    this.area;
    this.jcrop;
  }

  set(){
     return new Promise( (resolve) => {
       var img = new Image();
       img.id = this.id;
       img.src = this.src;
       img.onload = () => {
         $('body').append(img);
         resolve();
       }

       $('body').append("<span id='laos-crop-hint'><p>Press <b>ENTER</b> to apply, or <b>ESC</b> to cancel</p><span class='laos-crop-help'><p>?</p></span></span>")
     });
  }

  crop(){
    $('html').css({overflow:'hidden'});

    this.jcrop = Jcrop.attach(this.id,{multi:false});
    $('.jcrop-stage').css({top:$(window).scrollTop()});
    this.area = {
      w: (window.innerWidth * window.devicePixelRatio)/2+200,
      h: (window.innerHeight * window.devicePixelRatio)/2+200,
      x: (window.innerWidth * window.devicePixelRatio)/2-200,
      y: (window.innerHeight * window.devicePixelRatio)/2-200
    };

    const rect = Jcrop.Rect.fromPoints([this.area.x,this.area.y],[this.area.w,this.area.h]);
    this.jcrop.newWidget(rect);

    this.setEvent();
  }

  destroy(){
    $('html').css({overflow:''});
    $('#laos-crop-hint').remove();
    $('#'+this.id).remove();
    this.jcrop.destroy();
  }

  setEvent(){
    this.jcrop.listen('crop.change', e => this.area = e.pos );
    $(".laos-crop-help").on('click', () => chrome.runtime.sendMessage({ type: 'open', url: '/pages/about.html#picture'}) );
  }


  init(){
    this.set().then( () => this.crop() );
  }

}

/*Laos ocr result*/
class LAOS_OCR extends MANAGER{

  mockFrame;

  constructor(ob){
    super();
    this.text;
    this.accuracy;
    this.onDestroy = ob.onDestroy || null;
    this.list = [];
  }

  fetchOCR(img, area, tradsimp = 'traditional'){
    /*
    Called once cropping is done
    Instanciate Mock iframe to access OCR.html with tesseract
    The result is then retrieved in content.js in the Window event listener
    */
    const self = this;
    return new Promise( (resolve) => {
            /*Instanciate Mock iframe to access OCR.html with tesseract*/
            self.mockFrame = $("<iframe />", {
                  name:'mockFrame',
                  id:'mockFrame',
                  sandbox:'allow-same-origin allow-scripts',
                  src: chrome.runtime.getURL('/ocr.html'),
                  css: {display:'none'}
                }).appendTo('body').get(0);

            self.mockFrame.onload = () => {
              const data = {
                type:'ocr',
                image:img,
                area:area,
                tradsimp:tradsimp,
                ratio: window.devicePixelRatio,
                workerPath: chrome.runtime.getURL('./js/tesseract/worker.min.js'),
                langPath: chrome.runtime.getURL('./data'),
                corePath: chrome.runtime.getURL('./js/tesseract/tesseract-core.wasm.js')
              };
              self.mockFrame.contentWindow.postMessage(data, "*");
            }
    });
  }



  destroy(){
    const self = this;
    $("#laos_ocr").animate({opacity:0, bottom:-150}, 200, function(){
      this.remove();
      if(self.onDestroy){ self.onDestroy(); }
    });
  }

  ready(){
    $('#laos_ocr').addClass('ready');
  }

  pop(){

    /*Wrapper*/
    const container = document.createElement('div');
    container.setAttribute('id','laos_ocr');
    container.setAttribute('class','laos_pannel');

    /*Header*/
    const header = document.createElement('div');
    const tools = document.createElement('section');

    const close = document.createElement('span');
    close.appendChild( document.createElement('span') );
    close.appendChild( document.createElement('span') );
    close.setAttribute('id','laos_ocr_close');

    const help = document.createElement('span');
    const help_p = document.createElement('p');
    help.setAttribute('class','laos-crop-help');
    help.setAttribute('id','laos_ocr_help');
    help.appendChild(help_p);
    help_p.innerHTML = '?';

    tools.appendChild(help);
    tools.appendChild(close);

    const title = document.createElement('p');
    title.innerHTML = 'LAOS picture translator <sup><small style=\'color:#808080;\'>(beta)</small></<sup>';
    header.setAttribute('id','laos_ocr_header');


    header.appendChild(title);
    header.appendChild(tools);


    /*Body*/
    const body = document.createElement('div');
    body.setAttribute('id','laos_ocr_body');


    /*Footer*/
    const footer = document.createElement('div');
    const accuracy = document.createElement('div');
    const led = document.createElement('span');
    const percent = document.createElement('p');

    accuracy.setAttribute('id','laos_ocr_accuracy');
    accuracy.appendChild(led);
    accuracy.appendChild(percent);

    footer.setAttribute('id','laos_ocr_footer');
    footer.appendChild(accuracy);

    /*Loader*/
    const loader = document.createElement('div');
    const loaderLabel = document.createElement('p');
    loaderLabel.innerHTML = 'scanning';
    loader.setAttribute('id','laos_ocr_loader');
    loader.appendChild( document.createElement('span') );
    loader.appendChild(loaderLabel);

    /*Populate*/
    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    container.appendChild(loader);

    try{
      document.body.appendChild(container);
      this.setTips({ parent: '#laos_ocr_footer',type: 'add', animated: false });
      $("#laos_ocr_close").unbind().on('click', this.destroy.bind(this));
      $("#laos_ocr_help").unbind().on('click', () => chrome.runtime.sendMessage({ type: 'open', url: '/pages/about.html#picture'}) );
    }catch(e){}

  }

  setAccuracy(accuracy){

    const $elt = $('#laos_ocr_accuracy');
    $elt.find('p').text(accuracy + '% accuracy');
    var color = 'mid';
    if(accuracy < 70){ color = 'bad'; }
    if(accuracy >= 70 && accuracy < 80){ color = 'mid'; }
    if(accuracy >= 80){ color = 'good'; }
    $elt.find('span').addClass(color);
  }

  dicoCompatible(str){
    /*
    ABCD => [ABCD,BCD, CD, D]
    */
    const ar = []
    for(let c = str.length; c > 0; c-- ){
      let b = Object.assign([],str);
      ar.push( b.splice(-1*c, str.length).join('') );
    }

    return ar;

  }

  search(str){

    const promiseArray = [];

    for(const word of str){
      const prm = new Promise( (resolve) => {
          chrome.runtime.sendMessage({ type:'search', text: word }, data => resolve(data) );
      });
      promiseArray.push( prm );
    }

    return Promise.all(promiseArray);

  }

  setResult(result){

    if(!result){
      $('#laos_ocr_loader').remove();
      $('<div id=\'laos_ocr_null\'><p>no result found :(</p><a class=\'laos_ocr_help\'>need help ?</a></div>').appendTo('#laos_ocr');
    }else{

      this.text = result.text;
      this.accuracy = result.accuracy;
      this.search( this.dicoCompatible(this.text) ).then((list) => {
        list = list.filter(n => n);
        if(list.length == 0){ this.setResult(false); return;}
        list.forEach( word => this.setFolder( this.converted(word,true) ,"laos_ocr_body") );
        this.setAccuracy(this.accuracy);
        this.ready();

      });

      $('.laos_ocr_help').unbind().on('click', () => chrome.runtime.sendMessage({ type: 'open', url: '/pages/about.html#picture'}) );
    }

  }


}
