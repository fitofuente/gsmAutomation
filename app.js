const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
const chromedriver = require('chromedriver');
const chrome = require('selenium-webdriver/chrome');

// Importing excel module
const xlsx = require('xlsx');


const run = async()=>{

    const screenSize = {
        width: 1280,
        height: 960
    };

    let driver = await new Builder()
        .forBrowser(Browser.CHROME)

        // Headless mode and screen size
        .setChromeOptions(
            new chrome.Options()
            .headless()
            .windowSize(screenSize)
        )
        .build();
        console.log(`DATE: ${new Date().getHours()} : ${new Date().getMinutes()}`);

    await driver.manage().setTimeouts({implicit: 0, pageLoad: 10000, script: 30000});

    try{

        // Nav to this link
        /** For ROUND TWO page=1 will change to page=51 (Note date: 09/01/2023) */
        /** For ROUND THREE page=51 will change to page=101 (Note date: 11/01/2023) */
        console.log('Go to the website');
        await driver.get('https://vinylhub.discogs.com/browse/shop?page=121');

        // Wait 3 seconds until cookie popUp is displayed and click on it
        await driver.wait(until.elementLocated(By.css('#onetrust-accept-btn-handler')), 3000).click();

        // Wait until the title is set to Vinylhub Record Store Database
        await driver.wait(until.titleIs('Browsing record shops | Vinylhub Record Store Database'));
        console.log("The Tab's title is set");

        // Select all the Stores in one page
        const storesLength = await driver.wait(until.elementsLocated(By.css('ul[class*=grid_] li')));
        console.log('Store list is selected');


        /** Here is where the selection of each STORE begins */
        /** First, I will create an ARRAY where I will save the Store's information (an OBJECT) */
        const storesInformation = [];

        // Set the Store IDs
        let storeId = 4800;

        await driver.wait(async()=>{

            /*
                *This will go from page to page but it WONT control on which page the app is
                * It will go from page to page because of the await nextBttn.click(); at the end of the for loop
                * 
                * Write page < 284 to iterate through all pages
             */ 
            /** First round will go from page 1 to page 50 (REMEMBER TO CHANGE THE ID, next one should start at 2000)
             * Second round will go from page 51 to page 100
             * Third round will go from page 101 to page 121
             * Final round will go from page 121 to page 139
             * (THIS IS THE END, WEBSITE HAVE AN ERROR WITH THE DB AFTER INDEX 139)
             * REMEMBER TO CHANGE THE EXCEL FILE NAME
            */
            for(let page = 121; page < 140; page++){

                console.log(`PAGE ${page}`);

                // Wait for next pages to LOAD
                if(page > 1){
                    console.log('Waiting for the new page to load');

                    try{
                        /*
                        ** This DIV have a "row" class that will change every time "next page" is clicked 
                        ** The class will change from "row" to "row_19PJP4xpbGK5" and once the next page is loaded will change to "row"
                        */
                        await driver.wait(until.elementLocated(By.css('div[class="row_19PJP4xpbGK5"]')), 2000);
                        await driver.wait(until.elementLocated(By.css('div[class="row"]')));

                    }catch(err){
                        console.log(`Page ${page} Loaded`);
                    };

                    console.log('It is loaded');
                };

                /**  SELECT THE STORES (set to storesLength.length to get all stores in one page) */ 
                /** First store starts at index = 0 */
                storeLoop: for(let index = 0; index < storesLength.length; index++){
    
                    // Select all the Stores 
                    /* *** This will avoid the STALE exception *** */
                    const stores = await driver.wait(until.elementsLocated(By.css('ul[class*=grid_] li')));
        
                    const info = {
                        id: storeId++,
                        title: 'none',
                        description: 'none',
                        address: 'none',
                        country: 'none',
                        phone: 'none',
                        extLinks: [],
                        oficialEmail: 'none'
                    };

                    // GET the COUNTRY of the Store
                    /** Select each COUNTRY in the Stores Main Page */
                    try{

                        console.log('Getting the COUNTRY');
                        const storeCountryArray = await driver.wait(until.elementsLocated(By.css('div[class="_3ZRs8wX2kTSF"]')));
    
                            /** Get Store COUNTRY as per the index of the FOR Loop 
                             * As this is an array, we'll use the index to iterate through each one of the Cities and saving them on the object INFO
                             * We want to find the last comma, and then if the commaIndex var doesn't gives us -1 we can save the Country by trimming the return value
                             * If commaIndex gives us -1 then the comma doesn't exist and storeCountry will return only the country.
                            */
                            const storeCountry = await storeCountryArray[index].getText()
                            const commaIndex = storeCountry.lastIndexOf(',');

                            if (commaIndex != -1){

                                info.country = storeCountry.substring(commaIndex+1).trim();

                            }else{

                                info.country = storeCountry;
                            };

                        console.log('COUNTRY SAVED');

                    }catch(error){
                        console.log('No Country was found');
                    };

                    /** This will change to TRUE if there is no error */
                    let notFound = false;
                    
                        console.log(`Store ${index+1} selected`);
                        console.log('*******************************************************************');
                        console.log('*******************************************************************');
        
                            /*** SELECT THE STORE ***/
                            try{
                                await stores[index].findElement(By.css('a')).click();
    
                            }catch(error){
                                console.log('ERROR CLICKING ON THE STORE');
                                continue storeLoop;
                            }
                            
                            // Find (if any) 404 error or any error
                            try{
                                console.log('Awaiting error');
                                await driver.wait(until.elementLocated(By.css('div[class*=alert]')), 2000);
        
                            }catch(notError){
        
                                // True if no error were found
                                console.log('No ERRORS WERE FOUND');
                                notFound = true;
                            };
        
                            // Once inside the Store
    
                            /**If notFound == true it means that this store has information */
                            if(notFound){
        
                                console.log("Getting the Store's Title");
                                try{
                                    info.title = await driver.findElement(By.css('div[class*=shop-title] > h1')).getText();
                                }catch(error){
                                    console.log("The store doesn't have a title");
                                };
            
                                console.log("Getting the Store's Description");
                                try{
                                    info.description = await driver.findElement(By.css('section[class=body-text]')).getText();
                                }catch(error){
                                    console.log("The store doesn't have a Description");
                                };
            
                                console.log("Getting Phone and Address");
                                await driver.wait(async()=>{
            
                                    // Names of Genres, Address, Phone, Hours, Also sells
                                    const infoName = await driver.findElements(By.css('dl[class=dl-horizontal] dt'));
                                    // Values of those names
                                    const arrContact = await driver.findElements(By.css('dl[class=dl-horizontal] dd'));
                                    
                                    infoName.forEach(async (names, index) =>{
            
                                        if(await names.getText() == 'Address'){
                                            info.address = await arrContact[index].getText();
                                        };
                                        if(await names.getText() == 'Phone'){
                                            info.phone = await arrContact[index].getText();
                                        };
                                    });
                                    return true;
                                });
                        
                                console.log("Getting External links");
                                // Get Links
                                try{
    
                                    // Get all links on the website (External Links section)
                                    const arrLiElement = await driver.wait(until.elementsLocated(By.css('td[id=external-links] > ul li')), 3000);
    
                                    console.log('Get EXTERNAL LINKS');            
                                        // Get external links (itaration)
                                        await driver.wait(()=>{
    
                                            /** Only when both lengths are equal, the function will return true (line 149) and the programm will continue */
                                            if(info.extLinks.length < arrLiElement.length){
    
                                                console.log('Va a empezar a iterar buscando links');
    
                                                // Iterate through each External Link to get the links
                                                arrLiElement.forEach(async (list) =>{
    
                                                    console.log('Esta iterando');
    
                                                    /* ** List here is not <li> child (i.e <a> element) but the <li> element itself ** */
                                                    info.extLinks.push(await list.findElement(By.css('a')).getAttribute('href'));
                                                });
    
                                            }else{
                                                return true;
                                            }
                                        });
                                }catch(error){
                                    console.log("The store doesn't have links");
                                };
    
                                /*  GOOGLE MAP INFORMATION  */
    
                                // Get the window tabs
                                let tabs;
    
                                try{
    
                                    console.log('Go to google map');
    
                                    // Click on google map
                                    await driver.findElement(By.css('a[href^="http://maps.google.com/maps/search"]')).click();
    
                                    console.log('Getting Tabs .... 1');
                                    /* [0] = Vinyl Store, [1] = google map */ 
                                    tabs = await driver.getAllWindowHandles();
                                    console.log(tabs);
    
                                    console.log('Change to tab google map');
                                    // Change control to second Tab (google map)
                                    await driver.switchTo().window(tabs[1]);
    
                                    await driver.executeScript('console.log("google map")');
    
                                    /* Accept Cookies */
                                    try{
    
                                        // Cookies are only accepted once
                                        await driver.wait(until.elementLocated(By.css('button[aria-label="Aceptar todo"]')), 2000).click();
    
                                    }catch(error){
                                        //console.log(error);
                                        console.log('No popUp with cookies');
                                    };
                                    
                                    // Find the website link
                                    try{
    
                                        console.log('Wait for google map to properly open');
    
                                        // Wait until Google Map is open
                                        await driver.wait(until.titleContains('- Google Maps'));
    
                                        console.log('Finding link to the website');
    
                                        // Find the link to the website
                                        await driver.wait(until.elementLocated(By.css('a[aria-label*="Sitio web"]')), 2000).click();
    
                                        console.log('Getting tabs .... 2');
    
                                        /* [0] = Vinyl Store, [1] = google map, [2] = Store */ 
                                        tabs = await driver.getAllWindowHandles();
                                        console.log(tabs);
    
    
                                        console.log('Close google map');
    
                                        // Close current tab (Google Map [1])
                                        await driver.close();
    
                                        console.log('Cambio a tienda');
    
                                        // Change control to third Tab (Store)
                                        await driver.switchTo().window(tabs[2]);
    
                                        console.log('Finding email');
    
                                        // ONCE INSIDE THE STORE WEBSITE
                                        info.oficialEmail = (await driver.wait(until.elementLocated(By.css('a[href*="@"]')), 10000).getAttribute('href')).slice(7);
    
    
                                        console.log('Showing webDriver');
                                        console.log(info.oficialEmail);
    
                                    }catch(error){
                                        // console.log(error);
                                        // If the website was not found, continue
                                        console.log('No website links were found');
    
                                        console.log('CATCH THE ERROR');
    
                                        // Close all tabs but the first one
    
                                        /** If I have more than one tab open and too many were opened I need to close them from the last one to the 2nd one */
                                        /** The first one [0] is always the list of stores */
    
                                        console.log('Get handles .... 3');
    
                                        tabs = await driver.getAllWindowHandles();
                                        console.log(tabs);
    
                                        for(let tab = tabs.length-1; tab > 0; tab--){
    
                                            console.log(`closing tab ${tab} and cambio a la anterior`);
    
                                            await driver.close();
                                            await driver.switchTo().window(tabs[tab-1]);
    
                                        };
                                    };
    
                                }catch(error){
                                    console.log('Google map was not found');
                                };
    
    
                                /*  SAVE INFORMATION   */
    
                                // Wait 2 second to add info into storesInformation
                                await driver.sleep(2000);
    
                                console.log('----**** INFORMACION CARGADA **** ----');
    
                                /* Convert link ARRAY to String */
                                info.extLinks = info.extLinks.join(', ');
    
                                // Save Store information
                                storesInformation.push(info);
    
                                tabs = await driver.getAllWindowHandles();
                                // Close all open tabs but the first one
                                for(let tab = tabs.length-1; tab > 0; tab--){
    
                                    console.log(`closing tab ${tab} and cambio a la anterior`);
    
                                    await driver.close();
                                    await driver.switchTo().window(tabs[tab-1]);
                                };
    
                                // Back to Store list
                                console.log('Nav to Store List');
                                await driver.navigate().back();
                        
                                // Wait until the title is set to Vinylhub Record Store Database
                                await driver.wait(until.titleIs('Browsing record shops | Vinylhub Record Store Database'));
            
                                console.log('*******************************************************************');
                                console.log('*******************************************************************');
    
                            /** If notFound == false it means that the Store didn't have information */
                            }else if(notFound == false){
        
                                /* If the information was not found */
                                info.title = 'none';
                                info.description = 'none';
                                info.address = 'none';
                                info.phone = 'none';
                                info.extLinks = 'none';
    
                                // Save data into info OBJECT
                                await driver.sleep(1000);
    
                                // Save Store information
                                storesInformation.push(info);
        
                                // Back to Store list
                                console.log('Nav to Store List');
                                await driver.navigate().back();
                        
                                // // Wait until the title is set to Vinylhub Record Store Database
                                await driver.wait(until.titleIs('Browsing record shops | Vinylhub Record Store Database'));
            
                                console.log('*******************************************************************');
                                console.log('*******************************************************************');
                            };
                }   // END FOR

                await driver.wait(until.elementLocated(By.css('i[class="fa fa-chevron-right"]'))).click();
            }; // END NEXT PAGE


            return true;
        }); // END MAIN DRIVER.WAIT 

        console.log(`Scrapping process ended at: DATE: ${new Date().getHours()} : ${new Date().getMinutes()}`);



        /**** CONVERT TO EXCEL ****/
        /** The arg of the json_to_sheet method is an OBJ, if you try with an actual JSON it gives you an error */
        const wSheet = xlsx.utils.json_to_sheet(storesInformation);
        const wBook = xlsx.utils.book_new();

        xlsx.utils.book_append_sheet(wBook,wSheet,'Stores');

        // Generate Buffer
        xlsx.write(wBook,{bookType:'xlsx', type:'buffer'});

        // Binary String
        xlsx.write(wBook,{bookType:'xlsx', type:'binary'});

        xlsx.writeFile(wBook, 'Vinyl_Store_Information_04.xlsx');

    }catch(error){
        console.log(error);
    }
};

run();


