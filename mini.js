const response1 = await fetch("https://www.pokemon-zone.com/api/cards/search");
const text1 = await response1.json();
let data1 = [];
text1.data.results.forEach(item => {
	slNo = item.expansionId + "-" + item.url.split("/")[3].padStart(3, "0");
	if(!item.expansionId.startsWith("PROMO"))
		series = item.expansionId.split("")[0];
	else
		series = item.expansionId.split("-")[1];
	
	if(item.cardDefKey.startsWith("PK"))
		cardType = "Pokemon"
	else
		cardType = "Trainer"
	
	data1.push({slNo, series, setid: item.expansionId, name: item.name, imgUrl: item.displayImageUrl, cardId: item.cardDefKey, cardType})
})

const response2 = await fetch("https://www.pokemon-zone.com/api/players/5811072974828985");
const text2 = await response2.json();
let data2 = [];
text2.data.cards.forEach(item => {
	data2.push({cardId: item.cardId, firstReceivedAt: item.firstReceivedAt, lastReceivedAt: item. lastReceivedAt, amount: item.amount});
})

const combined = data1.map(d1 => {
	const d2 = data2.find(item => item.cardId === d1.cardld);
	return d2? {...d1, ...d2}: d1;
});
