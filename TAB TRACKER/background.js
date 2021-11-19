const tabTimeObjectKey="tabTimeObject";  //{ key:url,value:{url:string,trackedSeconds:number,lastDateVal:number //utc  milliseconds?}}
const lastActiveKey="lastActiveTab";     //   {url:string,lastDateVal:number}

chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.runtime.setUninstallURL('https://example.com/extension-survey');
    }
});


 chrome.runtime.onInstalled.addListner(function(){
//     // chrome.storage.sync.set({color:'#3aa757'},function(){
//     //     console.log("The Colour is Green")
//     // });
    chrome.declarativeContent.onPageChanged.removeRules(undefined,function(){
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions:[new chrome.declarativeContent.PageStateMatcher({
                pageUrl:{},
            })
        ],
        actions:[new chrome.declarativeContent.showPageAction()]
        }]);
    });
});


chrome.windows.onFocusChanged.addListner(function(windowId){
    if(windowId==chrome.windows.WINDOW_ID_NONE){
        //it will reset the previous the date and again will restore the difference
        processTabChange(false);
    } else{
        processTabChange(true);
    }
});


function processTabChange(isWindowActive){
    //https://developer.chrome.com/extensions/tabs
    //chrome.tabs.query({'active':true,'currentWindow':true},function(tabs){
    chrome.tabs.query({'active':true},function(tabs){

        console.log("isWindowActive: " + isWindowActive);
        console.log(tabs);

        if(tabs.length >0 && tabs[0]!=null){
            let currentTab=tabs[0];
            let url=currentTab.url;
            let title=currentTab.title;
            let hostName=url;
            try{
                let urlObject=new URL(url);
                hostName=urlObject.hostname;
            }catch(e){
                console.log(`could not construct url from ${currentTab.url} , error: ${e}`);
            }

            chrome.storage.local.get([tabTimeObjectKey,lastActiveTabKey],function(result){
                let lastActiveTabString=result[lastActiveTabKey];
                let tabTimeObjectString=result[tabTimeObjectKey];
                console.log("background.js , get result");
                console.log(result);
                tabTimeObject={};
                if(tabTimeObjectString !=null){
                    tabTimeObject=JSON.parse(tabTimeObjectString);
                }
                lastActiveTab={};
                if(lastActiveTabString !=null){
                    lastActiveTab=JSON.parse(lastActiveTabString);
                }

                //If last tab has been an entry ,stop the time
                //if it has not
                if(lastActiveTab.hasOwnProperty("url") && lastActiveTab.hasOwnProperty("lastDateVal")){

                    let lastUrl=lastActiveTab["url"];
                    let currentDateVal_=Date.now();
                    let passedSeconds=(currentDateVal_ - lastActiveTab["lastDateVal"])*0.001;    //from millisecond to second

                    let fullUrl=lastUrl;
                    if(lastActiveTab.hasOwnProperty("fullUrl")){
                        fullUrl=lastActiveTab["fullUrl"];
                    }

                    if(tabTimeObject.hasOwnProperty(lastUrl)){
                        let lastUrlObjectInfo=tabTimeObject[lastUrl];
                        if(lastUrlObjectInfo.hasOwnProperty("trackedSeconds")){
                            lastUrlObjectInfo["trackedSeconds"]=lastUrlObjectInfo["trackedSeconds"]+ passedSeconds;
                        }else{
                            lastUrlObjectInfo["trackedSeconds"]=passedSeconds;
                        }
                        lastUrlObjectInfo["lastDateVal"]=currentDateVal_;

                        if(lastUrlObjectInfo.hasOwnProperty("urlDetails")){
                            let detailUrlsArr=lastUrlObjectInfo["urlDetails"];
                            if(detailUrlsArr.indexOf(fullUrl)<0){
                                detailUrlsArr.push(fullUrl);
                            }
                    }else{
                      lastUrlObjectInfo["urlDetails"]=[fullUrl];
                    }

                }else{
                    let newUrlInfo={url:lastUrl,trackedSeconds:passedSeconds,lastDateVal:currentDateVal_,startDateVal:lastActiveTab["lastDateVal"],urlDetails:[fullUrl]}
                    tabTimeObject[lastUrl]=newUrlInfo;
                }
            }


                //let currentDate=newDate();    
                let currentDateValue=Date.now();
                //store current tab information
                let lastTabInfo={"url":hostName,"lastDateVal":currentDateValue,"fullUrl":url};
                if(! isWindowActive){
                    lastTabInfo={};
                }
                    //oooh,we can't use variable as key
                    let newLastTabObject={};
                    newLastTabObject[lastActiveTabKey]=JSON.stringify(lastTabInfo);

                  //  chrome.storage.local.set({"lastActiveTab":JSON.stringify(lastTabInfo)},function(){
                    chrome.storage.local.set(newLastTabObject,function(){
                        console.log("lastActiveTab stored :" + hostName);
                        const tabTimeObjectString=JSON.stringify(tabTimeObject);
                        let newTabTimesObject={};
                        newTabTimesObject[tabTimeObjectKey]=tabTimeObjectString;
                        chrome.storage.local.set(newTabTimesObject,function(){

                        });
                    });
                    });
                    //lastActiveTabKey has informatiion about the url of thr tab and date when the tab was opened,or just the date value    
            }

    });    
}

function onTabTrack(activeInfo){
    let tabId=activeInfo.tabId;
    let windowId=activeInfo.windowId;

  //  chrome.tabs.getSelected: deprecated, use tabs.query instead 
    processTabChange(true);



}




chrome.tabs.onActivated.addListner(onTabTrack);