const response1 = await fetch("https://www.pokemon-zone.com/api/cards/search", {
    
    redirect: "follow"
  });
  const text1 = await response1.json();
  let data1 = [];
  let slNo = "";
  let series = "";
  let cardType = "";
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
    let str = item.displayImageUrl.split("_");
    let rarity = str[str.length-1].replace(".webp", "");

    data1.push({slNo, series, setId: item.expansionId, name: item.name, imgUrl: 'https://ghmaxnwhnxjjjjpnhpfi.supabase.co/storage/v1/object/public/ptcgp/Cards/' + slNo + '.webp', cardId: item.cardDefKey, cardType, rarity: rarityObj[rarity]})
  })

  const response2 = await fetch("https://www.pokemon-zone.com/api/players/5811072974828985", {
    
    redirect: "follow"
  })
  const text2 = await response2.json();
  let data2 = [];
  text2.data.cards.forEach(item => {
    data2.push({cardId: item.cardId, firstReceivedAt: item.firstReceivedAt, lastReceivedAt: item.lastReceivedAt, amount: item.amount});
  })

  const combined = data1.map(meta => {
    const inv = data2.find(item => item.cardId === meta.cardId);
    return inv ? { ...meta, ...inv } : meta;
  });
