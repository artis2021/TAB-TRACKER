'use strict';

let page=document.getElementById('buttonDiv');
const kButtonColors=['red','blue','yellow','green'];

function constructOptions(kButtonColors){
    for(let i of kButtonColors){
        let button=document.createElement('button');
        button.style.backgroundColor=i;
        button.addEventListener('click',function(){
            chrome.storage.sync.set({color:i},function(){
                console.log("The colour is "+ i);
            });
        });
        page.appendChild(button)
    }
}
constructOptions(kButtonColors);