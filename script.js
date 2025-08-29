const keysToRemove = ["variants", "url", "uniqueSkinIds", "skinExchangePaths", "seriesId", "rulesDescription", "rarity", "promotionName", "isSerial", "isInAllExpansionPacks", "foundInPacks", "isPromo", "characterId", "logoAssetUrl", "iconAssetUrl", "displaySchedule", "expansionIds", "amountLang_JA", "amountLang_EN", "amountLang_CN", "amountLang_FR", "amountLang_IT", "amountLang_DE", "amountLang_ES", "amountLang_BR", "amountLang_KR", "assetUrl", "displayName", "isSpecial", "packId", "sku", "slug", "sortOrderPriority", "bgColorLeft", "bgColorRight", "cardCount", "packIds", "packSetAssetUrl", "cardType", "evolutionStage", "evolutionStageNumber", "iconUrl", "isEx", "isUltraBeast", "retreatEnergyList", "damageSymbol", "isNoDamage", "pokemonAttackId", "pokemonId", "pokemonAbilityId", "closeAt", "trainerId", "trainerTypeLabel", "id"];

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

const response1 = await fetch("https://www.pokemon-zone.com/api/game/game-data/");
const text1 = await response1.json();
const data1 = text1.data.cards;
const cleanedData1 = removeKeys(data1);

const response2 = await fetch("https://www.pokemon-zone.com/api/players/5811072974828985/");
const text2 = await response2.json();
const data2 = text2.data.cards;
const cleanedData2 = removeKeys(data2);


let data3 = {}
data3["expansions"] = text1.data.expansions;
data3["packs"] = text1.data.packs
