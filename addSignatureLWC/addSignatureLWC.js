import { LightningElement,api } from 'lwc';
import addSignature from '@salesforce/apex/AttachmentApexClass.addSignature';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import {RefreshEvent} from 'lightning/refresh';

let saveType = 'SFFile';
let sCanvas, context;
let mDown = false;
let currPos = {x:0,y:0};
let prePos = {x:0,y:0};

export default class AddSignatureLWC extends LightningElement {

    @api recordId;
    showLoading=false;

    constructor()
    {
        super();
        this.template.addEventListener('mousedown',this.handleMouseDown.bind(this));
        this.template.addEventListener('mouseup',this.handleMouseup.bind(this));
        this.template.addEventListener('mousemove',this.handleMousemove.bind(this));
        this.template.addEventListener('mouseout',this.handleMouseend.bind(this));
        
    }

    renderedCallback()
    {
        sCanvas=this.template.querySelector('canvas');
        context=sCanvas.getContext('2d');
    }
    handleMouseDown(event){
        event.preventDefault();
        mDown = true;
        this.getPos(event);
    }
    handleMouseup(event){
        event.preventDefault();
        mDown = false;
    }
    handleMousemove(event){
        event.preventDefault();
        if(mDown){
            this.getPos(event);
            this.draw();
        }
    }
    handleMouseend(event){
        event.preventDefault();
        mDown = false;
    }

    draw(){
        context.beginPath();
        context.moveTo(prePos.x,prePos.y);
        context.lineCap = 'round';
        context.lineWidth = 1.5;
        context.strokeStyle = "#008000"
        context.lineTo(currPos.x,currPos.y);
        context.closePath();
        context.stroke();
    }

    getPos(event){
        let cRect = sCanvas.getBoundingClientRect();
        prePos = currPos;
        currPos = {x: (event.clientX -cRect.left), y:(event.clientY -cRect.top)};
    }

    handleSignature(event)
    {
        this.showLoading=true;
        context.globalCompositeOperation = "destination-over";
        context.fillStyle = "#FFF";
        context.fillRect(0, 0, sCanvas.width, sCanvas.height);
        let imageURL = sCanvas.toDataURL('image/png');
        let imageData = imageURL.replace(/^data:image\/(png|jpg);base64,/,"");
        console.log(this.recordId);
        addSignature({recordId: this.recordId, data: imageData, doctype: saveType})
        .then(result => {
            this.showToast('Signature Captured!!', 'Thius Signature has been saved','success');
            this.handleClear();
            this.handleRefresh();
            this.showLoading = false;
        })
        .catch(error => {
            this.showToast('Error!!', error.body.message, 'error', 'dismissable');
            this.showLoading = false;

        })
    }
    handleSignatureClear()
    {
        this.handleClear();
    }
    handleClear(){
        context.clearRect(0, 0, sCanvas.width, sCanvas.height);
    }
    handleRefresh()
    {
        this.dispatchEvent(new RefreshEvent());
    }
    showToast(title, message, variant, mode)
    {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }
}