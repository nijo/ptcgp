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
myHeaders.append("Authorization", "Bearer ************************************************************************");

const response = await fetch("https://www.pokemon-zone.com/api/players/5811072974828985/");
const text = await response.json();
const data = text.data.cards;
const output = removeKeys(data);

fetch("https://ghmaxnwhnxjjjjpnhpfi.supabase.co/functions/v1/ptcgp/sync", {
  method: "POST",
  headers: myHeaders,
  body: JSON.stringify(output),
  redirect: "follow"
})
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
