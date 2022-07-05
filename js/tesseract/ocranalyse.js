/*
  Files :
  Ocr.html
  /js/tesseract/*
  ________________
  OCR Analyse, acts as its own micro env
  Added via an invisible IFrame to the page to execute the scripts

  Since initialized in an iframe (outside of chrome.runtime) => use window.postMessage() to communicate

*/

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


class OcrAnalyse{

  constructor(ob){
    /*public*/
    this.area = ob.area;
    this.image = ob.image;
    this.tradsimp = ob.tradsimp;
    this.ratio = ob.ratio;
    this.workerPath = ob.workerPath;
    this.langPath = ob.langPath;
    this.corePath = ob.corePath;

    /*private*/
    this.selector = 'ocr_img';
    this.node = () => document.getElementById(this.selector);
    this.results = {
      'inverted':null,
      'positive':null
    };
  }

  filter(blob, pass){
    const self = this;
    return new Promise( (resolve) =>{

        const width = self.area.w;
        const height = self.area.h;

        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');
        switch(pass){
          case 'inverted':
            context.filter = 'invert(100%) saturate(0) brightness(200%) contrast(400%)';
          break;

          case 'positive':
            context.filter = 'saturate(0) brightness(200%) contrast(400%)';
          break;
        }

        // Blob => ImageBitmap
        createImageBitmap(blob).then( img => {
          context.drawImage(img, 0, 0);
          resolve( canvas.convertToBlob() );
        });

    });

  }

  getAverageAccuracy(data){
    const words = data.data.words;
    var average = 0;
    for(var word of words){
      average += word.confidence;
    }

    average = parseInt(average / words.length);
    return average;
  }

  blobToBase64(blob){
    return new Promise( (resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  doOCR(img){
    const self = this;
    return new Promise( (resolve) => {

      const worker = Tesseract.createWorker({
        "workerBlobURL": true, //<= CSP 'blob:',
        "cacheMethod":'none', //no use of IndexedDB (prevent error)
        "workerPath": self.workerPath,
        "langPath":  self.langPath,
        "corePath": self.corePath
      });

      const lang = (self.tradsimp == 'traditional') ? 'chi_tra' : 'chi_sim';
      //https://github.com/tesseract-ocr/tesseract/blob/4.0.0/src/ccstruct/publictypes.h#L163

      worker.load()
        .then( () => worker.loadLanguage(lang) )
        .then( () => worker.initialize(lang) )
        .then( () => worker.recognize(img))
        .then( (data) => {
          resolve({
            img: img,
            text: data.data.text.replace(/\s/g, ''),
            accuracy: self.getAverageAccuracy(data) || 0
          });
        });

    });

  }

  onDone(result){
    const $result = $("#result");
    $result.text("accuracy: "+this.accuracy+"% => "+this.result);
  }

  compareResult(results){

    if(results[0].accuracy < 40 && results[1].accuracy < 40){ return false; }
    if(results[0].accuracy > 80 || results[0].accuracy > results[1].accuracy ){ return results[0]; }
    if(results[1].accuracy > 80 || results[1].accuracy > results[0].accuracy ){ return results[1]; }

  }

  crop(){

    const self = this;
    return new Promise( (resolve) => {

      const x = self.area.x;
      const y = self.area.y;
      const width = self.area.w;
      const height = self.area.h;

      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');

      /*base64 picture => Blob => ImageBitmap*/
      fetch(self.image)
        .then( pic => pic.blob() )
        .then( blob => createImageBitmap(blob) )
        .then( bitmap => {
          context.drawImage(bitmap,
            x*self.ratio, y*self.ratio, width*self.ratio, height*self.ratio,
            0, 0, width, height);
            resolve( canvas.convertToBlob() );
         });

    });

  }

  processPicture(cropped,type){
    const self = this;
    return new Promise( (resolve) => {

      cropped.then( result => self.filter(result,type) )
        .then( blob => self.blobToBase64(blob) )
        .then( img => resolve(self.doOCR(img)) )
    });
  }

  init(){

    /*Crop picture*/
    const cropped = this.crop();

    /*Get 2 passes result */
    const inverted = this.processPicture(cropped, 'inverted');
    const positive = this.processPicture(cropped, 'positive');

    /*compare both*/
    return Promise.all([inverted, positive]).then( (results) => this.compareResult(results) );
  }

}


window.addEventListener("message", (req) => {
  req = req.data;

  switch(req.type){
    case 'ocr':
       new OcrAnalyse(req).init().then( result =>  window.parent.postMessage({type:'ocr_result', result:result},"*") );
    break;
  }

});
