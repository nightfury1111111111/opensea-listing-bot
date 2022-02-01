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

const MNEMONIC =  "couch proof demand scorpion region thought light spoil aisle flat dance solar";
const rpcUrl = "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
const accountAddress = "0x0c7a57f76CE32979AffAA499a17311cc7407C3ff";


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
		apiKey: "e82da5b3a902422a9bc4d4a8ee55684f"
	},
	(arg,err) => console.log(arg,err));
	console.log('Seaport');	
	
	for(var i=0;i<csvRows.length;i++){
		
		await console.log("Row # " + parseInt(i+1));
		await console.log(csvRows[i]);
		var url = csvRows[i]['URL'].toString().split('/');					
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