//const sdk = require('api')('@opensea/v1.0#gbq4cz1cksxopxqw'); // for this use ==> npm install api
const opensea = require("opensea-js");
const csv = require('csv-parser');
const fs = require('fs');
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;

const MnemonicWalletSubprovider = require("@0x/subproviders")
.MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");


const MNEMONIC =  ""; // seed phrase 
const rpcUrl = "";
const accountAddress = ""; // wallet address


var time = 1; // minutes
var fileName = "listing.csv";


var sleep = t => new Promise(s => setTimeout(s, t));


const makeOffer = async (csvRows) =>{

	
	if (!MNEMONIC) {
		console.error(
		"Please set a mnemonic, Alchemy/Infura key, owner, network, API key, nft contract, and factory contract address."
	);
	return;
	}

	const mnemonicWalletSubprovider = await new MnemonicWalletSubprovider({
		mnemonic: MNEMONIC,
	});
	const infuraRpcSubprovider =  await new RPCSubprovider({ rpcUrl });
	
	
	const providerEngine =  await new Web3ProviderEngine();
	await providerEngine.addProvider(mnemonicWalletSubprovider);
	await providerEngine.addProvider(infuraRpcSubprovider);
	await providerEngine.start();
	
	const seaport = await new OpenSeaPort(
	providerEngine,
	{
		networkName: Network.Main,		
		apiKey: ""
	},
	(arg,err) => console.log(arg,err));
	console.log('Seaport');	
	
	for(var i=0;i<csvRows.length;i++){
		
		await console.log("Row # " + parseInt(i+1));
		await console.log(csvRows[i]);
		var url = csvRows[i]['URL'].toString()
		if(url.includes('--')){
			
			var urls = url.split('--');
			var assets = [];
			for(var j=0;j<urls.length;j++){

				url = urls[j].split('/');
				tokenId = url[5];
				tokenAddress = url[4];
				
				assets.push({tokenId,tokenAddress});
				
			}			
			
			var bundleName = csvRows[i]['Scheme Name'].toString().trim();
			var price = parseFloat(csvRows[i]['Price']);
			var expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * (time/60));
						
			//console.log(bundleName);
			//console.log(price);
			//console.log(assets);
			
			try{
			const bundle = await seaport.createBundleSellOrder({
				  bundleName, 			 			 
				  assets, 
				  accountAddress, 
				  startAmount: price,			  
				  expirationTime,			  
				})
			}catch(e){
				await console.log(e.message);
			}	

			
		}else{		
			var tokenId = url[5];
			var tokenAddress = url[4];
			var schemeName = csvRows[i]['Scheme Name'].toString().trim();
			var price = parseFloat(csvRows[i]['Price']);
			var expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * (time/60));
							
			try{
				const listing = await seaport.createSellOrder({
				  asset: {
					tokenId,
					tokenAddress,
					schemaName: schemeName,
				  },
				  accountAddress,
				  startAmount: price,
				  // If `endAmount` is specified, the order will decline in value to that amount until `expirationTime`. Otherwise, it's a fixed-price order:
				  
				  expirationTime,
				})
			}catch(e){
				await console.log(e.message);
			}
		}
	}
	
	
	
	

await console.log("DOne");
}


const handler = async (csvRows) =>{
	
	var counter = 1;
	while(1){
		await console.log("Listing Phase "+counter +": ");		
		await makeOffer(csvRows);
		await console.log("Waiting\n");
		await sleep(time*60000);
		await sleep(parseInt(csvRows.length) * 3000);
		counter = counter + 1;
	}	
	
}


const main = async () =>{
	
	let csvRows = [];

	fs.createReadStream(fileName)
	  .pipe(csv())
	  .on("data", (row) => {
		csvRows.push(row);
	  })
	  .on("end", async () => {
		await handler(csvRows);
		console.log("Completed");
		process.exit();
	});
	
	
}
main();