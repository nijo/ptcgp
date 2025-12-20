const keysToRemove = ["variants", "url", "uniqueSkinIds", "skinExchangePaths", "seriesId", "mirrorType", "rulesDescription", "rarity", "promotionName", "isSerial", "isInAllExpansionPacks", "foundInPacks", "isPromo", "characterId", "logoAssetUrl", "iconAssetUrl", "displaySchedule", "expansionIds", "amountLang_JA", "amountLang_EN", "amountLang_CN", "amountLang_FR", "amountLang_IT", "amountLang_DE", "amountLang_ES", "amountLang_BR", "amountLang_KR", "assetUrl", "displayName", "isSpecial", "packId", "sku", "slug", "sortOrderPriority", "bgColorLeft", "bgColorRight", "cardCount", "packIds", "packSetAssetUrl", "cardType", "evolutionStage", "evolutionStageNumber", "iconUrl", "isEx", "isUltraBeast", "retreatEnergyList", "damageSymbol", "isNoDamage", "pokemonAttackId", "pokemonId", "pokemonAbilityId", "closeAt", "trainerId", "trainerTypeLabel", "id"];

function removeKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => removeKeys(item, keysToRemove));
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key]) => !keysToRemove.includes(key))
        .map(([key, value]) => [key, removeKeys(value, keysToRemove)])
    );
  }
  return obj;
}

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Authorization", "Bearer *************************************************************************");



const response1 = await fetch("https://www.pokemon-zone.com/api/game/card-data/");
const text1 = await response1.json();
const data1 = text1.cards;
const cleanedData1 = removeKeys(data1);
const output1 = cleanedData1.flatMap(obj =>
	obj.expansionCollectionNumbers.map(item => ({
		cardId: obj.cardId,
		rarityName: obj.rarityName,
		illustrationUrl: obj.illustrationUrl,
		illustratorNames: obj.illustratorNames,
		isPromotion: obj.isPromotion,
		name: obj.name,
		description: obj.description,
		flavorText: obj.flavorText,
		promotionCardSource: obj.promotionCardSource,
		collectionNumber: obj.collectionNumber,
		expansionCollectionNumbers: item,
		pokemon: obj.pokemon,
		trainer: obj.trainer,
		dustCost: obj.dustCost,
		availablePacks: obj.availablePacks,
		expansion: obj.expansion,
		pokedexNumber: obj.pokedexNumber,
		mirrorTypeLabel: obj.mirrorTypeLabel
	}))
);

let data3 = {}
data3["expansions"] = text1.data.expansions;
data3["packs"] = text1.data.packs
const output2 = data3;

fetch("https://ghmaxnwhnxjjjjpnhpfi.supabase.co/functions/v1/ptcgp/full", {
  method: "POST",
  headers: myHeaders,
  body: JSON.stringify(output1),
  redirect: "follow"
})
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));

fetch("https://ghmaxnwhnxjjjjpnhpfi.supabase.co/functions/v1/ptcgp/set", {
  method: "POST",
  headers: myHeaders,
  body: JSON.stringify(output2),
  redirect: "follow"
})
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
